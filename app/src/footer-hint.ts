export function footerHint(seconds?: number | null, choices = false): string {
  if (choices) return '[Click: choices | Hold: talk]';
  const timer = seconds != null && Number.isFinite(seconds) && seconds >= 0
    ? `${Math.floor(seconds / 60)}m ${String(Math.floor(seconds % 60)).padStart(2, '0')}s ` : '';
  return `${timer}[Tap & hold to input]`;
}
