"""Build the small-text reader glyph tables from upstream releases (run by hand).

Inputs (downloaded release archives, unpacked):
  --departure   DepartureMono-1.500/DepartureMono-Regular.otf   (OFL-1.1, Helena Zhang)
  --terminus    ter-u12n.bdf from terminus-font-4.49.1 (SourceForge)   (OFL-1.1, Dimitar Zhekov)
  --gohu        gohufont-uni-11.bdf, github.com/hchargois/gohufont   (WTFPL, Hugo Chargois)
  --gohu14      gohufont-uni-14.bdf (8x14), same font
  --scientifica scientifica-11.bdf, github.com/nerdypepper/scientifica v2.3   (OFL-1.1, Akshay Oppiliappan)
  --fixed       6x13.bdf, gitlab.freedesktop.org/xorg/font/misc-misc   (public domain)
  --fixed9      9x15.bdf, same public-domain family
  --shinonome   shinonome-0.9.11/bdf/ from openlab.jp/efont/dist/shinonome/shinonome-0.9.11p1.tar.bz2
                (public domain): shnm6x12a.bdf (Latin 6x12) and shnmk12.bdf (Japanese,
                JIS X 0208, 12x12; every font uses it for two-cell characters. The 14x14 set
                was left out: +73 KB compressed for Departure 7x14 alone)
Output: app/src/fonts/glyphs.ts with one table per font. Every table records its
ascent (baseline row) so Japanese glyphs can be aligned to any font.

Japanese (2026-11-10, user: the app should support English and Japanese with some
pixel fonts that show Japanese): Shinonome 6x12 is a font of its own, and the 12x12
set is the wide companion table every small font uses for two-cell (East Asian wide)
characters. Only JIS rows 0x21-0x4F are kept: symbols, kana, Greek,
Cyrillic, box drawing and the JIS level 1 kanji (~3,000 everyday characters); level 2
kanji would roughly double the app's size. JIS codes are mapped to Unicode through
EUC-JP (each byte | 0x80).

Monospace only: every font must have one advance width for all of its glyphs.
Bitmap (BDF) fonts are read at their native cell. Departure Mono is an outline
pixel font rasterised at its own grid (11px, per its README "increments of 11px")
by FreeType in monochrome mode; its line is 14 rows with ascent/descent.
(2026-11-10: Spleen, Monogram, Cozette, Pixeloid Mono and JetBrains Mono removed
at the user's request. 2026-11-12: Departure 7x11, Misc Fixed 8x13, Terminus 8x14
and Terminus 8x16 removed.)
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


def encode(code: int, rows: list[int], row_bits: int = 8) -> str:
    # One byte per row when the cell is at most 8px (bit 7 = left). Wider cells use
    # two bytes per row (bit 15 = left), the same packing as the Japanese wide table.
    digits = row_bits // 4
    return f"{code:x}:" + "".join(f"{r:0{digits}x}" for r in rows)


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
    if cell_w > 16:
        raise SystemExit(f"{path.name}: cell {cell_w}px is wider than the 16-bit row format")
    row_bits = 16 if cell_w > 8 else 8
    row_mask = (1 << row_bits) - 1
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
                shift = row_bits - w - xoff  # into the row at xoff, high bit = left
                row = bits << shift if shift >= 0 else bits >> -shift
                cell[y] = row & (row_mask << (row_bits - cell_w)) & row_mask  # clip to the cell
        out.append(encode(code, cell, row_bits))
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


def bdf_ascent(path: Path) -> int:
    lines = path.read_text(encoding="latin-1").splitlines()
    return int(next(l for l in lines if l.startswith("FONT_ASCENT ")).split()[1])


def jis_wide(path: Path, last_row: int = 0x4F) -> tuple[int, int, int, list[str]]:
    """A JIS X 0208 BDF as a wide table: two bytes (4 hex digits) per row, bit 15 = left.
    Rows above `last_row` (JIS level 2 kanji) are left out."""
    lines = path.read_text(encoding="latin-1").splitlines()
    box = next(l for l in lines if l.startswith("FONTBOUNDINGBOX")).split()
    cell_w, cell_h, base_y = int(box[1]), int(box[2]), int(box[4])
    if cell_w > 16:
        raise SystemExit(f"{path.name}: {cell_w}px is wider than the 16-bit row format")
    ascent = bdf_ascent(path)
    out: list[str] = []
    i = 0
    while i < len(lines):
        if not lines[i].startswith("STARTCHAR"):
            i += 1
            continue
        jis = w = h = xoff = yoff = None
        rows: list[int] = []
        i += 1
        while not lines[i].startswith("ENDCHAR"):
            parts = lines[i].split()
            if parts[0] == "ENCODING":
                jis = int(parts[1])
            elif parts[0] == "BBX":
                w, h, xoff, yoff = (int(v) for v in parts[1:5])
            elif parts[0] == "BITMAP":
                i += 1
                while not lines[i].startswith("ENDCHAR"):
                    rows.append(int(lines[i], 16))
                    i += 1
                break
            i += 1
        if jis is None or w is None or (jis >> 8) > last_row:
            continue
        try:
            char = bytes([(jis >> 8) | 0x80, (jis & 0xFF) | 0x80]).decode("euc_jp")
        except UnicodeDecodeError:
            continue
        if len(char) != 1:
            continue
        cell = [0] * cell_h
        top = (cell_h + base_y) - (yoff + h)
        byte_bits = ((w + 7) // 8) * 8
        for r, value in enumerate(rows):
            y = top + r
            if 0 <= y < cell_h:
                bits = value >> (byte_bits - w)
                cell[y] = (bits << (16 - w - xoff)) & 0xFFFF
        out.append(f"{ord(char):x}:" + "".join(f"{v:04x}" for v in cell))
    return cell_w, cell_h, ascent, out


def main() -> None:
    ap = argparse.ArgumentParser()
    for name in ("departure", "terminus", "gohu", "scientifica", "fixed", "shinonome"):
        ap.add_argument(f"--{name}", type=Path, required=True)
    extra_names = ("gohu14", "fixed9")
    for name in extra_names:
        ap.add_argument(f"--{name}", type=Path)
    args = ap.parse_args()
    sources = {"terminus": args.terminus, "gohu": args.gohu, "scientifica": args.scientifica, "fixed": args.fixed,
               "shinonome": args.shinonome / "shnm6x12a.bdf"}
    bitmaps = {name: (*bdf(path, TEXT_RANGES), bdf_ascent(path)) for name, path in sources.items()}
    export_as = {"gohu14": "GOHU_14", "fixed9": "FIXED_9"}
    extras = []
    for name in extra_names:
        path = getattr(args, name)
        if path:
            extras.append((export_as[name], *bdf(path, TEXT_RANGES), bdf_ascent(path)))
    k12 = jis_wide(args.shinonome / "shnmk12.bdf")
    dsize = pixel_grid_size(args.departure)
    dw, dh, departure = outline(args.departure, dsize, all_codes(args.departure))
    from PIL import ImageFont
    dascent = ImageFont.truetype(str(args.departure), dsize).getmetrics()[0]
    target = REPO / "app" / "src" / "fonts" / "glyphs.ts"
    table = lambda name, w, h, a, g: f"export const {name} = {{ width: {w}, height: {h}, ascent: {a}, glyphs: '{';'.join(g)}' }};\n"
    target.write_text(
        "// Generated by scripts/build-fine-fonts.py. Do not edit by hand.\n"
        "// Departure Mono 1.500 (c) 2022-2024 Helena Zhang, OFL-1.1: fonts/DEPARTURE-MONO-OFL.txt.\n"
        "// Terminus Font 4.49.1 (c) Dimitar Toshkov Zhekov, OFL-1.1: fonts/TERMINUS-OFL.txt. Size 6x12.\n"
        "// GohuFont (c) Hugo Chargois, WTFPL: fonts/GOHUFONT-LICENSE.txt. Sizes 6x11 and 8x14.\n"
        "// scientifica 2.3 (c) Akshay Oppiliappan, OFL-1.1: fonts/SCIENTIFICA-OFL.txt.\n"
        f"// X11 misc-fixed {', '.join(['6x13', *(['9x15'] if args.fixed9 else [])])}: "
        "public domain, fonts/MISC-FIXED-COPYING.txt.\n"
        "// Shinonome 0.9.11 (The Electronic Font Open Laboratory): public domain, fonts/SHINONOME-LICENSE.txt.\n"
        "// Entry: hex code point ':' then one byte per row (bit 7 = leftmost pixel). Cells wider than\n"
        "// 8px, and the wide Japanese table, use two bytes per row (bit 15 = leftmost).\n"
        "// ascent = rows above the baseline.\n"
        + table("DEPARTURE_MONO", dw, dh, dascent, departure)
        + "".join(table(name.upper(), w, h, a, g) for name, (w, h, g, a) in bitmaps.items())
        + "".join(table(name, w, h, a, g) for name, w, h, g, a in extras)
        + table("SHINONOME_K12", k12[0], k12[1], k12[2], k12[3]),
        encoding="utf-8", newline="\n")
    print("ok", f"departure {dsize}px {dw}x{dh}/{len(departure)}",
          *[f"{n} {w}x{h}/{len(g)}" for n, (w, h, g, a) in bitmaps.items()],
          *[f"{n} {w}x{h}/{len(g)}" for n, w, h, g, a in extras],
          f"k12 {k12[0]}x{k12[1]}/{len(k12[3])}", target.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
