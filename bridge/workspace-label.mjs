// Keep a compact project label for session rows, and a distinct worktree label
// in the picker. Filtering always uses the Orca ID, never an editable name.
export function workspaceLabels(workspace) {
  const path = String(workspace?.path || '').replaceAll('\\', '/').replace(/\/$/, '');
  const leaf = path.split('/').at(-1) || 'Workspace';
  const name = typeof workspace?.repo === 'string' && workspace.repo ? workspace.repo : leaf;
  const display = workspace?.displayName || leaf;
  return { name, label: workspace?.isMainWorktree ? name : `${name} / ${display}` };
}
