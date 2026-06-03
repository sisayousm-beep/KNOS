// ============================================================
// Knowledge OS — Phase 6 Plugin SDK (Hook bus · Sandbox · Built-ins)
// Design: 설계도.json §3 — Plugin { name, version, onLoad, onUnload },
// hooks (onDocumentCreated/Updated/Deleted, onTagAdded, onSearch,
// onAIResponse), and a permission-gated sandbox.
//
// A plugin never touches the app directly. On load it receives a
// `ctx` (the sandbox): it can subscribe to hooks and call host APIs,
// but every capability is gated by the permissions it declared — a
// call it didn't ask for throws and is recorded as a violation.
// ============================================================

export const HOOK_TYPES = [
  'onDocumentCreated', 'onDocumentUpdated', 'onDocumentDeleted',
  'onTagAdded', 'onSearch', 'onAIResponse',
];

// Capability → human label (shown on cards / install dialog).
export const PERMISSIONS = {
  'docs:read': '문서 읽기',
  'docs:write': '문서 수정',
  'ai': 'AI 호출',
  'network': '네트워크',
};

// ---- Hook bus -------------------------------------------------------------
// Module-level singleton so any view can fire an event (onSearch from the
// Search view, onAIResponse from the AI workspace) without prop drilling;
// the provider registers/unregisters plugin handlers on the same bus.
class HookBus {
  constructor() { this.map = new Map(); }
  on(hook, fn) {
    let set = this.map.get(hook);
    if (!set) { set = new Set(); this.map.set(hook, set); }
    set.add(fn);
  }
  off(hook, fn) { this.map.get(hook)?.delete(fn); }
  // Handlers are pre-wrapped to swallow their own errors, so this never throws.
  async emit(hook, payload) {
    const set = this.map.get(hook);
    if (!set || set.size === 0) return;
    await Promise.all([...set].map((fn) => fn(payload)));
  }
}

export const bus = new HookBus();

// ---- Sandbox --------------------------------------------------------------
// Builds the `ctx` handed to a plugin's onLoad. `host` supplies the real
// capabilities (live docs, store API, ai); `onActivity` receives every log
// line and blocked-call the plugin produces.
export function createSandbox(plugin, host, onActivity) {
  const perms = new Set(plugin.permissions || []);
  const log = (detail, level = 'info') => onActivity({ plugin: plugin.name, level, detail });

  // Throw (and record) if the plugin calls a capability it never declared.
  const need = (perm, fnName) => {
    if (!perms.has(perm)) {
      const err = new Error(`'${fnName}' 차단됨 — '${perm}' 권한 미선언`);
      err.blocked = true;
      log(err.message, 'blocked');
      throw err;
    }
  };

  const subs = [];
  const ctx = {
    // Subscribe a plugin handler; errors inside it are caught and logged so
    // one bad plugin can't break the hook chain. Blocked-capability errors
    // are already logged by need(), so they aren't double-reported here.
    on(hook, handler) {
      const wrapped = async (payload) => {
        try { await handler(payload, ctx); }
        catch (e) { if (!e.blocked) log(e.message || '핸들러 오류', 'error'); }
      };
      bus.on(hook, wrapped);
      subs.push([hook, wrapped]);
    },
    log: (detail) => log(detail),
    // Always-available, side-effect-free.
    getDocs: () => { need('docs:read', 'getDocs'); return host.getDocs(); },
    updateDoc: (id, patch) => { need('docs:write', 'updateDoc'); return host.updateDoc(id, patch); },
    createDoc: (partial) => { need('docs:write', 'createDoc'); return host.createDoc(partial); },
    ai: {
      summarize: (d) => { need('ai', 'ai.summarize'); return host.ai.summarize(d); },
      suggestTags: (d, e) => { need('ai', 'ai.suggestTags'); return host.ai.suggestTags(d, e); },
      ask: (q, docs) => { need('ai', 'ai.ask'); return host.ai.ask(q, docs); },
    },
    fetch: (url, opts) => { need('network', 'fetch'); return fetch(url, opts); },
  };
  ctx._unsubscribe = () => subs.forEach(([h, fn]) => bus.off(h, fn));
  return ctx;
}

