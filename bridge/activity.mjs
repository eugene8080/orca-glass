export function activityState(agent) {
  const state = agent?.mainAgent?.state || agent?.state;
  if (['error', 'failure', 'failed'].includes(agent?.mainAgent?.outcome)) return 'attention';
  if (state === 'working') return 'working';
  if (['done', 'idle', 'waiting'].includes(state)) return 'waiting';
  if (['blocked', 'error', 'needs-attention'].includes(state)) return 'attention';
  return 'unknown';
}
