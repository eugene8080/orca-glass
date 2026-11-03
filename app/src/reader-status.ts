export const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export const WORKING_LABELS = ['Processing', 'Thinking', 'Pondering', 'Cooking', 'Computing', 'Inferring', 'Burning Tokens'];

export function readerStatus(state: string, frame = 0, elapsedMs = frame * 200): string {
  if (state === 'working') {
    const phase = Math.floor(elapsedMs / 5000) % WORKING_LABELS.length;
    const dots = '.'.repeat(Math.floor((elapsedMs % 5000) / 500) % 3 + 1);
    return `${SPINNER[frame % SPINNER.length]} ${WORKING_LABELS[phase]}${dots}`;
  }
  return state === 'waiting' ? '/ Waiting input' : state === 'attention' ? '/ Needs attention' : '/ Status unavailable';
}

// Native/simulator fonts can omit Braille. Rasterize the exact Unicode pattern
// into a small Gray8 image, independent of the text renderer's glyph coverage.
export function statusPixels(symbol: string): number[] {
  const pixels = Array(20 * 28).fill(0);
  if (symbol === '/') {
    for (let y = 3; y < 25; y++) {
      const x = Math.round(15 - (y - 3) * 10 / 21);
      for (let dx = -1; dx <= 1; dx++) pixels[y * 20 + x + dx] = 255;
    }
    return pixels;
  }
  const bits = (symbol.codePointAt(0) || 0) - 0x2800;
  if (bits < 0 || bits > 255) return pixels;
  for (const [bit, cx, cy] of [[0, 5, 4], [1, 5, 11], [2, 5, 18], [6, 5, 25], [3, 15, 4], [4, 15, 11], [5, 15, 18], [7, 15, 25]]) {
    if (!(bits & (1 << bit))) continue;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= 4) pixels[y * 20 + x] = 255;
    }
  }
  return pixels;
}