// ---- Built-in plugins -----------------------------------------------------
// Real, in-process plugins. Each implements the Plugin interface and only
// uses capabilities it declares. Together they exercise all six hooks.
// (Network/file plugins like PDF Import live outside the WebView sandbox, so
// only capabilities that genuinely run here are shipped.)
export const BUILTIN_PLUGINS = [
  {
    id: 'git-sync', name: 'Git Sync', version: '1.2.0', author: 'logia', icon: 'code',
    desc: '문서 생성·수정·삭제 시 커밋 로그를 자동 기록합니다.',
    permissions: ['docs:read'],
    onLoad(ctx) {
      ctx.on('onDocumentCreated', (d) => ctx.log(`git commit -m "add: ${d.title}"`));
      ctx.on('onDocumentUpdated', (d) => ctx.log(`git commit -m "update: ${d.title}" (${d.words ?? 0}w)`));
      ctx.on('onDocumentDeleted', (d) => ctx.log(`git rm "${d.title || d.id}"`));
    },
  },
  {
    id: 'word-count', name: 'Word Count', version: '1.0.0', author: 'logia', icon: 'hash',
    desc: '문서를 수정할 때 단어 수를 활동 로그에 표시합니다. (권한 불필요)',
    permissions: [],
    onLoad(ctx) {
      ctx.on('onDocumentUpdated', (d) => ctx.log(`${d.title}: ${d.words ?? 0} 단어`));
    },
  },
  {
    id: 'archivist', name: 'Archivist', version: '1.1.0', author: 'logia', icon: 'folder',
    desc: '태그 추가와 문서 삭제 이벤트를 추적합니다.',
    permissions: [],
    onLoad(ctx) {
      ctx.on('onTagAdded', (d) => ctx.log(`태그 추가 · ${d.title} [${(d.tags || []).join(', ')}]`));
      ctx.on('onDocumentDeleted', (d) => ctx.log(`삭제 감지 · ${d.title || d.id}`));
    },
  },
  {
    id: 'search-logger', name: 'Search Insights', version: '1.0.0', author: 'logia', icon: 'search',
    desc: '검색 질의와 결과 수를 기록합니다. (onSearch 훅)',
    permissions: [],
    onLoad(ctx) {
      ctx.on('onSearch', (e) => { if (e.query) ctx.log(`검색 "${e.query}" → ${e.results}건`); });
    },
  },
  {
    id: 'ai-audit', name: 'AI Audit Log', version: '1.0.0', author: 'logia', icon: 'eye',
    desc: 'AI 응답을 감사 로그에 남깁니다. (onAIResponse 훅)',
    permissions: [],
    onLoad(ctx) {
      ctx.on('onAIResponse', (e) => ctx.log(`AI 응답 · ${e.source} · "${(e.question || '').slice(0, 30)}"`));
    },
  },
  {
    id: 'research-assistant', name: 'Research Assistant', version: '2.1.0', author: 'logia', icon: 'sparkles',
    desc: '새 문서를 AI로 분석해 태그를 자동 생성하고 문서에 반영합니다.', featured: true,
    permissions: ['docs:read', 'docs:write', 'ai'],
    onLoad(ctx) {
      ctx.on('onDocumentCreated', async (d) => {
        const existing = d.tags || [];
        const { tags, source } = await ctx.ai.suggestTags(d, existing);
        if (tags.length) {
          ctx.updateDoc(d.id, { tags: [...existing, ...tags] });
          ctx.log(`+${tags.join(', ')} (${source})`);
        } else {
          ctx.log('새 태그 없음');
        }
      });
    },
  },
];

// First-run install state. Benign (no permissions) plugins ship enabled so
// the system is visibly alive; the AI-writing one ships uninstalled so
// launching never fires an unexpected AI call (mirrors SEED_WORKFLOWS).
export const DEFAULT_STATE = {
  'git-sync': { installed: true, enabled: true },
  'word-count': { installed: true, enabled: true },
  'archivist': { installed: true, enabled: true },
  'search-logger': { installed: true, enabled: true },
  'ai-audit': { installed: true, enabled: false },
  'research-assistant': { installed: false, enabled: false },
};
