"""
Offline regression test for the scrape-everynoise-artists.py parser.

The fixture below mirrors the REAL markup of EveryNoise genre pages, captured
via the workflow's debug mode (see debug/pianoblues.html and debug/bozlak.html
on the data/everynoise-scrape branch):
  - artists:        <div id=itemN class="genre scanme" ... font-size: N%>Name
                    <a class=navlink href="artistprofile.html?id=SPOTIFYID" ...>&raquo;</a> </div>
  - related box:    <div id=nearbyitemN class="genre" ...>name
                    <a class=navlink href="engenremap-slug.html#tunnel" ...>&raquo;</a> </div>
                    (nearbyitem1 is the page's own genre, linking everynoise1d-slug.html)
  - opposite box:   <div id=mirroritemN class="genre" ...> — must be EXCLUDED

Run: python scripts/test-scrape-parser.py
Dependencies: same as the scraper (beautifulsoup4).
"""

import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "scraper", Path(__file__).with_name("scrape-everynoise-artists.py"))
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)

# Condensed from debug/pianoblues.html — attribute layout kept verbatim.
FIXTURE = """<html>
<body>
<div class=title><a href="engenremap.html">Every Noise at Once</a> &middot; piano blues
<div style="font-size: 50%">the sound and shape of a genre, according to Spotify data as of November 2023</div>
</div>
<div class=canvas role=main style="width: 1501px; height: 940px; top: 64px">
<div id=item1 preview_url="https://p.scdn.co/mp3-preview/425d0814" class="genre scanme" scan=true style="color: #558a17; top: 626px; left: 418px; font-size: 160%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;2xar08Fq5xra2KKZs5Bw9j&quot;, &quot;Ray Charles&quot;, this);" title="e.g. Ray Charles &quot;I've Got a Woman&quot;">Ray Charles<a class=navlink href="artistprofile.html?id=1eYhYunlNJlDoQhtYBvPsi" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" target=artistprofile>&raquo;</a> </div>
<div id=item2 preview_url="https://p.scdn.co/mp3-preview/90baa5b9" class="genre scanme" scan=true style="color: #8f7912; top: 379px; left: 151px; font-size: 123%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;06PdA0DLgF4BfAeUNZAbFG&quot;, &quot;Fats Domino&quot;, this);" title="e.g. Fats Domino &quot;Blueberry Hill&quot;">Fats Domino<a class=navlink href="artistprofile.html?id=09C0xjtosNAIXP36wTnWxd" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" target=artistprofile>&raquo;</a> </div>
<div id=item3 preview_url="" class="genre scanme" scan=true style="color: #6a9518; top: 809px; left: 728px; font-size: 165%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;7enm32set9MaD0qigcGPnl&quot;, &quot;Neşet Ertaş&quot;, this);" title="e.g. Neşet Ertaş &quot;Yolcu&quot;">Neşet Ertaş<a class=navlink href="artistprofile.html?id=1afML5pJuVr3ye8TGyYcV2" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" target=artistprofile>&raquo;</a> </div>
</div>
<div class=canvas style="width: 429px; height: 337px; border: 1px solid gray; background: #FCFCFC; top: 64px">
<div id=nearbyitem1 preview_url="https://p.scdn.co/mp3-preview/874cb016" class="genre" scan=true style="color: #66882e; top: 149px; left: 104px; font-size: 240%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;75GGQpqQwXVnIK5UPKEveI&quot;, &quot;piano blues&quot;, this);" title="e.g. Big Maceo &quot;Worried Life Blues&quot;">piano blues<a class=navlink href="everynoise1d-pianoblues.html" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" >&raquo;</a> </div>
<div id=nearbyitem2 preview_url="https://p.scdn.co/mp3-preview/f86c5a8a" class="genre" scan=true style="color: #6a8b88; top: 190px; left: 210px; font-size: 126%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;5DETB3BsCmTaxsdU2xSYEx&quot;, &quot;boogie-woogie&quot;, this);" title="e.g. Albert Ammons &quot;Boogie Woogie Prayer&quot;">boogie-woogie<a class=navlink href="engenremap-boogiewoogie.html#tunnel" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" >&raquo;</a> </div>
<div id=nearbyitem3 preview_url="https://p.scdn.co/mp3-preview/98c56d22" class="genre" scan=true style="color: #6a811c; top: 121px; left: 170px; font-size: 118%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;5eVbYxvz9Ed9Y9KEjfA64y&quot;, &quot;jump blues&quot;, this);" title="e.g. Wynonie Harris &quot;Grandma Plays The Numbers&quot;">jump blues<a class=navlink href="engenremap-jumpblues.html#tunnel" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" >&raquo;</a> </div>
</div>
<div class=canvas style="width: 429px; height: 345px; border: 1px solid gray; background: #404040; top: 64px">
<div id=mirroritem1 preview_url="https://p.scdn.co/mp3-preview/8dc711ed" class="genre" scan=true style="color: #e3bfa2; top: 140px; left: 207px; font-size: 160%" role=button tabindex=0 onKeyDown="kb(event);" onclick="playx(&quot;0PVk5LbYbKTbgGkyub3zCv&quot;, &quot;vocal trance&quot;, this);" title="e.g. Neev Kennedy &quot;One Step Behind&quot;">vocal trance<a class=navlink href="engenremap-vocaltrance.html#tunnel" role=button tabindex=0 onKeyDown="kb(event);" onclick="event.stopPropagation();" >&raquo;</a> </div>
</div>
</body></html>"""


def main():
    artists, related = scraper.parse_genre_page(
        FIXTURE, set(scraper.url_slug_candidates("piano blues")))

    # ranked by font-size (165 > 160 > 123), navlink id wins over playx key
    assert [a["name"] for a in artists] == \
        ["Neşet Ertaş", "Ray Charles", "Fats Domino"], artists
    assert artists[1]["id"] == "1eYhYunlNJlDoQhtYBvPsi", artists[1]

    # related keeps the nearby box only: own genre and mirror (opposites) excluded
    assert related == ["boogie-woogie", "jump blues"], related

    # top-20 cap, ranked by font-size, ties broken by DOM order
    many = "".join(
        f'<div id=item{i} class="genre scanme" style="font-size: {100 + i}%">Artist {i}'
        f'<a class=navlink href="artistprofile.html?id=id{i}">&raquo;</a> </div>'
        for i in range(30))
    capped, _ = scraper.parse_genre_page(f"<html><body>{many}</body></html>", {"x"})
    assert len(capped) == scraper.MAX_ARTISTS and capped[0]["name"] == "Artist 29"

    # URL slug candidates (index slug ≠ EveryNoise URL slug)
    assert scraper.url_slug_candidates("piano blues") == ["pianoblues"]
    assert scraper.url_slug_candidates("dutch r&b") == ["dutchrb"]
    assert scraper.url_slug_candidates("children's music") == ["childrensmusic"]
    assert scraper.url_slug_candidates("lgbtq+ hip hop") == ["lgbtqhiphop"]
    # the index's one mojibake name: repaired+transliterated tried first
    assert scraper.url_slug_candidates("mÃºsica pitiusa")[0] == "musicapitiusa"

    print("ALL PARSER TESTS PASSED")


if __name__ == "__main__":
    main()
