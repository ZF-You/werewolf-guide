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
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
JCMS_PATH = ROOT / "data" / "jcms-seasons.js"
HISTORY_PATH = ROOT / "data" / "jcms-update-history.json"
MID = 19106800
SEASON_ID = 8992596
SEASON_TITLE = "昆仑归墟"
SEASON_SOURCE_TITLE = "昆仑归墟"
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


def append_update_history(added: list[dict]) -> None:
    if not added:
        return
    history = json.loads(HISTORY_PATH.read_text(encoding="utf-8-sig")) if HISTORY_PATH.exists() else []
    now = datetime.now(ZoneInfo("Asia/Shanghai"))
    details = "；".join(episode_history_label(item) for item in added)
    history.insert(
        0,
        {
            "timestamp": now.isoformat(timespec="seconds"),
            "date": now.date().isoformat(),
            "content": f"自动更新京城大师赛“{SEASON_TITLE}”：新增 {len(added)} 条对局视频：{details}。",
        },
    )
    HISTORY_PATH.write_text(
        json.dumps(history, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


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
        "mid": season.get("mid") or MID,
        "season_id": season.get("id") or SEASON_ID,
    }
    return episodes, metadata


def parse_title_parts(title: str) -> dict[str, str]:
    source = title.strip().replace("_狼人杀", "")
    source = source.split("+", 1)[0].strip()
    source = re.sub(r"^京城大师赛S?\d*", "", source).strip()
    if source.startswith(SEASON_TITLE):
        source = source[len(SEASON_TITLE) :].strip()

    date_match = re.search(r"(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)", source)
    date_compact = "".join(date_match.groups()) if date_match else ""
    date = "-".join(date_match.groups()) if date_match else ""
    stage_match = re.search(r"表演赛|正赛|决赛", source)
    issue_match = re.search(r"第[一二三四五六七八九十百]+期", source)
    day_match = re.search(r"Day-\d+", source, re.I)
    game_match = re.search(r"第[一二三四五六七八九十百]+局", source)

    board_start = game_match.end() if game_match else date_match.end() if date_match else 0
    board = source[board_start:]
    board = re.sub(r"^(?:\s*[-·—:]\s*)+", "", board).strip()
    board = re.sub(r"^(?:表演赛|正赛|决赛)", "", board).strip()
    board = re.sub(r"^第[一二三四五六七八九十百]+期", "", board).strip()
    board = re.sub(r"^Day-\d+", "", board, flags=re.I).strip()
    board = board or "非对局/待补充"

    stage = stage_match.group(0) if stage_match else "其他"
    issue = issue_match.group(0) if issue_match else ""
    day = day_match.group(0) if day_match else ""
    game = game_match.group(0) if game_match else ""
    title_parts = [date_compact, stage if stage != "其他" else "", issue, day]
    normalized_title = " ".join(part for part in title_parts if part)
    normalized_title += f" {game}" if game else ""
    normalized_title += f"-{board}" if normalized_title else board

    return {
        "title": normalized_title.strip(),
        "date": date,
        "stage": stage,
        "issue": issue,
        "game": game,
        "board": board,
    }


def episode_history_label(episode: dict) -> str:
    parts = [
        episode.get("date", ""),
        episode.get("stage", "") if episode.get("stage") != "其他" else "",
        episode.get("issue", ""),
        episode.get("game", "") or "未标注局次",
        episode.get("board", "") or "待补充版型",
    ]
    return " · ".join(part for part in parts if part)


def normalize_episode(raw: dict) -> dict:
    parts = parse_title_parts(str(raw.get("title") or ""))
    title = parts["title"]
    bvid = str(raw.get("bvid") or "")
    page = raw.get("page") or {}
    arc = raw.get("arc") or {}
    duration = int(raw.get("duration") or page.get("duration") or arc.get("duration") or 0)
    aid = int(raw.get("aid") or arc.get("aid") or 0)
    cid = int(raw.get("cid") or page.get("cid") or 0)
    pubdate = int(raw.get("pubdate") or arc.get("pubdate") or arc.get("ctime") or 0)
    episode = {
        "title": title,
        "bvid": bvid,
        "url": f"https://www.bilibili.com/video/{bvid}",
        "duration": duration,
        "board": parts["board"],
        "stage": parts["stage"],
        "issue": parts["issue"],
        "game": parts["game"],
        "date": parts["date"],
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


def update_data(raw_episodes: list[dict], metadata: dict) -> tuple[int, int]:
    normalized = [normalize_episode(item) for item in raw_episodes]
    normalized = [item for item in normalized if item["bvid"] and item["title"]]
    unique = {item["bvid"]: item for item in normalized}
    episodes = sorted(unique.values(), key=sort_key)

    jcms = load_js_json(JCMS_PATH, "JCMS_SEASONS")
    season = next(
        (
            item
            for item in jcms["seasons"]
            if int(item.get("id", 0)) == SEASON_ID
            or item.get("title") == SEASON_TITLE
        ),
        None,
    )
    if season is None:
        season = {"id": SEASON_ID, "episodes": [], "boards": []}
        jcms["seasons"].insert(0, season)
    source_changed = int(season.get("id", 0)) not in {0, SEASON_ID}
    previous_bvids = {item.get("bvid") for item in season.get("episodes", [])}
    added = [] if source_changed else [item for item in episodes if item["bvid"] not in previous_bvids]
    season["id"] = SEASON_ID
    season["title"] = SEASON_TITLE
    season["sourceTitle"] = metadata.get("name") or SEASON_SOURCE_TITLE
    season["completed"] = False
    season["episodeCount"] = len(episodes)
    season["episodes"] = episodes
    counts = Counter(item["board"] for item in episodes)
    season["boards"] = [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]
    write_js_json(JCMS_PATH, "JCMS_SEASONS", jcms)

    append_update_history(added)
    return len(episodes), len(added)


def main() -> None:
    args = parse_args()
    if args.html_file:
        raw_episodes, metadata = extract_saved_html(args.html_file)
    else:
        raw_episodes, metadata = fetch_collection()
    actual_mid = int(metadata.get("mid") or 0)
    actual_season_id = int(metadata.get("season_id") or 0)
    if actual_mid and actual_mid != MID:
        raise RuntimeError(f"Unexpected Bilibili account: {actual_mid} (expected {MID})")
    if actual_season_id and actual_season_id != SEASON_ID:
        raise RuntimeError(
            f"Unexpected Bilibili collection: {actual_season_id} (expected {SEASON_ID})"
        )
    count, added = update_data(raw_episodes, metadata)
    print(f"Updated {SEASON_TITLE}: {count} videos ({added} new)")


if __name__ == "__main__":
    main()
