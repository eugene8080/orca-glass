"""Build the small-text reader glyph tables from upstream releases (run by hand).

Inputs (downloaded release archives, unpacked):
  --departure   DepartureMono-1.500/DepartureMono-Regular.otf   (OFL-1.1, Helena Zhang)
  --terminus    ter-u12n.bdf from terminus-font-4.49.1 (SourceForge)   (OFL-1.1, Dimitar Zhekov)
  --gohu        gohufont-uni-11.bdf, github.com/hchargois/gohufont   (WTFPL, Hugo Chargois)
  --scientifica scientifica-11.bdf, github.com/nerdypepper/scientifica v2.3   (OFL-1.1, Akshay Oppiliappan)
  --fixed       6x13.bdf, gitlab.freedesktop.org/xorg/font/misc-misc   (public domain)
Output: app/src/fonts/glyphs.ts with one table per font.

Monospace only: every font must have one advance width for all of its glyphs.
Bitmap (BDF) fonts are read at their native cell. Departure Mono is an outline
pixel font rasterised at its own grid (11px, per its README "increments of 11px")
by FreeType in monochrome mode; its line is 14 rows with ascent/descent, and a
second 7x11 table keeps only the 11 rows its ASCII glyphs actually use.
(2026-11-10: Spleen, Monogram, Cozette, Pixeloid Mono and JetBrains Mono removed
at the user's request.)
"""
from __future__ import annotations

import argparse
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MONO_RANGES = [range(0x20, 0x7F), range(0xA0, 0x180), range(0x2010, 0x2070), range(0x2190, 0x2200),
               range(0x2500, 0x2600), [0x2713, 0x2714, 0x2717, 0x2718, 0x276F, 0x23F5, 0x23FA]]
# Code points kept from large bitmap fonts: Latin, punctuation, arrows, maths and
# technical symbols, box drawing, blocks, shapes, dingbats and Braille.
TEXT_RANGES = [(0x20, 0x24F), (0x2000, 0x206F), (0x2190, 0x23FF), (0x2500, 0x27BF), (0x2800, 0x28FF)]


def encode(code: int, rows: list[int]) -> str:
    # Rows are at most 8 pixels wide: one byte (two hex digits) per row, bit 7 = left.
    return f"{code:x}:" + "".join(f"{r:02x}" for r in rows)


