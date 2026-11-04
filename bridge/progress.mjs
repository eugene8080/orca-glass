// Summarize the visible terminal activity, never internal reasoning or tool
// arguments/results. The reader can stay useful during long tool-only runs.
export function progressSummary(lines, provider) {
  if (provider !== 'claude') return '';
  let fallback = '';
  for (const raw of [...lines].reverse()) {
    const line = raw.trim();
    const tool = line.match(/^[●⏺]\s+([A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)?)\(/)?.[1];
    if (tool) {
      const label = { Read: 'Reading files', Glob: 'Finding files', Grep: 'Searching files',
        Edit: 'Editing a file', Update: 'Editing a file', Write: 'Writing a file',
        Bash: 'Running a command', 'Web Search': 'Searching the web', WebSearch: 'Searching the web',
        WebFetch: 'Reading a web page', Agent: 'Working with an agent', Task: 'Working with an agent' }[tool];
      return label || 'Using a tool';
    }
    // The harness's short status word is public UI, unlike transcript thinking
    // blocks. Keep only that word, without token counters or reasoning content.
    const status = line.match(/^[✻✢✳✶✽∴◐◓◑◒⠁-⣿]\s+([A-Za-z]{3,24})(?:[….]|\s*\()/u)?.[1];
    if (status && !fallback) fallback = `${status}…`;
  }
  return fallback;
}
