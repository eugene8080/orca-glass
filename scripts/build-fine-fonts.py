"""Build the small-text reader glyph tables from upstream releases (run by hand).

Inputs (downloaded release archives, unpacked):
  --spleen-dir  spleen-2.2.0/            (BSD-2-Clause, Frederic Cambus): spleen-6x12.bdf
  --mono        JetBrainsMono-2.304 fonts/ttf/JetBrainsMono-Regular.ttf   (OFL-1.1, JetBrains)
  --departure   DepartureMono-1.500/DepartureMono-Regular.otf   (OFL-1.1, Helena Zhang)
  --monogram    gitlab.com/datagoblin/monogram source/bitmap/monogram-bitmap.json   (MIT, Vinicius Menezio)
  --pixeloid    PixeloidMono.ttf from the author's DaFont release   (OFL-1.1, GGBotNet)
Output: app/src/fonts/glyphs.ts with one table per font.

Monospace only: every font must have one advance width for all of its glyphs.
Pixel outline fonts are rasterised at their native size, where one design pixel
is one screen pixel; the size is derived from the outline grid and checked.

Every font is a fixed cell of whole pixels, drawn pixel-exact on the phone: no
canvas text, no anti-aliasing. Spleen is a bitmap font, read from its BDF at its
native sizes. JetBrains Mono is rasterised once here by FreeType in monochrome
mode (hinted, 1 bit per pixel) at 10px, whose own metrics give a 6x14 cell
(advance 6, ascent 11, descent 3).
"""
from __future__ import annotations

import argparse
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MONO_RANGES = [range(0x20, 0x7F), range(0xA0, 0x180), range(0x2010, 0x2070), range(0x2190, 0x2200),
               range(0x2500, 0x2600), [0x2713, 0x2714, 0x2717, 0x2718, 0x276F, 0x23F5, 0x23FA]]


def encode(code: int, rows: list[int]) -> str:
    # Rows are at most 8 pixels wide: one byte (two hex digits) per row, bit 7 = left.
    return f"{code:x}:" + "".join(f"{r:02x}" for r in rows)


def spleen(bdf: Path, cell_w: int, cell_h: int) -> list[str]:
    lines = bdf.read_text(encoding="ascii").splitlines()
    box = next(l for l in lines if l.startswith("FONTBOUNDINGBOX")).split()
    if (int(box[1]), int(box[2])) != (cell_w, cell_h):
        raise SystemExit(f"{bdf.name}: expected {cell_w}x{cell_h}, got {box[1]}x{box[2]}")
    base_y = int(box[4])
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
        if code is None or code < 32 or code > 0xFFFF or w is None:
            continue
        cell = [0] * cell_h
        top = (cell_h + base_y) - (yoff + h)  # cell row of the glyph's first bitmap row
        byte_bits = ((w + 7) // 8) * 8
        for r, value in enumerate(rows):
            y = top + r
            if 0 <= y < cell_h:
                bits = value >> (byte_bits - w)  # the glyph's own w pixels, left-aligned
                cell[y] = (bits << (8 - w - xoff)) & 0xFF  # into an 8-bit row, bit 7 = left
        out.append(encode(code, cell))
    return out


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


def monogram(json_path: Path) -> tuple[int, int, list[str]]:
    """The author's own bitmap table: 12 rows per glyph, bit 0 = leftmost pixel.
    Monogram's advance is 6px; five accented glyphs one pixel wider are clipped."""
    import json
    data = json.loads(json_path.read_text(encoding="utf-8"))
    out = []
    for ch, rows in sorted(data.items(), key=lambda kv: ord(kv[0])):
        if len(ch) != 1 or len(rows) != 12:
            continue
        out.append(encode(ord(ch), [sum(0x80 >> x for x in range(6) if r & (1 << x)) for r in rows]))
    return 6, 12, out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--spleen-dir", type=Path, required=True)
    ap.add_argument("--mono", type=Path, required=True)
    ap.add_argument("--departure", type=Path, required=True)
    ap.add_argument("--monogram", type=Path, required=True)
    ap.add_argument("--pixeloid", type=Path, required=True)
    args = ap.parse_args()
    s12 = spleen(args.spleen_dir / "spleen-6x12.bdf", 6, 12)
    mw, mh, mono = outline(args.mono, 10)
    dsize, psize = pixel_grid_size(args.departure), pixel_grid_size(args.pixeloid)
    dw, dh, departure = outline(args.departure, dsize, all_codes(args.departure))
    pw, ph, pixeloid = outline(args.pixeloid, psize, all_codes(args.pixeloid))
    gw, gh, mgram = monogram(args.monogram)
    target = REPO / "app" / "src" / "fonts" / "glyphs.ts"
    target.write_text(
        "// Generated by scripts/build-fine-fonts.py. Do not edit by hand.\n"
        "// Spleen 2.2.0 (c) 2018-2026 Frederic Cambus, BSD-2-Clause: fonts/SPLEEN-LICENSE.txt.\n"
        "// JetBrains Mono 2.304 (c) The JetBrains Mono Project Authors, OFL-1.1: fonts/JETBRAINS-MONO-OFL.txt.\n"
        "// Departure Mono 1.500 (c) 2022-2024 Helena Zhang, OFL-1.1: fonts/DEPARTURE-MONO-OFL.txt.\n"
        "// monogram (c) Vinicius Menezio (datagoblin), MIT: fonts/MONOGRAM-LICENSE.txt.\n"
        "// Pixeloid Mono (c) GGBotNet, OFL-1.1: fonts/PIXELOID-OFL.txt.\n"
        "// Entry: hex code point ':' then one byte per row (bit 7 = leftmost pixel).\n"
        f"export const SPLEEN_6X12 = {{ width: 6, height: 12, glyphs: '{';'.join(s12)}' }};\n"
        f"export const JETBRAINS_MONO_10 = {{ width: {mw}, height: {mh}, glyphs: '{';'.join(mono)}' }};\n"
        f"export const DEPARTURE_MONO = {{ width: {dw}, height: {dh}, glyphs: '{';'.join(departure)}' }};\n"
        f"export const MONOGRAM = {{ width: {gw}, height: {gh}, glyphs: '{';'.join(mgram)}' }};\n"
        f"export const PIXELOID_MONO = {{ width: {pw}, height: {ph}, glyphs: '{';'.join(pixeloid)}' }};\n",
        encoding="utf-8")
    print("ok", f"jetbrains {mw}x{mh}/{len(mono)}", f"departure {dsize}px {dw}x{dh}/{len(departure)}",
          f"monogram {gw}x{gh}/{len(mgram)}", f"pixeloid {psize}px {pw}x{ph}/{len(pixeloid)}", target.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
