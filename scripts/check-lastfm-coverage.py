"""
Check Last.fm tag.getInfo coverage for all genres in genres_index.json.

Output: data/lastfm_coverage.json
Rate limit: 5 requests/second (Last.fm allows ~5/s for free keys)
"""

import json
import os
import re
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / "public" / "data" / "genres_index.json"
OUT_PATH = ROOT / "data" / "lastfm_coverage.json"
RATE_LIMIT = 0.2  # seconds between requests (5/s)


def get_api_key():
    key = os.environ.get("LASTFM_API_KEY")
    if key:
        return key

    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            # support both LASTFM_API_KEY and VITE_LASTFM_API_KEY
            if k.strip() in ("LASTFM_API_KEY", "VITE_LASTFM_API_KEY"):
                return v.strip()
    return None


def strip_html_and_stub(text):
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", "", text)
    clean = re.sub(r"Read more on Last\.?\s*fm\.?", "", clean, flags=re.IGNORECASE)
    return clean.strip()


def check_genre(name, api_key):
    params = urllib.parse.urlencode({
        "method": "tag.getinfo",
        "tag": name,
        "api_key": api_key,
        "format": "json",
    })
    url = f"https://ws.audioscrobbler.com/2.0/?{params}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "genre-explorer/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())

        summary_raw = data.get("tag", {}).get("wiki", {}).get("summary", "")
        summary = strip_html_and_stub(summary_raw)
        has_desc = len(summary) >= 20
        return has_desc, summary[:120] if has_desc else None
    except Exception:
        return False, None


def main():
    api_key = get_api_key()
    if not api_key:
        print("ERROR: No API key found.")
        print("  Set LASTFM_API_KEY env var or add VITE_LASTFM_API_KEY to .env")
        return

    if not INDEX_PATH.exists():
        print(f"ERROR: {INDEX_PATH} not found. Run parse-genres.py first.")
        return

    with open(INDEX_PATH, encoding="utf-8") as f:
        genres = json.load(f)

    total = len(genres)
    print(f"Checking Last.fm coverage for {total} genres...")
    print(f"Rate limit: {1/RATE_LIMIT:.0f} req/s — estimated time: ~{total * RATE_LIMIT / 60:.0f} min\n")

    # resume support: load existing progress
    with_desc = []
    without_desc = []
    checked_names = set()

    if OUT_PATH.exists():
        try:
            existing = json.load(open(OUT_PATH, encoding="utf-8"))
            for item in existing.get("with_description", []):
                with_desc.append(item)
                checked_names.add(item["name"])
            for name in existing.get("without_description", []):
                without_desc.append(name)
                checked_names.add(name)
            if checked_names:
                print(f"Resuming from {len(checked_names)} previously checked genres.\n")
        except Exception:
            pass

    start_time = time.time()

    try:
        for i, genre in enumerate(genres):
            name = genre["name"]

            if name in checked_names:
                continue

            has_desc, preview = check_genre(name, api_key)

            if has_desc:
                with_desc.append({"name": name, "preview": preview})
            else:
                without_desc.append(name)

            done = len(with_desc) + len(without_desc)
            if done % 100 == 0:
                elapsed = time.time() - start_time
                pct = done / total * 100
                cov = len(with_desc) / done * 100 if done else 0
                print(f"  [{done}/{total}] {pct:.0f}% checked | coverage so far: {cov:.1f}% | elapsed: {elapsed:.0f}s")

            time.sleep(RATE_LIMIT)

    except KeyboardInterrupt:
        print(f"\n\nInterrupted. Saving progress...")

    # save results
    done = len(with_desc) + len(without_desc)
    coverage_pct = len(with_desc) / done * 100 if done else 0

    report = {
        "total_genres": total,
        "checked": done,
        "with_description_count": len(with_desc),
        "without_description_count": len(without_desc),
        "coverage_percent": round(coverage_pct, 1),
        "with_description": with_desc,
        "without_description": without_desc,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"  Total genres:  {total}")
    print(f"  Checked:       {done}")
    print(f"  With desc:     {len(with_desc)}")
    print(f"  Without desc:  {len(without_desc)}")
    print(f"  Coverage:      {coverage_pct:.1f}%")
    print(f"{'='*50}")
    print(f"\nSaved to {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
