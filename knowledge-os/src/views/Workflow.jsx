// Knowledge OS — Workflow Builder (Phase 5: Trigger → Action[])
// A real automation manager: define workflows, toggle them on, run them
// manually, and watch the run log. Execution + triggers live in
// workflow.jsx (store/runtime) and engine.js (action executors).
import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { useWorkflows } from '../workflow.jsx';
import { useDocs } from '../store.jsx';
import { ACTION_TYPES, TRIGGER_TYPES } from '../engine.js';
import { uid, relativeTime } from '../util.js';

const TRIGGER_META = {
  DocumentCreated: { icon: 'doc', label: '문서 생성됨', tone: 'success' },
  DocumentUpdated: { icon: 'save', label: '문서 수정됨', tone: 'success' },
  TagAdded:        { icon: 'hash', label: '태그 추가됨', tone: 'success' },
  DailySchedule:   { icon: 'calendar', label: '매일 스케줄', tone: 'warning' },
  Manual:          { icon: 'play', label: '수동 실행', tone: 'accent' },
};
const ACTION_META = {
  Summarize:   { icon: 'sparkles', label: 'AI 요약', desc: '대상 문서를 요약해 저장' },
  GenerateTag: { icon: 'hash', label: 'AI 태그', desc: '문서에 태그 자동 추가' },
  CallAI:      { icon: 'ai', label: 'AI 질문', desc: '지식베이스에 질의 (RAG)' },
  SendWebhook: { icon: 'webhook', label: '웹훅 전송', desc: '외부 URL로 POST' },
  RunScript:   { icon: 'code', label: '스크립트', desc: '스크립트 기록 (샌드박스)' },
};
const STATUS_BADGE = { ok: 'badge-success', err: 'badge-error', skip: 'badge-warning' };

