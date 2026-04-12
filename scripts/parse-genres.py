"""
Parse EveryNoise genre_attrs.csv → public/data/genres_index.json

Input:  data/raw/genre_attrs.csv  (columns: genre, x, y, hex_colour)
Output: public/data/genres_index.json
"""

import csv
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "raw" / "genre_attrs.csv"
OUT_PATH = ROOT / "public" / "data" / "genres_index.json"


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    return slug


def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found. Download it first:")
        print(f"  curl -o data/raw/genre_attrs.csv https://raw.githubusercontent.com/AyrtonB/EveryNoise-Watch/main/data/genre_attrs.csv")
        return

    genres = []

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["genre"].strip()
            if not name:
                continue
            genres.append({
                "name": name,
                "slug": slugify(name),
                "x": int(row["x"]),
                "y": int(row["y"]),
                "color": row["hex_colour"].strip(),
            })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(genres, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"OK - {len(genres)} genres -> {OUT_PATH.relative_to(ROOT)} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
