"""
Scrape artists and related genres from EveryNoise at Once genre pages.

EveryNoise has been frozen since November 2023, so this is a one-shot batch
scrape and the resulting dataset does not go stale.

For every genre in public/data/genres_index.json this script fetches
https://everynoise.com/engenremap-<slug>.html and extracts:
  - up to 20 artists, ranked by the font-size percentage EveryNoise uses to
    encode an artist's relevance within the genre (bigger = more relevant)
  - the genre names from the "Related Genres" box (verbatim, so they can be
    cross-referenced against the index later)

Output (layer 2 of the app's two-layer data architecture — the index is the
eagerly-loaded layer 1; everything per-genre is lazy-loaded on demand):
  - public/data/genres/<slug>.json   one file per genre:
      { "slug": ..., "name": ..., "artists": [{"name","id"}...], "related": [...] }
    Individual files (not chunks) because the app already resolves all
    per-genre detail lazily per genre (Last.fm, Wikipedia, Deezer hooks), so
    one fetch per genre view matches the existing pattern and wastes no bytes.
  - data/everynoise_coverage.json    stats, same spirit as lastfm_coverage.json
  - data/everynoise_errors.json      genres without a page (404), pages
                                     without artists, network failures

The script is resumable: per-genre files are written immediately, and on
relaunch any genre with an existing output file — or already recorded as
having no page — is skipped. Coverage stats are rebuilt from the files on
disk, so they stay consistent across partial runs.

Rate limit: 1 request/second with an identifying User-Agent. EveryNoise is
maintained by one person without Spotify's backing — be polite.

Dependencies (Python 3.9+):
    pip install requests beautifulsoup4

Usage:
    python scripts/scrape-everynoise-artists.py                # full batch
    python scripts/scrape-everynoise-artists.py --sample 30    # 30 random genres (fixed seed)
    python scripts/scrape-everynoise-artists.py --report       # print markdown coverage summary
"""

import argparse
import json
import random
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / "public" / "data" / "genres_index.json"
OUT_DIR = ROOT / "public" / "data" / "genres"
COVERAGE_PATH = ROOT / "data" / "everynoise_coverage.json"
ERRORS_PATH = ROOT / "data" / "everynoise_errors.json"

BASE_URL = "https://everynoise.com/engenremap-{slug}.html"
USER_AGENT = "genre-explorer/1.0 (one-time batch; https://github.com/Bu-chip/genre-explorer; mborrajor@gmail.com)"
RATE_LIMIT = 1.0  # seconds between requests — do not lower this
MAX_ARTISTS = 20
LOW_ARTIST_THRESHOLD = 5
SAMPLE_SEED = 42
SAVE_EVERY = 25


# ---------------------------------------------------------------- slug mapping

def _strip_to_alnum(text):
    return re.sub(r"[^a-z0-9]", "", text.lower())


def _translit(text):
    # é→e, ñ→n; anything that doesn't decompose to ASCII is dropped
    decomposed = unicodedata.normalize("NFKD", text)
    return decomposed.encode("ascii", "ignore").decode("ascii")


def _repair_mojibake(text):
    # genres_index.json has at least one UTF-8-read-as-Latin-1 name
    # ("mÃºsica pitiusa" → "música pitiusa")
    try:
        repaired = text.encode("latin-1").decode("utf-8")
        return repaired if repaired != text else None
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None


def url_slug_candidates(name):
    """EveryNoise URL slugs lowercase the name and drop every non-alphanumeric
    character ("power noise" → powernoise, "dutch r&b" → dutchrb). For
    non-ASCII names the exact rule is unverified, so try transliteration
    first, then plain removal. Returns deduped candidates in priority order."""
    bases = [name]
    repaired = _repair_mojibake(name)
    if repaired:
        bases.insert(0, repaired)

    candidates = []
    for base in bases:
        for variant in (_strip_to_alnum(_translit(base)), _strip_to_alnum(base)):
            if variant and variant not in candidates:
                candidates.append(variant)
    return candidates


# ---------------------------------------------------------------- fetch/parse

def fetch(session, url):
    """GET with 2 retries on network errors / 5xx. Returns (html, status):
    (text, 200), (None, 404), or raises after exhausted retries."""
    last_err = None
    for attempt in range(3):
        if attempt:
            time.sleep(2 * attempt)
        try:
            resp = session.get(url, timeout=30)
        except requests.RequestException as err:
            last_err = err
            continue
        if resp.status_code == 404:
            return None, 404
        if resp.status_code >= 500:
            last_err = RuntimeError(f"HTTP {resp.status_code}")
            continue
        resp.raise_for_status()
        return resp.text, 200
    raise last_err


