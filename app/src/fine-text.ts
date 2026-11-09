// Small-text reader pages. The Even SDK has no font or size control for native
// text, so a small-text page is drawn on the phone and sent as four greyscale
// image tiles (the SDK maximum: four images of at most 288x144 each).
//
//   pixel: Spleen 6x12, a monospace bitmap font, drawn pixel-exact from its glyph
//          table (no canvas smoothing). 93 columns x 20 rows.
//   mono:  JetBrains Mono at 10px on its own 6x13 grid, cut to on/off pixels. 93 x 18.
//
// Characters outside a font fall back to the WebView's monospace font in the
// same cell; East Asian wide characters take two cells.
import { SPLEEN_6X12 } from './fonts/spleen-6x12';
import monoUrl from './fonts/jetbrains-mono.woff?url';

export type FineFont = 'pixel' | 'mono';
export const FINE_FONTS: FineFont[] = ['pixel', 'mono'];

// Reader body area: x8..568, y4..248, split into a 2x2 grid of 280x122 tiles.
export const FINE_AREA = { x: 8, y: 4, width: 560, height: 244 };
export const FINE_TILES = [0, 1, 2, 3].map(i => ({
  xPosition: FINE_AREA.x + (i % 2) * 280, yPosition: FINE_AREA.y + Math.floor(i / 2) * 122, width: 280, height: 122,
}));

export const FINE_METRICS: Record<FineFont, { advance: number; line: number; rows: number; px: number }> = {
  pixel: { advance: 6, line: 12, rows: 20, px: 12 },
  // JetBrains Mono is 0.6em wide with a 1.32em line: at 10px the cell is exactly
  // 6px and the line 13.2px, so glyphs and box-drawing joins land on whole pixels.
  mono: { advance: 6, line: 13, rows: 18, px: 10 },
};
export const fineColumns = (font: FineFont) => Math.floor(FINE_AREA.width / FINE_METRICS[font].advance);

let glyphs: Map<number, number[]> | null = null;
function spleen(code: number): number[] | undefined {
  if (!glyphs) {
    glyphs = new Map();
    for (const entry of SPLEEN_6X12.split(';')) {
      const [hex, rows] = entry.split(':');
      glyphs.set(parseInt(hex, 16), Array.from({ length: 12 }, (_, i) => parseInt(rows.slice(i * 2, i * 2 + 2), 16)));
    }
  }
  return glyphs.get(code);
}

// Two cells for East Asian wide/fullwidth characters and emoji; zero for
// combining marks and joiners; one otherwise.
export function cellWidth(ch: string): number {
  const c = ch.codePointAt(0) || 0;
  if (/\p{Mn}|\p{Me}|‍|️/u.test(ch)) return 0;
  if ((c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) || (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) || (c >= 0x1f300 && c <= 0x1faff) || (c >= 0x20000 && c <= 0x3fffd)) return 2;
  return 1;
}
export const fineCells = (text: string) => { let n = 0; for (const ch of text) n += cellWidth(ch); return n; };
// Width in pixels for the reader's word wrap (readerPages measures in pixels).
export const fineMeasure = (font: FineFont) => (text: string) => fineCells(text) * FINE_METRICS[font].advance;

let monoReady: Promise<boolean> | null = null;
// Load the bundled JetBrains Mono once. A failure leaves the WebView monospace
// font in its place rather than blocking the reader.
export function loadFineFont(font: FineFont): Promise<boolean> {
  if (font === 'pixel') return Promise.resolve(true);
  monoReady ??= (async () => {
    try {
      const face = new FontFace('Orca Glass Mono', `url(${monoUrl})`);
      (document.fonts as unknown as Set<FontFace>).add(await face.load()); // FontFaceSet is a set-like; TS DOM lib omits add()
      return true;
    } catch { return false; }
  })();
  return monoReady;
}

// Draw one page of rows (already wrapped to fineColumns) and cut it into the
// four tiles, each a row-major greyscale array (0 = off, 255 = full brightness).
export function renderFinePage(text: string, font: FineFont): number[][] {
  const { width, height } = FINE_AREA;
  const { advance, line, rows: maxRows, px } = FINE_METRICS[font];
  const pixels = new Uint8ClampedArray(width * height);
  const rows = text.split('\n').slice(0, maxRows);
  let canvas: CanvasRenderingContext2D | null = null;
  const ctx = () => {
    if (canvas) return canvas;
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    canvas = c.getContext('2d', { willReadFrequently: true })!;
    canvas.fillStyle = '#000'; canvas.fillRect(0, 0, width, height);
    canvas.fillStyle = '#fff'; canvas.textBaseline = 'alphabetic';
    return canvas;
  };
  let usedCanvas = false;
  rows.forEach((row, r) => {
    let col = 0;
    for (const ch of row) {
      const cells = cellWidth(ch);
      if (cells === 0) continue;
      const x = Math.round(col * advance), y = r * line;
      const bitmap = font === 'pixel' ? spleen(ch.codePointAt(0) || 0) : undefined;
      if (bitmap) {
        for (let gy = 0; gy < 12; gy++) for (let gx = 0; gx < 6; gx++)
          if (bitmap[gy] & (32 >> gx)) pixels[(y + gy) * width + x + gx] = 255;
      } else if (ch.trim()) {
        const c = ctx();
        usedCanvas = true;
        c.font = font === 'mono' ? `${px}px "Orca Glass Mono", monospace` : `${px}px monospace`;
        // Baseline about 80% down the line; wide glyphs are squeezed into two cells.
        c.fillText(ch, x, y + Math.round(line * 0.8), Math.ceil(cells * advance));
      }
      col += cells;
    }
  });
  if (usedCanvas) {
    const data = ctx().getImageData(0, 0, width, height).data;
    // On/off at half coverage: the display shows even its dimmest grey level at
    // about 38% brightness (simulator measurement), so anti-aliasing fringes read
    // as bold smudges at this size.
    for (let i = 0; i < pixels.length; i++) if (data[i * 4] >= 128) pixels[i] = 255;
  }
  return FINE_TILES.map(tile => {
    const out = new Array<number>(tile.width * tile.height);
    const ox = tile.xPosition - FINE_AREA.x, oy = tile.yPosition - FINE_AREA.y;
    for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++)
      out[y * tile.width + x] = pixels[(oy + y) * width + ox + x];
    return out;
  });
}
