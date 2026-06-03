// ============================================================
// Knowledge OS — Phase 6 Plugin runtime (provider)
// Loads/unloads installed+enabled plugins against the live document
// store, fires document hooks by diffing docs (same approach as the
// Phase 5 workflow engine), and collects every plugin log line.
// ============================================================
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDocs } from './store.jsx';
import * as ai from './ai.js';
import { uid } from './util.js';
import { bus, createSandbox, BUILTIN_PLUGINS, DEFAULT_STATE } from './plugins.js';

const STATE_KEY = 'logia.plugins.v1';
const ACT_KEY = 'logia.plugin.activity.v1';
const MAX_ACT = 60;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt storage */ }
  return fallback;
}

const PluginsContext = createContext(null);

export function PluginsProvider({ children }) {
  const { docs, updateDoc, createDoc } = useDocs();
  const [state, setState] = useState(() => loadJSON(STATE_KEY, DEFAULT_STATE));
  const [activity, setActivity] = useState(() => loadJSON(ACT_KEY, []));

  useEffect(() => { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* quota */ } }, [state]);
  useEffect(() => { try { localStorage.setItem(ACT_KEY, JSON.stringify(activity)); } catch { /* quota */ } }, [activity]);

  // Live refs so loaded plugins (registered once) always see fresh data.
  const docsRef = useRef(docs);
  useEffect(() => { docsRef.current = docs; }, [docs]);
  const hostRef = useRef(null);
  hostRef.current = {
    getDocs: () => docsRef.current,
    updateDoc, createDoc, ai,
  };

  const pushActivity = useCallback((e) => {
    setActivity((prev) => [{ id: uid('act'), at: Date.now(), ...e }, ...prev].slice(0, MAX_ACT));
  }, []);

  // > 0 while document hooks run — mutations a plugin makes (e.g. Research
  // Assistant writing tags) must not be re-read as fresh triggers (no loops).
  const runningRef = useRef(0);
  const emitDocHook = useCallback((hook, payload) => {
    runningRef.current += 1;
    Promise.resolve(bus.emit(hook, payload)).finally(() => { runningRef.current -= 1; });
  }, []);

  // ---- Plugin lifecycle: reconcile loaded set with installed+enabled state.
  const loadedRef = useRef(new Map()); // id -> sandbox ctx
  useEffect(() => {
    const loaded = loadedRef.current;
    BUILTIN_PLUGINS.forEach((p) => {
      const on = state[p.id]?.installed && state[p.id]?.enabled;
      const isLoaded = loaded.has(p.id);
      if (on && !isLoaded) {
        const ctx = createSandbox(p, hostRef.current, pushActivity);
        try { p.onLoad?.(ctx); } catch (e) { pushActivity({ plugin: p.name, level: 'error', detail: `로드 실패: ${e.message}` }); }
        loaded.set(p.id, ctx);
      } else if (!on && isLoaded) {
        const ctx = loaded.get(p.id);
        ctx._unsubscribe();
        try { p.onUnload?.(); } catch { /* ignore */ }
        loaded.delete(p.id);
      }
    });
  }, [state, pushActivity]);

  // Unload everything on unmount.
  useEffect(() => () => {
    loadedRef.current.forEach((ctx) => ctx._unsubscribe());
    loadedRef.current.clear();
  }, []);

  // ---- Document hooks: diff the live doc set against the last snapshot.
  const prevSnapRef = useRef(null);
  useEffect(() => {
    const snap = new Map(docs.map((d) => [d.id, { updatedAt: d.updatedAt, tags: (d.tags || []).length, title: d.title }]));
    const prev = prevSnapRef.current;
    if (prev && runningRef.current === 0) {
      docs.forEach((d) => {
        const before = prev.get(d.id);
        if (!before) { emitDocHook('onDocumentCreated', d); return; }
        if (d.updatedAt !== before.updatedAt) emitDocHook('onDocumentUpdated', d);
        if ((d.tags || []).length > before.tags) emitDocHook('onTagAdded', d);
      });
      prev.forEach((v, id) => { if (!snap.has(id)) emitDocHook('onDocumentDeleted', { id, title: v.title }); });
    }
    prevSnapRef.current = snap;
  }, [docs, emitDocHook]);

  // ---- Store actions -------------------------------------------------------
  const install = useCallback((id) => setState((s) => ({ ...s, [id]: { installed: true, enabled: true } })), []);
  const uninstall = useCallback((id) => setState((s) => ({ ...s, [id]: { installed: false, enabled: false } })), []);
  const toggle = useCallback((id) => setState((s) => ({ ...s, [id]: { installed: true, enabled: !s[id]?.enabled } })), []);
  const clearLog = useCallback(() => setActivity([]), []);

  // Sandbox check: run the side-effect-free capabilities through the real
  // gate so a denied call is visibly blocked; ai/network grants are reported
  // from the declaration (not invoked, to avoid real calls).
  const probe = useCallback((id) => {
    const p = BUILTIN_PLUGINS.find((x) => x.id === id);
    if (!p) return;
    const sb = createSandbox(p, hostRef.current, () => {});
    const test = (label, fn) => { try { fn(); return `${label}=허용`; } catch { return `${label}=차단`; } };
    const out = [
      test('docs:read', () => sb.getDocs()),
      test('docs:write', () => sb.updateDoc('__probe__', {})),
      `ai=${p.permissions.includes('ai') ? '허용' : '차단'}`,
      `network=${p.permissions.includes('network') ? '허용' : '차단'}`,
    ];
    sb._unsubscribe();
    pushActivity({ plugin: p.name, level: 'info', detail: `샌드박스 점검 · ${out.join(' · ')}` });
  }, [pushActivity]);

  const catalog = useMemo(() => BUILTIN_PLUGINS.map((p) => ({
    ...p,
    installed: state[p.id]?.installed ?? false,
    enabled: state[p.id]?.enabled ?? false,
  })), [state]);

  const value = useMemo(() => ({
    catalog, activity, install, uninstall, toggle, probe, clearLog,
    activeCount: catalog.filter((p) => p.installed && p.enabled).length,
  }), [catalog, activity, install, uninstall, toggle, probe, clearLog]);

  return <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>;
}

export function usePlugins() {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error('usePlugins must be used within PluginsProvider');
  return ctx;
}
