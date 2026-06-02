// ============================================================
// Knowledge OS — Phase 5 Workflow engine (Trigger → Action[])
// Pure executor: given a workflow definition and a run context
// (subject doc, docs snapshot, store API, ai module), it runs the
// actions in order and returns a structured run record for the log.
// Design: 설계도.json §2.5 — Trigger / Action.
// ============================================================
import { excerpt } from './util.js';
import { uid } from './util.js';

export const TRIGGER_TYPES = ['DocumentCreated', 'DocumentUpdated', 'TagAdded', 'DailySchedule', 'Manual'];
export const ACTION_TYPES = ['Summarize', 'GenerateTag', 'CallAI', 'SendWebhook', 'RunScript'];

// Each handler returns { status: 'ok' | 'skip' | 'err', detail: string }.
const HANDLERS = {
  // Summarize the subject document and store the result on doc.summary.
  async Summarize(cfg, ctx) {
    if (!ctx.doc) return { status: 'skip', detail: '대상 문서 없음' };
    const { text, source } = await ctx.ai.summarize(ctx.doc);
    ctx.api.updateDoc(ctx.doc.id, { summary: text });
    return { status: 'ok', detail: `${source} · ${excerpt(text, 80)}` };
  },

  // Suggest tags for the subject document and append the new ones.
  async GenerateTag(cfg, ctx) {
    if (!ctx.doc) return { status: 'skip', detail: '대상 문서 없음' };
    const existing = ctx.doc.tags || [];
    const { tags, source } = await ctx.ai.suggestTags(ctx.doc, existing);
    if (!tags.length) return { status: 'ok', detail: '새 태그 없음' };
    ctx.api.updateDoc(ctx.doc.id, { tags: [...existing, ...tags] });
    return { status: 'ok', detail: `+${tags.join(', ')} (${source})` };
  },

  // Ask the knowledge base a fixed question (RAG / keyword retrieval).
  async CallAI(cfg, ctx) {
    const prompt = (cfg.prompt || '').trim();
    if (!prompt) return { status: 'skip', detail: '프롬프트 비어 있음' };
    const { answer, source } = await ctx.ai.ask(prompt, ctx.docs);
    return { status: 'ok', detail: `${source}: ${excerpt(answer, 100)}` };
  },

  // POST a small JSON payload to an external endpoint.
  async SendWebhook(cfg, ctx) {
    const url = (cfg.url || '').trim();
    if (!url) return { status: 'skip', detail: 'URL 없음' };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: ctx.triggerLabel,
          at: new Date().toISOString(),
          doc: ctx.doc ? { id: ctx.doc.id, title: ctx.doc.title } : null,
        }),
      });
      return { status: res.ok ? 'ok' : 'err', detail: `HTTP ${res.status}` };
    } catch (e) {
      return { status: 'err', detail: e.message || '네트워크 오류' };
    }
  },

  // The WebView sandbox cannot spawn a shell, so the script is recorded only.
  async RunScript(cfg, ctx) {
    const script = (cfg.script || '').trim();
    if (!script) return { status: 'skip', detail: '스크립트 없음' };
    return { status: 'ok', detail: `기록됨(샌드박스): ${excerpt(script, 60)}` };
  },
};

// Run one workflow's actions in sequence. Never throws — failures land in
// the returned record so the UI can show them.
export async function runWorkflow(wf, ctx) {
  const steps = [];
  let ok = true;
  for (const action of wf.actions) {
    const handler = HANDLERS[action.type];
    if (!handler) {
      steps.push({ type: action.type, status: 'err', detail: '알 수 없는 액션' });
      ok = false;
      continue;
    }
    try {
      const r = await handler(action.config || {}, ctx);
      steps.push({ type: action.type, ...r });
      if (r.status === 'err') ok = false;
    } catch (e) {
      steps.push({ type: action.type, status: 'err', detail: e.message || '실행 오류' });
      ok = false;
    }
  }
  return {
    id: uid('run'),
    workflowId: wf.id,
    workflowName: wf.name,
    trigger: ctx.triggerLabel || wf.trigger,
    docTitle: ctx.doc?.title || null,
    at: new Date().toISOString(),
    ok,
    steps,
  };
}
