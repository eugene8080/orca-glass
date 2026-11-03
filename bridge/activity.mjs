export function activityState(agent) {
  const state = agent?.mainAgent?.state || agent?.state;
  if (['error', 'failure', 'failed'].includes(agent?.mainAgent?.outcome)) return 'attention';
  if (state === 'working') return 'working';
  if (['done', 'idle', 'waiting'].includes(state)) return 'waiting';
  if (['blocked', 'error', 'needs-attention'].includes(state)) return 'attention';
  return 'unknown';
}

export function reportedElapsed(lines, provider) {
  if (provider !== 'codex') return null;
  for (const raw of lines.slice(-20).reverse()) {
    const match = raw.trim().match(/^(?:[•⠁-⣿]\s*)?(?:Working|Thinking|Processing)\s*\(([^)]*)\)/u);
    if (!match) continue;
    const units = [...match[1].split('•')[0].matchAll(/(\d+)\s*([hms])\b/g)];
    if (!units.length) continue;
    return units.reduce((seconds, unit) => seconds + Number(unit[1]) * ({ h: 3600, m: 60, s: 1 }[unit[2]]), 0);
  }
  return null;
}
