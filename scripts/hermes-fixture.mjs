// Entirely synthetic gateway transport: this module cannot contact a real agent.
import { createHermesAdapter, hermesHandle } from '../bridge/hermes.mjs';

export async function createHermesFixture() {
  const models = ['GPT synthetic', 'Claude synthetic', 'Gemini synthetic', 'Qwen synthetic', 'Local synthetic', 'Custom synthetic', 'Second GPT synthetic'];
  const sessions = models.map((model, i) => ({
    target: { profile: `C:/synthetic/hermes/${['default', 'research', 'writing'][i % 3]}`, instance: 'fixture-owner', epoch: 1,
      session: `synthetic-${i + 1}`, started: 100 + i, source: 'desktop' },
    profileName: ['default', 'research', 'writing'][i % 3], title: `${i + 1}. ${model}`, model,
    scope: i === 6 ? 'stored' : 'live', state: i === 1 ? 'working' : 'waiting',
  }));
  const sends = [];
  const messages = new Map(sessions.map(s => [hermesHandle(s.target), [
    { role: 'user', text: `Synthetic question for ${s.title}.` },
    { role: 'assistant', text: `This is a Hermes conversation using ${s.model}.\nProfile: ${s.profileName}.\nHold to dictate, release to review, click to confirm.\nAll input in this preview stays in the synthetic fixture.` },
  ]]));
  const adapter = createHermesAdapter(async request => {
    if (request.action === 'list') return { sessions };
    const handle = hermesHandle(request.target);
    const session = sessions.find(s => hermesHandle(s.target) === handle);
    if (!session) throw new Error('Synthetic session changed');
    if (request.action === 'activity') return { state: session.state };
    if (request.action === 'read') return { messages: messages.get(handle), limited: false };
    if (request.action === 'send') {
      sends.push({ handle, text: request.text, submissionId: request.submissionId });
      messages.get(handle).push({ role: 'user', text: request.text }, { role: 'assistant', text: 'Synthetic reply accepted for this exact Hermes profile/session.' });
      return { accepted: true };
    }
    throw new Error('Unsupported synthetic request');
  }, { document: () => ({}) });
  const others = [
    { handle: 'fixture-codex', title: 'Codex regression row', agent: 'codex', state: 'idle', workspaceId: 'fixture-orca', workspaceName: 'Orca fixture', workspaceLabel: 'Orca fixture' },
    { handle: 'fixture-claude', title: 'Claude regression row', agent: 'claude', state: 'idle', workspaceId: 'fixture-orca', workspaceName: 'Orca fixture', workspaceLabel: 'Orca fixture' },
  ];
  const threads = await adapter.merge(others, []);
  return { threads, sends, source: 'hermes-transcript', state: 'waiting', progress: '',
    transcript: 'Please check this synthetic Hermes conversation.',
    workspaces: [...new Map(threads.map(t => [t.workspaceId, { id: t.workspaceId, name: t.workspaceName }])).values()],
    read: handle => handle.startsWith('hermes:') ? adapter.read(handle) : Promise.resolve({ text: '> Synthetic existing-agent regression conversation.', source: 'codex-transcript' }),
    activity: handle => handle.startsWith('hermes:') ? adapter.activity(handle) : Promise.resolve({ state: 'waiting' }),
    send: (handle, text) => adapter.send(handle, text, true),
  };
}
