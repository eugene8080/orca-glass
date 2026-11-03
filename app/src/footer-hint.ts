export function footerHint(seconds?: number | null): string {
  const timer = seconds != null && Number.isFinite(seconds) && seconds >= 0
    ? `${Math.floor(seconds / 60)}m ${String(Math.floor(seconds % 60)).padStart(2, '0')}s ` : '';
  return `${timer}[Tap & hold to input]`;
}

// A right-aligned raster avoids relying on unsupported native textAlign fields
// or approximate space padding with a proportional font.
export function hintPixels(text: string): number[] {
  if (!text) return Array(280 * 28).fill(0);
  const canvas = document.createElement('canvas');
  canvas.width = 280; canvas.height = 28;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Footer text renderer unavailable');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 280, 28);
  ctx.fillStyle = '#fff'; ctx.font = '18px Arial'; ctx.textAlign = 'right';
  ctx.fillText(text, 279, 21);
  const rgba = ctx.getImageData(0, 0, 280, 28).data;
  return Array.from({ length: 280 * 28 }, (_, i) => rgba[i * 4]);
}