def parse_font_size(style):
    match = re.search(r"font-size:\s*([\d.]+)\s*%", style or "")
    return float(match.group(1)) if match else 0.0


NEARBY_ID_RE = re.compile(r"^nearbyitem\d+$")


def parse_genre_page(html, own_slugs):
    """Extract artists and related genres from an engenremap-<slug>.html page.

    Verified against real pages (debug/pianoblues.html, debug/bozlak.html on
    the data/everynoise-scrape branch). A genre page has three .canvas blocks
    of "genre"-class scatter divs, distinguishable by div id:
      - id=itemN       artists of the genre; navlink → artistprofile.html?id=
                       <spotify artist id>; font-size % encodes relevance
      - id=nearbyitemN the "Related Genres" box; navlink → engenremap-<slug>
                       .html#tunnel, except nearbyitem1 (the page's own genre,
                       navlink → everynoise1d-<slug>.html)
      - id=mirroritemN the dark "mirror" canvas of OPPOSITE genres — excluded
    """
    soup = BeautifulSoup(html, "html.parser")
    artists = []
    related = []
    seen_related = set()

    for div in soup.find_all("div", class_="genre"):
        nav = div.find("a", class_="navlink") or div.find("a", href=True)
        href = nav.get("href", "") if nav else ""
        if nav:
            nav.extract()  # so the div text is just the display name
        name = div.get_text().strip()
        if not name:
            continue

        if "artistprofile." in href:
            artist_id = parse_qs(urlparse(href).query).get("id", [None])[0]
            artists.append({
                "name": name,
                "id": artist_id,
                "size": parse_font_size(div.get("style")),
            })
        elif NEARBY_ID_RE.match(div.get("id", "")):
            slug_match = re.search(r"engenremap-([^/#]+)\.html", href)
            if not slug_match:
                continue  # the page's own genre links to everynoise1d-*.html
            if slug_match.group(1) in own_slugs:
                continue
            if name not in seen_related:
                seen_related.add(name)
                related.append(name)

    # rank by EveryNoise's own relevance signal, DOM order breaks ties
    artists.sort(key=lambda a: -a["size"])
    top = [{"name": a["name"], "id": a["id"]} for a in artists[:MAX_ARTISTS]]
    return top, related


# ---------------------------------------------------------------- persistence

def load_errors():
    if ERRORS_PATH.exists():
        try:
            data = json.load(open(ERRORS_PATH, encoding="utf-8"))
            return {
                "no_page": data.get("no_page", []),
                "no_artists": data.get("no_artists", []),
                "failed": data.get("failed", []),
            }
        except (json.JSONDecodeError, OSError):
            pass
    return {"no_page": [], "no_artists": [], "failed": []}


def save_errors(errors):
    ERRORS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(ERRORS_PATH, "w", encoding="utf-8") as f:
        json.dump(errors, f, ensure_ascii=False, indent=2)


def build_coverage(genres, errors):
    """Rebuild coverage stats from the per-genre files on disk so they stay
    correct across resumed/partial runs."""
    no_page_slugs = {e["slug"] for e in errors["no_page"]}
    with_page = 0
    low_artists = []
    without_page = []
    checked = 0

    for genre in genres:
        out_path = OUT_DIR / f"{genre['slug']}.json"
        if out_path.exists():
            checked += 1
            with_page += 1
            try:
                n = len(json.load(open(out_path, encoding="utf-8"))["artists"])
            except (json.JSONDecodeError, OSError, KeyError):
                n = 0
            if n < LOW_ARTIST_THRESHOLD:
                low_artists.append({"name": genre["name"], "artists": n})
        elif genre["slug"] in no_page_slugs:
            checked += 1
            without_page.append(genre["name"])

    coverage_pct = with_page / checked * 100 if checked else 0
    return {
        "total_genres": len(genres),
        "checked": checked,
        "with_page_count": with_page,
        "without_page_count": len(without_page),
        "low_artist_count": len(low_artists),
        "coverage_percent": round(coverage_pct, 1),
        "low_artists": low_artists,
        "without_page": without_page,
    }


def save_coverage(coverage):
    COVERAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(COVERAGE_PATH, "w", encoding="utf-8") as f:
        json.dump(coverage, f, ensure_ascii=False, indent=2)


def print_report():
    if not COVERAGE_PATH.exists():
        print("No coverage file yet — run the scraper first.")
        return
    cov = json.load(open(COVERAGE_PATH, encoding="utf-8"))
    print("## EveryNoise scrape coverage\n")
    print(f"| Stat | Value |")
    print(f"| --- | --- |")
    print(f"| Total genres in index | {cov['total_genres']} |")
    print(f"| Checked so far | {cov['checked']} |")
    print(f"| With page | {cov['with_page_count']} |")
    print(f"| Without page (404) | {cov['without_page_count']} |")
    print(f"| With <{LOW_ARTIST_THRESHOLD} artists | {cov['low_artist_count']} |")
    print(f"| Coverage | {cov['coverage_percent']}% |")


