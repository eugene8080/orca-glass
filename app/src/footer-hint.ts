// Right part of the one-row reader status: '[Tap&Hold for Input] Pg77/78', with
// the provider-reported working duration in front ('13m32s ...'). The hint
// shrinks step by step and then disappears when the row would not fit.
export const TAP_HINTS = ['[Tap&Hold for Input]', '[Tap&Hold]', '[T&H]', ''];
export const CHOICE_HINTS = ['[Click:choices]', '[Click]', ''];

export function compactDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds);
  if (total >= 3600) return `${Math.floor(total / 3600)}h${String(Math.floor(total % 3600 / 60)).padStart(2, '0')}m`;
  return `${Math.floor(total / 60)}m${String(total % 60).padStart(2, '0')}s`;
}

export function statusRight(seconds: number | null | undefined, choices: boolean, page: string, fits: (text: string) => boolean = () => true): string {
  const timer = compactDuration(seconds);
  for (const hint of choices ? CHOICE_HINTS : TAP_HINTS) {
    const text = [timer, hint, page].filter(Boolean).join(' ');
    if (fits(text)) return text;
  }
  return [timer, page].filter(Boolean).join(' ');
}
