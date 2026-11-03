"""Composite simulator alpha onto black without changing any captured pixels."""
from pathlib import Path
from html import escape

from PIL import Image

root = Path(__file__).resolve().parents[1] / "store" / "screenshots"
for source in sorted((root / "native").glob("*.png")):
    with Image.open(source) as captured:
        assert captured.size == (576, 288), source
        preview = Image.new("RGBA", captured.size, "black")
        preview.alpha_composite(captured.convert("RGBA"))
        target = root / source.name
        preview.convert("RGB").save(target)
        print(target)

# Keep the review page's copy identical to the file submitted through the CLI.
gallery = root.parent / "gallery.html"
markup = gallery.read_text(encoding="utf-8")
start, end = "<!-- profile:start -->", "<!-- profile:end -->"
assert markup.count(start) == markup.count(end) == 1, "Missing gallery profile markers"
before, remainder = markup.split(start)
_, after = remainder.split(end)
description = (root.parent / "description.txt").read_text(encoding="utf-8").strip()
gallery.write_text(before + start + "<pre>" + escape(description) + "</pre>" + end + after, encoding="utf-8")
