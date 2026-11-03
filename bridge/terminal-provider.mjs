// Keep every detected agent provider, while excluding ordinary shell panes.
export function terminalProvider(terminal, activity) {
  const provider = terminal.agentIdentity || activity?.agentType;
  if (typeof provider !== 'string' || !provider.trim()) return null;
  if (/^(?:unknown|shell|terminal|cmd(?:\.exe)?|powershell(?:\.exe)?|pwsh(?:\.exe)?|bash|zsh)$/i.test(provider)) return null;
  return provider;
}
