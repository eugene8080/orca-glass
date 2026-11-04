import type { UsageLimit } from './api';

export const RESET_MODES = ['computer', 'phone', 'absolute'] as const;
export type ResetMode = typeof RESET_MODES[number];
export const resetModeLabel = (mode: ResetMode) => ({ computer: 'Computer time', phone: 'Phone time', absolute: 'Absolute time' }[mode]);

export function formatReset(limit: UsageLimit, mode: ResetMode, now = Date.now(), phoneTimeZone?: string): string {
  if (mode === 'computer') return limit.computerResetDescription || limit.resetDescription || 'Reset time unavailable';
  const resetsAt = limit.resetsAt;
  // A label such as "Thursday" contains no reliable date/zone. Never guess an
  // instant from it when talking to an older bridge or incomplete provider data.
  if (typeof resetsAt !== 'number' || !Number.isFinite(resetsAt) || resetsAt < 0 || resetsAt > 8.64e15) return 'Reset time unavailable';
  if (mode === 'phone') return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    ...(phoneTimeZone ? { timeZone: phoneTimeZone } : {}),
  }).format(resetsAt).replace(',', '');
  const total = Math.max(0, Math.ceil((resetsAt - now) / 60000));
  const days = Math.floor(total / 1440), hours = Math.floor(total % 1440 / 60), minutes = total % 60;
  return `${days ? `${days}d` : ''}${days || hours ? `${hours}h` : ''}${minutes}m`;
}
