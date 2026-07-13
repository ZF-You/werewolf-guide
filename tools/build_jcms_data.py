from __future__ import annotations

import json
import re
import sys
from pathlib import Path


KNOWN_BOARDS = [
    "机械狼通灵师",
    "预女猎白混",
    "预女猎禁混",
    "预女猎白",
    "盗宝大师",
    "假面舞会",
    "诡术之境",
    "唯邻是从",
    "孤注一掷",
    "捣蛋鬼",
    "狼王守卫",
    "狼王骑士",
    "黑狼王骑士",
    "骑士白狼王",
    "石像鬼守墓人",
    "狼美人猎人",
    "狼美猎人",
    "狼美骑士",
    "美杜莎之眼",
    "针锋相杠",
    "真假预言家",
    "盗贼丘比特",
    "睡美人",
    "神秘交易",
    "禁言长老",
    "鬼魂新娘",
    "魔幻对决",
    "魔幻对局",
    "熊隐狼",
    "趣味狼人杀",
]


def extract_js_object(text: str, marker: str) -> dict:
    start = text.index(marker) + len(marker)
    depth = 0
    in_str = False
    escaped = False

    for index, char in enumerate(text[start:], start):
        if in_str:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_str = False
            continue

        if char == '"':
            in_str = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : index + 1])

    raise ValueError(f"Could not find end of {marker}")


def repair_text(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return ""

    try:
        candidate = text.encode("gb18030").decode("utf-8")
    except UnicodeError:
        return text

    if "�" in candidate:
        return text

    return candidate if score_text(candidate) >= score_text(text) else text


def score_text(text: str) -> int:
    good_words = [
        "京城大师赛",
        "正赛",
        "表演赛",
        "特辑",
        "预女猎",
        "狼王",
        "狼美人",
        "机械狼",
        "通灵师",
        "盗宝大师",
        "假面舞会",
        "曙光",
        "航纪",
    ]
    bad_chars = "姝绗灞棰曠嫾鐚庢湡鏇欏厜鑸邯"
    return sum(text.count(word) * 6 for word in good_words) - sum(text.count(char) for char in bad_chars)


def clean_episode(item: dict, section_title: str, season_title: str) -> dict:
    archive = item.get("arc") or item
    title = repair_text(archive.get("title") or item.get("title") or "")
    bvid = archive.get("bvid") or item.get("bvid") or ""
    duration = archive.get("duration") or item.get("duration") or 0

    episode = {
        "title": title,
        "bvid": bvid,
        "url": f"https://www.bilibili.com/video/{bvid}" if bvid else "",
        "duration": duration,
        "board": get_board_name(title),
        "stage": get_stage_name(title),
        "date": get_date_text(title),
        "section": repair_text(section_title),
        "seasonTitle": season_title,
    }
    if (
        "天空之城" in season_title
        and not episode["date"]
        and ("第二局-唯邻是从" in title or "第三局-机械狼通灵师" in title)
    ):
        episode["date"] = "2024-09-04"
    return episode


def get_board_name(title: str) -> str:
    normalized = title.replace("—", "-").replace("－", "-")
    for board in sorted(KNOWN_BOARDS, key=len, reverse=True):
        if board in normalized:
            if board == "狼美猎人":
                return "狼美人猎人"
            if board == "魔幻对局":
                return "魔幻对决"
            return board

    if "-" not in normalized:
        return "非对局/待补充"
    board = normalized.rsplit("-", 1)[-1].strip()
    board = re.sub(r"^\d+\s*", "", board)
    board = re.sub(r"^第[一二三四五六七八九十]+局\s*", "", board)
    return board or "非对局/待补充"


def get_stage_name(title: str) -> str:
    if "表演赛" in title:
        return "表演赛"
    if "正赛" in title:
        return "正赛"
    if "特辑" in title:
        return "特辑"
    return "其他"


def get_date_text(title: str) -> str:
    match = re.match(r"^(\d{8})", title)
    if not match:
        return ""
    value = match.group(1)
    return f"{value[:4]}-{value[4:6]}-{value[6:8]}"


def parse_source(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if "window.__INITIAL_STATE__=" not in text:
        return None

    state = extract_js_object(text, "window.__INITIAL_STATE__=")
    video = state.get("videoData") or {}
    season = video.get("ugc_season") or {}
    sections = season.get("sections") or []
    season_title = repair_text(season.get("title") or video.get("title") or "未命名合集")
    display_title = clean_season_title(season_title)
    season_id = season.get("id") or video.get("bvid") or str(path)

    episodes: list[dict] = []
    seen: set[str] = set()
    for section in sections:
        section_title = section.get("title") or section.get("section_title") or ""
        for item in section.get("episodes") or []:
            episode = clean_episode(item, section_title, season_title)
            key = episode["bvid"] or episode["title"]
            if key in seen:
                continue
            seen.add(key)
            episodes.append(episode)

    if not episodes and video.get("bvid"):
        single = clean_episode(video, "", season_title)
        episodes.append(single)

    return {
        "id": season_id,
        "title": display_title,
        "sourceTitle": season_title,
        "episodeCount": len(episodes),
        "episodes": episodes,
        "boards": count_by(episodes, "board"),
    }


def clean_season_title(title: str) -> str:
    if "天空之城" in title:
        return "天空之城"
    if "深海迷航" in title:
        return "深海迷航"
    return title


def count_by(items: list[dict], key: str) -> list[dict]:
    counts: dict[str, int] = {}
    for item in items:
        value = item.get(key) or "待补充"
        counts[value] = counts.get(value, 0) + 1
    return [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    ]


def merge_seasons(seasons: list[dict]) -> list[dict]:
    merged: dict[str, dict] = {}
    for season in seasons:
        key = str(season["id"])
        if key not in merged:
            merged[key] = {**season, "episodes": []}
        existing_bvids = {episode["bvid"] for episode in merged[key]["episodes"]}
        for episode in season["episodes"]:
            if episode["bvid"] in existing_bvids:
                continue
            merged[key]["episodes"].append(episode)
            existing_bvids.add(episode["bvid"])

    result = []
    for season in merged.values():
        season["episodeCount"] = len(season["episodes"])
        season["boards"] = count_by(season["episodes"], "board")
        result.append(season)
    return sorted(result, key=season_sort_key, reverse=True)


def season_sort_key(season: dict) -> tuple[str, str]:
    dates = [episode.get("date", "") for episode in season.get("episodes", []) if episode.get("date")]
    latest_date = max(dates) if dates else ""
    return latest_date, str(season.get("title", ""))


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python tools/build_jcms_data.py <output-js> <source-html>...")

    output = Path(sys.argv[1])
    sources = [Path(arg) for arg in sys.argv[2:]]
    seasons = [season for source in sources if (season := parse_source(source))]
    payload = {
        "title": "京城大师赛",
        "seasons": merge_seasons(seasons),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        "window.JCMS_SEASONS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {output} with {len(payload['seasons'])} seasons")


if __name__ == "__main__":
    main()