def bdf(path: Path, ranges=None) -> tuple[int, int, list[str]]:
    """Any BDF bitmap font at its native cell: width = the (single) ASCII advance,
    height = FONT_ASCENT + FONT_DESCENT. Monospace is required for ASCII; glyphs
    of any other advance (double-width emoji etc.) are skipped, and pixels outside
    the cell are clipped."""
    lines = path.read_text(encoding="latin-1").splitlines()
    prop = lambda key: int(next(l for l in lines if l.startswith(key + " ")).split()[1])
    ascent, descent = prop("FONT_ASCENT"), prop("FONT_DESCENT")
    cell_h = ascent + descent
    advances: dict[int, int] = {}
    code = None
    for l in lines:
        if l.startswith("ENCODING"):
            code = int(l.split()[1])
        elif l.startswith("DWIDTH") and code is not None:
            advances[code] = int(l.split()[1])
    ascii_adv = {advances[c] for c in range(0x21, 0x7F) if c in advances}
    if len(ascii_adv) != 1:
        raise SystemExit(f"{path.name} is not monospaced: ASCII advances {sorted(ascii_adv)}")
    cell_w = ascii_adv.pop()
    if cell_w > 8:
        raise SystemExit(f"{path.name}: cell {cell_w}px is wider than the 8-bit row format")
    base_y = -descent
    out: list[str] = []
    i = 0
    while i < len(lines):
        if not lines[i].startswith("STARTCHAR"):
            i += 1
            continue
        code = w = h = xoff = yoff = None
        rows: list[int] = []
        i += 1
        while not lines[i].startswith("ENDCHAR"):
            parts = lines[i].split()
            if parts[0] == "ENCODING":
                code = int(parts[1])
            elif parts[0] == "BBX":
                w, h, xoff, yoff = (int(v) for v in parts[1:5])
            elif parts[0] == "BITMAP":
                i += 1
                while not lines[i].startswith("ENDCHAR"):
                    rows.append(int(lines[i], 16))
                    i += 1
                break
            i += 1
        if (code is None or code < 32 or code > 0xFFFF or w is None or advances.get(code) != cell_w
                or (ranges and not any(lo <= code <= hi for lo, hi in ranges))):
            continue
        cell = [0] * cell_h
        top = (cell_h + base_y) - (yoff + h)  # cell row of the glyph's first bitmap row
        byte_bits = ((w + 7) // 8) * 8
        for r, value in enumerate(rows):
            y = top + r
            if 0 <= y < cell_h:
                bits = value >> (byte_bits - w)  # the glyph's own w pixels, left-aligned
                shift = 8 - w - xoff  # into an 8-bit row at xoff, bit 7 = left
                row = bits << shift if shift >= 0 else bits >> -shift
                cell[y] = row & (0xFF << (8 - cell_w)) & 0xFF  # clip to the cell
        out.append(encode(code, cell))
    return cell_w, cell_h, out


def require_monospace(path: Path) -> None:
    from fontTools.ttLib import TTFont
    font = TTFont(str(path))
    cmap = font.getBestCmap()
    advances = {font["hmtx"][g][0] for c, g in cmap.items() if 0x21 <= c < 0x7F}
    if len(advances) != 1:
        raise SystemExit(f"{path.name} is not monospaced: printable ASCII advances {sorted(advances)}")


def pixel_grid_size(path: Path) -> int:
    """The em size in pixels at which one outline grid step is one pixel."""
    from functools import reduce
    from math import gcd
    from fontTools.pens.recordingPen import RecordingPen
    from fontTools.ttLib import TTFont
    font = TTFont(str(path))
    cmap, glyphs = font.getBestCmap(), font.getGlyphSet()
    values = [font["hmtx"][cmap[0x41]][0]]
    for code in range(0x21, 0x7F):
        if code in cmap:
            pen = RecordingPen()
            glyphs[cmap[code]].draw(pen)
            values += [abs(round(v)) for _, pts in pen.value for pt in pts for v in pt]
    unit = reduce(gcd, [v for v in values if v])
    upm = font["head"].unitsPerEm
    if upm % unit:
        raise SystemExit(f"{path.name}: em {upm} is not a whole number of grid steps ({unit})")
    return upm // unit


def all_codes(path: Path) -> list[range]:
    from fontTools.ttLib import TTFont
    return [[c for c in sorted(TTFont(str(path)).getBestCmap()) if 0x20 <= c <= 0xFFFF and not 0xD800 <= c <= 0xDFFF]]


def outline(ttf: Path, size: int, ranges=MONO_RANGES) -> tuple[int, int, list[str]]:
    from PIL import Image, ImageDraw, ImageFont
    require_monospace(ttf)
    font = ImageFont.truetype(str(ttf), size)
    ascent, descent = font.getmetrics()
    advance = round(font.getlength("M"))
    if font.getlength("M") != advance or advance > 8:
        raise SystemExit(f"{ttf.name} {size}px advance {font.getlength('M')} is not a whole cell <= 8")
    cell_h = ascent + descent
    out: list[str] = []
    from fontTools.ttLib import TTFont
    covered = set(TTFont(str(ttf)).getBestCmap())
    for rng in ranges:
        for code in rng:
            if code not in covered:
                continue
            img = Image.new("1", (advance, cell_h), 0)
            draw = ImageDraw.Draw(img)
            draw.fontmode = "1"  # FreeType monochrome rendering: hinted, no anti-aliasing
            draw.text((0, 0), chr(code), font=font, fill=1)
            rows = []
            for y in range(cell_h):
                bits = 0
                for x in range(advance):
                    if img.getpixel((x, y)):
                        bits |= 0x80 >> x
                rows.append(bits)
            out.append(encode(code, rows))
    return advance, cell_h, out


def crop_rows(glyphs: list[str], height: int, keep: int) -> tuple[int, list[str]]:
    """Keep the `keep` rows that ASCII glyphs use (first row = their topmost ink)."""
    rows_of = lambda entry: [int(entry.split(":")[1][k * 2:k * 2 + 2], 16) for k in range(height)]
    ascii_rows = [y for e in glyphs if 0x20 < int(e.split(":")[0], 16) < 0x7F
                  for y, v in enumerate(rows_of(e)) if v]
    top = min(ascii_rows)
    if max(ascii_rows) - top + 1 > keep:
        raise SystemExit(f"ASCII glyphs span {max(ascii_rows) - top + 1} rows, more than {keep}")
    return top, [e.split(":")[0] + ":" + "".join(f"{v:02x}" for v in rows_of(e)[top:top + keep]) for e in glyphs]


def main() -> None:
    ap = argparse.ArgumentParser()
    for name in ("departure", "terminus", "gohu", "scientifica", "fixed"):
        ap.add_argument(f"--{name}", type=Path, required=True)
    args = ap.parse_args()
    bitmaps = {name: bdf(getattr(args, name), TEXT_RANGES) for name in ("terminus", "gohu", "scientifica", "fixed")}
    dsize = pixel_grid_size(args.departure)
    dw, dh, departure = outline(args.departure, dsize, all_codes(args.departure))
    top, departure11 = crop_rows(departure, dh, dsize)
    target = REPO / "app" / "src" / "fonts" / "glyphs.ts"
    table = lambda name, w, h, g: f"export const {name} = {{ width: {w}, height: {h}, glyphs: '{';'.join(g)}' }};\n"
    target.write_text(
        "// Generated by scripts/build-fine-fonts.py. Do not edit by hand.\n"
        "// Departure Mono 1.500 (c) 2022-2024 Helena Zhang, OFL-1.1: fonts/DEPARTURE-MONO-OFL.txt.\n"
        "// Terminus Font 4.49.1 (c) Dimitar Toshkov Zhekov, OFL-1.1: fonts/TERMINUS-OFL.txt.\n"
        "// GohuFont (c) Hugo Chargois, WTFPL: fonts/GOHUFONT-LICENSE.txt.\n"
        "// scientifica 2.3 (c) Akshay Oppiliappan, OFL-1.1: fonts/SCIENTIFICA-OFL.txt.\n"
        "// X11 misc-fixed 6x13: public domain, fonts/MISC-FIXED-COPYING.txt.\n"
        "// Entry: hex code point ':' then one byte per row (bit 7 = leftmost pixel).\n"
        + table("DEPARTURE_MONO", dw, dh, departure)
        + f"// Departure Mono rows {top}..{top + dsize - 1} of the {dh}-row line: the 11 its ASCII glyphs use.\n"
        + table("DEPARTURE_MONO_11", dw, dsize, departure11)
        + "".join(table(name.upper(), w, h, g) for name, (w, h, g) in bitmaps.items()),
        encoding="utf-8")
    print("ok", f"departure {dsize}px {dw}x{dh}/{len(departure)} and {dw}x{dsize} from row {top}",
          *[f"{n} {w}x{h}/{len(g)}" for n, (w, h, g) in bitmaps.items()], target.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