# ---------------------------------------------------------------- main loop

def scrape_genre(session, genre, errors):
    """Returns 'ok', 'no_page', 'no_artists' or 'failed' (and updates errors)."""
    candidates = url_slug_candidates(genre["name"])
    html = None
    for i, candidate in enumerate(candidates):
        if i:
            time.sleep(RATE_LIMIT)
        try:
            html, status = fetch(session, BASE_URL.format(slug=candidate))
        except Exception as err:
            errors["failed"].append({"name": genre["name"], "slug": genre["slug"],
                                     "error": f"{type(err).__name__}: {err}"})
            return "failed"
        if status == 200:
            break

    if html is None:
        errors["no_page"].append({"name": genre["name"], "slug": genre["slug"],
                                  "tried": candidates})
        return "no_page"

    artists, related = parse_genre_page(html, set(candidates))
    out = {"slug": genre["slug"], "name": genre["name"],
           "artists": artists, "related": related}
    out_path = OUT_DIR / f"{genre['slug']}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    if not artists:
        errors["no_artists"].append(genre["name"])
        return "no_artists"
    return "ok"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--sample", type=int, metavar="N",
                        help=f"scrape N random genres (fixed seed {SAMPLE_SEED}) instead of the full batch")
    parser.add_argument("--report", action="store_true",
                        help="print a markdown coverage summary and exit")
    args = parser.parse_args()

    if args.report:
        print_report()
        return

    if not INDEX_PATH.exists():
        sys.exit(f"ERROR: {INDEX_PATH} not found. Run parse-genres.py first.")

    with open(INDEX_PATH, encoding="utf-8") as f:
        all_genres = json.load(f)

    if args.sample:
        genres = random.Random(SAMPLE_SEED).sample(all_genres, args.sample)
        print(f"Sample mode: {args.sample} random genres (seed {SAMPLE_SEED})")
    else:
        genres = all_genres

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    errors = load_errors()
    # transient failures get retried on relaunch; 404s don't (the site is frozen)
    no_page_slugs = {e["slug"] for e in errors["no_page"]}
    errors["failed"] = []

    todo = [g for g in genres
            if not (OUT_DIR / f"{g['slug']}.json").exists()
            and g["slug"] not in no_page_slugs]
    skipped = len(genres) - len(todo)
    if skipped:
        print(f"Resuming: {skipped} genres already scraped or known 404, {len(todo)} to go.")
    print(f"Rate limit: 1 req/s — estimated time: ~{len(todo) * RATE_LIMIT / 60:.0f} min\n")

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT

    counts = {"ok": 0, "no_page": 0, "no_artists": 0, "failed": 0}
    start_time = time.time()

    try:
        for i, genre in enumerate(todo):
            if i:
                time.sleep(RATE_LIMIT)
            result = scrape_genre(session, genre, errors)
            counts[result] += 1

            done = i + 1
            if done % SAVE_EVERY == 0 or done == len(todo):
                save_errors(errors)
                save_coverage(build_coverage(all_genres, errors))
                elapsed = time.time() - start_time
                print(f"  [{done}/{len(todo)}] ok:{counts['ok']} no_page:{counts['no_page']} "
                      f"no_artists:{counts['no_artists']} failed:{counts['failed']} "
                      f"| elapsed: {elapsed:.0f}s")
    except KeyboardInterrupt:
        print("\nInterrupted. Saving progress...")

    save_errors(errors)
    coverage = build_coverage(all_genres, errors)
    save_coverage(coverage)

    print(f"\n{'=' * 50}")
    print(f"  This run:      ok {counts['ok']}, no_page {counts['no_page']}, "
          f"no_artists {counts['no_artists']}, failed {counts['failed']}")
    print(f"  Checked total: {coverage['checked']}/{coverage['total_genres']}")
    print(f"  With page:     {coverage['with_page_count']}")
    print(f"  Without page:  {coverage['without_page_count']}")
    print(f"  <{LOW_ARTIST_THRESHOLD} artists:    {coverage['low_artist_count']}")
    print(f"  Coverage:      {coverage['coverage_percent']}%")
    print(f"{'=' * 50}")
    print(f"\nPer-genre JSON in {OUT_DIR.relative_to(ROOT)}/")
    print(f"Coverage in {COVERAGE_PATH.relative_to(ROOT)}")
    print(f"Errors in {ERRORS_PATH.relative_to(ROOT)}")
    if counts["failed"]:
        print("\nNOTE: transient failures above will be retried on the next run.")


if __name__ == "__main__":
    main()
