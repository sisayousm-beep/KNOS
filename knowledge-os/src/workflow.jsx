// ============================================================
// Knowledge OS — Phase 5 Workflow store + trigger runtime
// Persists workflow definitions and a capped run log (localStorage),
// and fires triggers by diffing the live document set:
//   DocumentCreated / DocumentUpdated / TagAdded  → from doc changes
//   DailySchedule                                 → 24h interval check
//   Manual                                        → "Run now" button
// While the engine mutates documents, a re-entrancy guard stops those
// mutations from re-triggering workflows (no loops).
// ============================================================
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDocs } from './store.jsx';
import * as ai from './ai.js';
import { runWorkflow } from './engine.js';
import { uid } from './util.js';
import { SEED_WORKFLOWS } from './data.js';

const WF_KEY = 'logia.workflows.v1';
const RUN_KEY = 'logia.workflow.runs.v1';
const MAX_RUNS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const v = JSON.parse(raw); if (Array.isArray(v)) return v; }
  } catch { /* ignore corrupt storage */ }
  return fallback;
}

const WorkflowsContext = createContext(null);

export function WorkflowsProvider({ children }) {
  const { docs, updateDoc, createDoc } = useDocs();
  const [defs, setDefs] = useState(() => loadJSON(WF_KEY, SEED_WORKFLOWS));
  const [runs, setRuns] = useState(() => loadJSON(RUN_KEY, []));

  useEffect(() => { try { localStorage.setItem(WF_KEY, JSON.stringify(defs)); } catch { /* quota */ } }, [defs]);
  useEffect(() => { try { localStorage.setItem(RUN_KEY, JSON.stringify(runs)); } catch { /* quota */ } }, [runs]);

  // Latest-value refs so the trigger handlers / interval avoid stale closures.
  const docsRef = useRef(docs);
  const defsRef = useRef(defs);
  useEffect(() => { docsRef.current = docs; }, [docs]);
  useEffect(() => { defsRef.current = defs; }, [defs]);

  // > 0 while any workflow is executing — document mutations made by actions
  // must not be read as fresh triggers.
  const runningRef = useRef(0);

  const execute = useCallback(async (wf, doc, triggerLabel) => {
    runningRef.current += 1;
    try {
      const entry = await runWorkflow(wf, {
        doc,
        docs: docsRef.current,
        api: { updateDoc, createDoc },
        ai,
        triggerLabel,
      });
      setRuns((prev) => [entry, ...prev].slice(0, MAX_RUNS));
      setDefs((prev) => prev.map((w) => w.id === wf.id ? {
        ...w,
        stats: {
          runs: (w.stats?.runs || 0) + 1,
          success: (w.stats?.success || 0) + (entry.ok ? 1 : 0),
          lastRun: entry.at,
        },
      } : w));
      return entry;
    } finally {
      runningRef.current -= 1;
    }
  }, [updateDoc, createDoc]);

  const fire = useCallback((triggerType, doc) => {
    defsRef.current
      .filter((w) => w.enabled && w.trigger === triggerType)
      .forEach((w) => execute(w, doc, triggerType));
  }, [execute]);

  // Trigger source #1: diff the live document set against the last snapshot.
  const prevSnapRef = useRef(null);
  useEffect(() => {
    const snap = new Map(docs.map((d) => [d.id, { updatedAt: d.updatedAt, tags: (d.tags || []).length }]));
    const prev = prevSnapRef.current;
    // Skip the first population (seed/load) and any change caused by a running
    // workflow — only user-driven changes are triggers.
    if (prev && runningRef.current === 0) {
      docs.forEach((d) => {
        const before = prev.get(d.id);
        if (!before) { fire('DocumentCreated', d); return; }
        if (d.updatedAt !== before.updatedAt) fire('DocumentUpdated', d);
        if ((d.tags || []).length > before.tags) fire('TagAdded', d);
      });
    }
    prevSnapRef.current = snap;
  }, [docs, fire]);

  // Trigger source #2: DailySchedule — fire when ≥ 24h since last run.
  useEffect(() => {
    const tick = () => {
      if (runningRef.current > 0) return;
      const now = Date.now();
      defsRef.current
        .filter((w) => w.enabled && w.trigger === 'DailySchedule')
        .forEach((w) => {
          const last = w.stats?.lastRun ? new Date(w.stats.lastRun).getTime() : 0;
          if (now - last >= DAY_MS) execute(w, docsRef.current[0] || null, 'DailySchedule');
        });
    };
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [execute]);

  // ---- CRUD ----------------------------------------------------------------
  const createWorkflow = useCallback(() => {
    const id = uid('wf');
    setDefs((prev) => [{
      id, name: '새 워크플로우', enabled: false, trigger: 'Manual',
      actions: [{ id: uid('a'), type: 'Summarize', config: {} }],
      stats: { runs: 0, success: 0, lastRun: null },
    }, ...prev]);
    return id;
  }, []);

  const updateWorkflow = useCallback((id, patch) => {
    setDefs((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
  }, []);

  const deleteWorkflow = useCallback((id) => {
    setDefs((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // Manual / test run for any workflow against a chosen (or most-recent) doc.
  const runNow = useCallback((id, doc) => {
    const wf = defsRef.current.find((w) => w.id === id);
    if (!wf) return Promise.resolve(null);
    return execute(wf, doc ?? docsRef.current[0] ?? null, 'Manual');
  }, [execute]);

  const value = useMemo(() => ({
    defs, runs, createWorkflow, updateWorkflow, deleteWorkflow, runNow,
    hasKey: ai.hasKey(),
  }), [defs, runs, createWorkflow, updateWorkflow, deleteWorkflow, runNow]);

  return <WorkflowsContext.Provider value={value}>{children}</WorkflowsContext.Provider>;
}

export function useWorkflows() {
  const ctx = useContext(WorkflowsContext);
  if (!ctx) throw new Error('useWorkflows must be used within WorkflowsProvider');
  return ctx;
}