export default function WorkflowBuilder() {
  const { defs, runs, createWorkflow, updateWorkflow, deleteWorkflow, runNow, hasKey } = useWorkflows();
  const { docs } = useDocs();
  const [selId, setSelId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [runningId, setRunningId] = useState(null);

  const sel = defs.find((w) => w.id === selId) ?? defs[0] ?? null;
  const targetDoc = docs.find((d) => d.id === targetId) ?? docs[0] ?? null;

  function addAction(wf, type) {
    updateWorkflow(wf.id, { actions: [...wf.actions, { id: uid('a'), type, config: {} }] });
  }
  function removeAction(wf, aid) {
    updateWorkflow(wf.id, { actions: wf.actions.filter((a) => a.id !== aid) });
  }
  function patchConfig(wf, aid, configPatch) {
    updateWorkflow(wf.id, {
      actions: wf.actions.map((a) => a.id === aid ? { ...a, config: { ...a.config, ...configPatch } } : a),
    });
  }
  async function doRun(wf) {
    setRunningId(wf.id);
    try { await runNow(wf.id, targetDoc); } finally { setRunningId(null); }
  }
  function remove(wf) {
    deleteWorkflow(wf.id);
    if (sel?.id === wf.id) setSelId(null);
  }

  const selRuns = sel ? runs.filter((r) => r.workflowId === sel.id) : runs;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* ── Workflow list ───────────────────────────────────────── */}
      <div style={{ width: 240, flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 12px 8px', display: 'flex', alignItems: 'center' }}>
          <div className="section-label" style={{ flex: 1 }}>Workflows · {defs.length}</div>
          <button className="btn btn-icon btn-sm btn-ghost" title="새 워크플로우" onClick={() => setSelId(createWorkflow())}>
            <Icon name="plus" size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
          {defs.map((w) => {
            const tm = TRIGGER_META[w.trigger];
            const active = sel?.id === w.id;
            return (
              <div key={w.id} onClick={() => setSelId(w.id)} className="list-row"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: '10px 11px', marginBottom: 4, background: active ? 'var(--accent-bg)' : 'var(--surface-primary)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flex: 'none', background: w.enabled ? 'var(--success)' : 'var(--text-tertiary)' }}></span>
                  <span style={{ flex: 1, fontSize: 'var(--text-base)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${tm.tone}`} style={{ height: 18 }}><Icon name={tm.icon} size={10} />{tm.label}</span>
                  <span style={{ flex: 1 }}></span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{w.actions.length}동작 · {w.stats?.runs || 0}회</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Editor ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', background: 'var(--bg-primary)' }}>
        {!sel ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ textAlign: 'center' }}>
              <Icon name="workflow" size={32} style={{ color: 'var(--text-tertiary)' }} />
              <div style={{ marginTop: 10, fontSize: 'var(--text-md)' }}>워크플로우를 선택하거나 새로 만드세요</div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 48px' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <input className="input" value={sel.name} onChange={(e) => updateWorkflow(sel.id, { name: e.target.value })}
                style={{ flex: 1, fontSize: 'var(--text-lg)', fontWeight: 600 }} />
              <label className="switch" title={sel.enabled ? '활성' : '비활성'}>
                <input type="checkbox" checked={sel.enabled} onChange={(e) => updateWorkflow(sel.id, { enabled: e.target.checked })} />
                <span className="track"></span><span className="thumb"></span>
              </label>
              <button className="btn btn-icon btn-sm btn-ghost" title="삭제" onClick={() => remove(sel)}><Icon name="trash" size={14} /></button>
            </div>

            {!hasKey && (
              <div className="card" style={{ padding: '9px 12px', marginBottom: 16, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Gemini 키 없음 → AI 동작은 로컬 휴리스틱으로 실행됩니다. (설정에서 키 입력 가능)
              </div>
            )}

            {/* TRIGGER */}
            <div className="section-label" style={{ marginBottom: 8 }}>Trigger · 시작 조건</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {TRIGGER_TYPES.map((t) => {
                const tm = TRIGGER_META[t]; const on = sel.trigger === t;
                return (
                  <button key={t} onClick={() => updateWorkflow(sel.id, { trigger: t })}
                    className="btn btn-sm" style={{ borderColor: on ? 'var(--accent)' : undefined, background: on ? 'var(--accent-bg)' : undefined, color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <Icon name={tm.icon} size={13} style={{ color: on ? 'var(--accent)' : 'var(--text-tertiary)' }} />{tm.label}
                  </button>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="section-label" style={{ marginBottom: 8 }}>Actions · 순차 실행 ({sel.actions.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sel.actions.map((a, i) => {
                const am = ACTION_META[a.type];
                return (
                  <div key={a.id} className="card" style={{ padding: '12px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'var(--accent-bg)', color: 'var(--accent)', flex: 'none' }}>
                        <Icon name={am?.icon || 'play'} size={14} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{i + 1}. {am?.label || a.type}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{am?.desc}</div>
                      </div>
                      <button className="btn btn-icon btn-sm btn-ghost" title="동작 삭제" onClick={() => removeAction(sel, a.id)}><Icon name="x" size={13} /></button>
                    </div>
                    {a.type === 'CallAI' && (
                      <textarea className="input" placeholder="AI에게 보낼 질문" value={a.config.prompt || ''}
                        onChange={(e) => patchConfig(sel, a.id, { prompt: e.target.value })} style={{ marginTop: 10, minHeight: 52 }} />
                    )}
                    {a.type === 'SendWebhook' && (
                      <input className="input mono" placeholder="https://example.com/hook" value={a.config.url || ''}
                        onChange={(e) => patchConfig(sel, a.id, { url: e.target.value })} style={{ marginTop: 10 }} />
                    )}
                    {a.type === 'RunScript' && (
                      <textarea className="input mono" placeholder="echo hello" value={a.config.script || ''}
                        onChange={(e) => patchConfig(sel, a.id, { script: e.target.value })} style={{ marginTop: 10, minHeight: 52 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* add action */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {ACTION_TYPES.map((t) => (
                <button key={t} className="btn btn-sm btn-ghost" onClick={() => addAction(sel, t)}>
                  <Icon name="plus" size={11} />{ACTION_META[t].label}
                </button>
              ))}
            </div>

            {/* run bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', flex: 'none' }}>대상</span>
              <select className="input" value={targetDoc?.id || ''} onChange={(e) => setTargetId(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
                {docs.length === 0 && <option value="">문서 없음</option>}
                {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
              <button className="btn btn-primary" disabled={runningId === sel.id || !sel.actions.length} onClick={() => doRun(sel)}>
                {runningId === sel.id
                  ? <><span className="spinner" style={{ width: 13, height: 13 }}></span>실행 중…</>
                  : <><Icon name="play" size={13} />지금 실행</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Run log ─────────────────────────────────────────────── */}
      <div style={{ width: 312, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 14px 8px' }}>
          <div className="section-label">Run Log {sel && `· ${sel.name}`}</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {selRuns.length === 0 && (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              아직 실행 기록이 없습니다.<br />“지금 실행”으로 테스트하세요.
            </div>
          )}
          {selRuns.map((r) => (
            <div key={r.id} className="card" style={{ padding: '11px 12px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span className={`badge ${r.ok ? 'badge-success' : 'badge-error'}`} style={{ height: 18 }}>
                  <Icon name={r.ok ? 'check' : 'x'} size={10} />{r.ok ? '성공' : '실패'}
                </span>
                <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{r.trigger}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{relativeTime(r.at)}</span>
              </div>
              {r.docTitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>📄 {r.docTitle}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {r.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                    <span className={`badge ${STATUS_BADGE[s.status] || 'badge-warning'}`} style={{ height: 15, flex: 'none' }}>{s.type}</span>
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.detail}>{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
