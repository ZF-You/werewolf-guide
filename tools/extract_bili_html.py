from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin


def extract_js_object(text: str, marker: str) -> dict:
    start = text.index(marker) + len(marker)
    depth = 0
    in_str = False
    escaped = False
    end = None

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
                end = index + 1
                break

    if end is None:
        raise ValueError(f"Could not find end of {marker}")
    return json.loads(text[start:end])


def clean_episode(item: dict) -> dict:
    archive = item.get("arc") or item
    title = archive.get("title") or item.get("title") or ""
    bvid = archive.get("bvid") or item.get("bvid") or ""
    aid = archive.get("aid") or item.get("aid")
    cid = archive.get("cid") or item.get("cid")
    page = item.get("page") or archive.get("page")
    duration = archive.get("duration") or item.get("duration")
    return {
        "title": title,
        "bvid": bvid,
        "aid": aid,
        "cid": cid,
        "page": page,
        "duration": duration,
        "url": f"https://www.bilibili.com/video/{bvid}" if bvid else "",
    }


def main() -> None:
    if len(sys.argv) not in {2, 3}:
        raise SystemExit("Usage: python tools/extract_bili_html.py <pasted-html.txt> [output-js]")

    source = Path(sys.argv[1])
    text = source.read_text(encoding="utf-8", errors="replace")
    state = extract_js_object(text, "window.__INITIAL_STATE__=")
    video = state.get("videoData", {})
    season = video.get("ugc_season") or {}
    sections = season.get("sections") or []

    episodes = []
    for section in sections:
        for episode in section.get("episodes") or []:
            episodes.append({
                **clean_episode(episode),
                "section": section.get("title") or section.get("section_title") or "",
                "season_title": season.get("title") or "",
            })

    subtitles = []
    subtitle_data = video.get("subtitle") or {}
    for item in subtitle_data.get("list") or []:
        url = item.get("subtitle_url") or ""
        subtitles.append({
            "lan": item.get("lan"),
            "lan_doc": item.get("lan_doc"),
            "url": urljoin("https:", url) if url.startswith("//") else url,
        })

    summary = {
        "source": str(source),
        "page_title": re.search(r"<title>(.*?)</title>", text, re.S).group(1) if re.search(r"<title>(.*?)</title>", text, re.S) else "",
        "video": {
            "title": video.get("title"),
            "bvid": video.get("bvid"),
            "aid": video.get("aid"),
            "cid": video.get("cid"),
            "duration": video.get("duration"),
            "pubdate": video.get("pubdate"),
            "desc": video.get("desc"),
            "owner": (video.get("owner") or {}).get("name"),
        },
        "season": {
            "id": season.get("id"),
            "title": season.get("title"),
            "mid": season.get("mid"),
            "section_count": len(sections),
            "episode_count": len(episodes),
        },
        "sections": [
            {
                "title": section.get("title") or section.get("section_title") or "",
                "episode_count": len(section.get("episodes") or []),
            }
            for section in sections
        ],
        "episodes": episodes,
        "subtitles": subtitles,
        "bvid_count_in_html": len(set(re.findall(r"BV[0-9A-Za-z]{10}", text))),
    }

    if len(sys.argv) == 3:
        output = Path(sys.argv[2])
        output.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(summary, ensure_ascii=False, indent=2)
        output.write_text(f"window.SEASON_DAWN_VOYAGE = {payload};\n", encoding="utf-8")
        print(f"Wrote {output}")
    else:
        print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

