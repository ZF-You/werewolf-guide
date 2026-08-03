#!/usr/bin/env python3
"""Update the latest JCMS season from its public Bilibili collection."""

from __future__ import annotations

import argparse
import json
import math
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JCMS_PATH = ROOT / "data" / "jcms-seasons.js"
DAWN_PATH = ROOT / "data" / "season-dawn-voyage.js"
MID = 19106800
SEASON_ID = 8209896
SEASON_TITLE = "曙光航纪"
API_URL = "https://api.bilibili.com/x/polymer/web-space/seasons_archives_list"
REFERER = f"https://space.bilibili.com/{MID}/lists/{SEASON_ID}?type=season"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--html-file",
        type=Path,
        help="Read episodes from a saved Bilibili video page instead of the API.",
    )
    return parser.parse_args()


def load_js_json(path: Path, variable: str) -> dict:
    raw = path.read_text(encoding="utf-8-sig").strip()
    prefix = f"window.{variable} ="
    if not raw.startswith(prefix):
        raise ValueError(f"Unexpected data format in {path}")
    payload = raw[len(prefix) :].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def write_js_json(path: Path, variable: str, data: dict) -> None:
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(f"window.{variable} = {payload};\n", encoding="utf-8", newline="\n")


def request_json(url: str) -> dict:
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Referer": REFERER,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
    }
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            time.sleep(2**attempt)
    raise RuntimeError(f"Bilibili request failed: {last_error}")


def fetch_collection() -> tuple[list[dict], dict]:
    episodes: list[dict] = []
    metadata: dict = {}
    page_num = 1
    page_size = 30

    while True:
        query = urllib.parse.urlencode(
            {
                "mid": MID,
                "season_id": SEASON_ID,
                "page_num": page_num,
                "page_size": page_size,
            }
        )
        payload = request_json(f"{API_URL}?{query}")
        if payload.get("code") != 0:
            raise RuntimeError(f"Bilibili API error: {payload.get('message', payload)}")
        data = payload.get("data") or {}
        archives = data.get("archives") or []
        if not archives:
            break
        episodes.extend(archives)
        metadata = data.get("meta") or metadata
        page = data.get("page") or {}
        total = int(page.get("total") or len(episodes))
        if page_num >= math.ceil(total / page_size):
            break
        page_num += 1

    if not episodes:
        raise RuntimeError("The Bilibili collection returned no videos.")
    return episodes, metadata


def extract_saved_html(path: Path) -> tuple[list[dict], dict]:
    html = path.read_text(encoding="utf-8")
    marker = "window.__INITIAL_STATE__="
    start = html.find(marker)
    if start < 0:
        raise ValueError("Saved page has no window.__INITIAL_STATE__ payload.")
    start += len(marker)
    end = html.find(";(function()", start)
    if end < 0:
        end = html.find(";</script>", start)
    state = json.loads(html[start:end])
    season = state["videoData"]["ugc_season"]
    episodes = [
        episode
        for section in season.get("sections", [])
        for episode in section.get("episodes", [])
    ]
    metadata = {
        "name": season.get("title") or SEASON_TITLE,
        "mid": MID,
        "season_id": season.get("id") or SEASON_ID,
    }
    return episodes, metadata


def normalize_title(title: str) -> str:
    title = title.strip().replace("_狼人杀", "")
    title = title.replace("20250723 正赛 第八期", "20260723 正赛 第八期")
    title = title.replace("盗宝大师赛", "盗宝大师")
    title = re.sub(r"(Day-2)\s+机械狼通灵师$", r"\1 第三局-机械狼通灵师", title)
    return title


def normalize_episode(raw: dict) -> dict:
    title = normalize_title(str(raw.get("title") or ""))
    bvid = str(raw.get("bvid") or "")
    page = raw.get("page") or {}
    arc = raw.get("arc") or {}
    duration = int(raw.get("duration") or page.get("duration") or arc.get("duration") or 0)
    aid = int(raw.get("aid") or arc.get("aid") or 0)
    cid = int(raw.get("cid") or page.get("cid") or 0)
    pubdate = int(raw.get("pubdate") or arc.get("pubdate") or arc.get("ctime") or 0)
    date_match = re.match(r"(\d{4})(\d{2})(\d{2})", title)
    date = "-".join(date_match.groups()) if date_match else ""
    board_match = re.search(
        r"Day-\d+(?:\s+第[一二三四五六七八九十]+局)?(?:\s*-\s*|\s+)(.+)$",
        title,
    )
    board = board_match.group(1).strip() if board_match else title.rsplit("-", 1)[-1].strip()
    stage = "表演赛" if "表演赛" in title else "正赛" if "正赛" in title else "其他"
    episode = {
        "title": title,
        "bvid": bvid,
        "url": f"https://www.bilibili.com/video/{bvid}",
        "duration": duration,
        "board": board,
        "stage": stage,
        "date": date,
        "section": "正片",
        "seasonTitle": SEASON_TITLE,
    }
    if pubdate:
        episode["pubdate"] = pubdate
    if aid:
        episode["aid"] = aid
    if cid:
        episode["cid"] = cid
    return episode


def sort_key(episode: dict) -> tuple:
    title = episode["title"]
    day = re.search(r"Day-(\d+)", title)
    game = re.search(r"第([一二三四五六七八九十]+)局", title)
    cn_number = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
    return (
        episode.get("date", ""),
        int(day.group(1)) if day else 0,
        cn_number.get(game.group(1), 0) if game else 0,
        episode.get("pubdate", 0),
        title,
    )


def update_data(raw_episodes: list[dict], metadata: dict, source: str) -> int:
    normalized = [normalize_episode(item) for item in raw_episodes]
    normalized = [item for item in normalized if item["bvid"] and item["title"]]
    unique = {item["bvid"]: item for item in normalized}
    episodes = sorted(unique.values(), key=sort_key)

    jcms = load_js_json(JCMS_PATH, "JCMS_SEASONS")
    season = next(item for item in jcms["seasons"] if int(item.get("id", 0)) == SEASON_ID)
    season["title"] = SEASON_TITLE
    season["sourceTitle"] = SEASON_TITLE
    season["episodeCount"] = len(episodes)
    season["episodes"] = episodes
    counts = Counter(item["board"] for item in episodes)
    season["boards"] = [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]
    write_js_json(JCMS_PATH, "JCMS_SEASONS", jcms)

    latest = episodes[-1]
    dawn = {
        "source": source,
        "page_title": latest["title"],
        "video": latest,
        "season": {
            "id": SEASON_ID,
            "title": metadata.get("name") or SEASON_TITLE,
            "mid": int(metadata.get("mid") or MID),
            "section_count": 1,
            "episode_count": len(episodes),
        },
        "sections": [{"title": "正片", "episode_count": len(episodes)}],
        "episodes": episodes,
    }
    write_js_json(DAWN_PATH, "SEASON_DAWN_VOYAGE", dawn)
    return len(episodes)


def main() -> None:
    args = parse_args()
    if args.html_file:
        raw_episodes, metadata = extract_saved_html(args.html_file)
    else:
        raw_episodes, metadata = fetch_collection()
    count = update_data(raw_episodes, metadata, REFERER)
    print(f"Updated {SEASON_TITLE}: {count} videos")


if __name__ == "__main__":
    main()
