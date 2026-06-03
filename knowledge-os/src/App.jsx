// ============================================================
// Knowledge OS — App shell (sidebar, topbar, command palette, routing)
// ============================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './icons.jsx';
import { NAV } from './data.js';
import { useDocs } from './store.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRow, TweakRadio, TweakColor } from './tweaks.jsx';
import * as ai from './ai.js';

import Dashboard from './views/Dashboard.jsx';
import DocumentEditor from './views/Editor.jsx';
import KnowledgeGraph from './views/Graph.jsx';
import SearchCenter from './views/Search.jsx';
import AIWorkspace from './views/AIWorkspace.jsx';
import WorkflowBuilder from './views/Workflow.jsx';
import PluginMarketplace from './views/Plugins.jsx';
import EmptyView from './views/Empty.jsx';

const TWEAK_DEFAULTS = {
  theme: 'dark',
  dashboardDensity: 'spacious',
  graphLayout: 'force',
  accent: '#8B5CF6',
};

function CommandPalette({ open, onClose, onNav, onOpen, onNew }) {
  const { docs } = useDocs();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); }
  }, [open]);
  if (!open) return null;
  const ql = q.toLowerCase();
  const navMatches = NAV.filter((n) => !q || n.label.toLowerCase().includes(ql));
  const docMatches = docs.filter((d) => !q || d.title.toLowerCase().includes(ql)).slice(0, 5);
  const actions = [
    { icon: 'plus', label: 'New Document', kbd: '⌘N', act: 'new' },
    { icon: 'sparkles', label: q ? `Ask AI: "${q}"` : 'Ask AI…', kbd: '⌘J', ai: true, go: 'ai' },
    { icon: 'graph', label: 'Open Knowledge Graph', go: 'graph' },
  ].filter((a) => !q || a.label.toLowerCase().includes(ql) || a.ai);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--scrim)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px,92vw)', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={17} style={{ color: 'var(--text-tertiary)' }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="문서 검색, AI 질문, 또는 명령 실행…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-sans)' }} />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: '52vh', overflow: 'auto', padding: 6 }}>
          {docMatches.length > 0 && <>
            <div className="section-label" style={{ padding: '8px 10px 4px' }}>Documents</div>
            {docMatches.map((d) => (
              <div key={d.id} className="list-row" onClick={() => { onOpen(d); onClose(); }}>
                <Icon name="doc" size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ flex: 1 }}>{d.title}</span>
                {d.ai && <span className="badge badge-accent" style={{ height: 16 }}><span className="dot"></span>AI</span>}
              </div>
            ))}
          </>}
          <div className="section-label" style={{ padding: '8px 10px 4px' }}>Actions</div>
          {actions.map((a, i) => (
            <div key={i} className="list-row" onClick={() => { if (a.act === 'new') onNew(); else if (a.go) onNav(a.go); onClose(); }}>
              <Icon name={a.icon} size={15} style={a.ai ? { color: 'var(--accent)' } : { color: 'var(--text-tertiary)' }} />
              <span style={{ flex: 1 }}>{a.label}</span>
              {a.kbd && <span className="kbd">{a.kbd}</span>}
            </div>
          ))}
          <div className="section-label" style={{ padding: '8px 10px 4px' }}>Navigate</div>
          {navMatches.map((n) => (
            <div key={n.id} className="list-row" onClick={() => { onNav(n.id); onClose(); }}>
              <Icon name={n.icon} size={15} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ flex: 1 }}>{n.label}</span>
              <span className="kbd">{n.kbd}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Collapsible document explorer: groups every document by its tags
// (project → category) so the whole knowledge base is visible at a glance.
function DocTree({ onOpen }) {
  const { docs } = useDocs();
  const [open, setOpen] = useState({});
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const groups = useMemo(() => {
    const g = {};
    docs.forEach((d) => {
      const top = (d.tags && d.tags[0]) || '기타';
      const sub = (d.tags && d.tags[1]) || '일반';
      ((g[top] ||= {})[sub] ||= []).push(d);
    });
    return g;
  }, [docs]);

  const topNames = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'ko'));

  return (
    <div style={{ marginTop: 4 }}>
      <div className="section-label" style={{ padding: '14px 10px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="folder" size={12} style={{ color: 'var(--text-tertiary)' }} />문서 ({docs.length})
      </div>
      {topNames.map((top) => {
        const subs = groups[top];
        const count = Object.values(subs).reduce((n, arr) => n + arr.length, 0);
        const isOpen = open[top];
        return (
          <div key={top}>
            <div className="list-row" onClick={() => toggle(top)} title={top}
              style={{ padding: '6px 8px', marginBottom: 1, color: 'var(--text-secondary)' }}>
              <Icon name={isOpen ? 'chevD' : 'chevR'} size={12} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
              <span style={{ flex: 1, fontSize: 'var(--text-base)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{count}</span>
            </div>
            {isOpen && Object.keys(subs).sort((a, b) => a.localeCompare(b, 'ko')).map((sub) => {
              const key = top + '/' + sub;
              const subOpen = open[key];
              return (
                <div key={key}>
                  <div className="list-row" onClick={() => toggle(key)} title={sub}
                    style={{ padding: '5px 8px 5px 20px', marginBottom: 1 }}>
                    <Icon name={subOpen ? 'chevD' : 'chevR'} size={11} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{subs[sub].length}</span>
                  </div>
                  {subOpen && subs[sub].map((d) => (
                    <div key={d.id} className="list-row" onClick={() => onOpen(d)} title={d.title}
                      style={{ padding: '5px 8px 5px 34px', marginBottom: 1 }}>
                      <Icon name="doc" size={12} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({ view, onNav, collapsed, onToggle, onNew }) {
  return (
    <aside style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)', flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', transition: 'width var(--dur) var(--ease)' }}>
      <div style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <img src="/logo.png" alt="LOGIA" style={{ width: 28, height: 28, borderRadius: 8, flex: 'none', objectFit: 'cover', boxShadow: '0 0 0 1px var(--border-subtle)' }} />
        {!collapsed && <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LOGIA</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Knowledge OS</div>
          </div>
          <Icon name="chevD" size={13} style={{ color: 'var(--text-tertiary)' }} />
        </>}
      </div>

      <div style={{ padding: '10px 10px 4px' }}>
        <button className="btn btn-primary" onClick={onNew} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Icon name="plus" size={14} />{!collapsed && 'New Document'}
        </button>
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
        {NAV.map((n) => {
          const active = view === n.id;
          return (
            <div key={n.id} onClick={() => onNav(n.id)} className="list-row" title={n.label}
              style={{ padding: collapsed ? '9px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? 'var(--accent-bg)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 1 }}>
              <Icon name={n.icon} size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)', flex: 'none' }} />
              {!collapsed && <><span style={{ flex: 1, fontSize: 'var(--text-base)', fontWeight: active ? 500 : 450 }}>{n.label}</span>
                <span className="kbd">{n.kbd}</span></>}
            </div>
          );
        })}

        {!collapsed && <DocTree onOpen={(d) => onNav({ open: d })} />}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="avatar" style={{ flex: 'none' }}>YK</div>
        {!collapsed && <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>연구원</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Pro · Gemini</div>
          </div>
          <button className="btn btn-icon btn-sm btn-ghost" onClick={onToggle}><Icon name="chevL" size={14} /></button>
        </>}
        {collapsed && <button className="btn btn-icon btn-sm btn-ghost" onClick={onToggle} style={{ position: 'absolute' }}><Icon name="chevR" size={14} /></button>}
      </div>
    </aside>
  );
}

function Topbar({ view, onCmd, theme, onTheme, onSettings }) {
  const meta = NAV.find((n) => n.id === view) || { label: 'Dashboard', icon: 'home' };
  return (
    <header style={{ height: 'var(--topbar-h)', flex: 'none', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: 'var(--bg-secondary)' }}>
      <Icon name={meta.icon} size={16} style={{ color: 'var(--text-tertiary)' }} />
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, whiteSpace: 'nowrap' }}>{meta.label}</span>
      <div style={{ flex: 1 }}></div>
      <button onClick={onCmd} className="btn btn-sm" style={{ color: 'var(--text-tertiary)', minWidth: 180, justifyContent: 'flex-start', gap: 8 }}>
        <Icon name="search" size={14} />검색 또는 명령…<span style={{ flex: 1 }}></span><span className="kbd">⌘K</span>
      </button>
      <button className="btn btn-icon btn-sm btn-ghost" onClick={onSettings} title="Settings"><Icon name="settings" size={15} /></button>
      <div style={{ display: 'inline-flex', padding: 2, gap: 2, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        {['dark', 'light'].map((m) => (
          <button key={m} onClick={() => onTheme(m)} style={{ display: 'grid', placeItems: 'center', width: 26, height: 22, border: 'none', background: theme === m ? 'var(--surface-elevated)' : 'none', color: theme === m ? 'var(--text-primary)' : 'var(--text-tertiary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: theme === m ? 'var(--shadow-sm)' : 'none' }}>
            <Icon name={m === 'dark' ? 'moon' : 'sun'} size={13} />
          </button>
        ))}
      </div>
    </header>
  );
}

// Gemini API key: enter / validate / save. Persisted by ai.js to localStorage.
// Without a key, Phase 3 AI features fall back to local heuristics.
function GeminiKeyField() {
  const [val, setVal] = useState(() => ai.getKey());
  const [status, setStatus] = useState('idle'); // idle | checking | ok | bad
  const [msg, setMsg] = useState('');

  function onChange(v) { setVal(v); ai.setKey(v); setStatus('idle'); setMsg(''); }

  async function validate() {
    setStatus('checking'); setMsg('');
    const r = await ai.validateKey(val);
    if (r.ok) { ai.setKey(val); setStatus('ok'); setMsg('연결됨 · Gemini Flash'); }
    else { setStatus('bad'); setMsg(r.error); }
  }

  const tint = status === 'ok' ? '#1a7f4b' : status === 'bad' ? '#c0392b' : 'rgba(41,38,27,.5)';
  return (
    <TweakRow label="API Key">
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="twk-field" type="password" value={val} placeholder="AIza…"
               onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }} />
        <button className="twk-x" type="button" title="키 검증" onClick={validate}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ width: 'auto', padding: '0 8px', fontSize: 11 }}>
          {status === 'checking' ? '검증 중…' : '검증'}
        </button>
      </div>
      <div style={{ fontSize: 10, color: tint, minHeight: 13, marginTop: 2 }}>
        {msg || (val ? '저장됨 · 검증을 눌러 확인' : '비워두면 로컬 휴리스틱 모드')}
      </div>
    </TweakRow>
  );
}

export default function App() {
  const { createDoc } = useDocs();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('dashboard');
  const [openId, setOpenId] = useState(null);
  const [cmd, setCmd] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState(false);

  useEffect(() => { document.documentElement.setAttribute('data-theme', t.theme); }, [t.theme]);
  useEffect(() => { if (t.accent) document.documentElement.style.setProperty('--accent', t.accent); }, [t.accent]);

  const onOpen = (d) => { setOpenId(d.id); setView('editor'); };
  const onNew = () => { const id = createDoc(); setOpenId(id); setView('editor'); };
  // Sidebar favorites pass {open: doc}; nav items pass a string id.
  const onNav = (target) => {
    if (target && typeof target === 'object' && target.open) onOpen(target.open);
    else setView(target);
  };

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((c) => !c); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); onNew(); }
      else if (e.key === 'Escape') { setCmd(false); }
      else if (!cmd && /^[1-7]$/.test(e.key) && !(e.target.closest && e.target.closest('input,textarea'))) {
        const n = NAV[+e.key - 1]; if (n) setView(n.id);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cmd]);

  function renderView() {
    switch (view) {
      case 'dashboard': return <Dashboard density={t.dashboardDensity} onOpen={onOpen} onNav={setView} onNew={onNew} />;
      case 'editor': return <DocumentEditor docId={openId} onOpen={onOpen} onNew={onNew} onNav={setView} />;
      case 'graph': return <KnowledgeGraph layout={t.graphLayout} onOpen={onOpen} />;
      case 'search': return <SearchCenter onOpen={onOpen} />;
      case 'ai': return <AIWorkspace onOpen={onOpen} />;
      case 'workflow': return <WorkflowBuilder />;
      case 'plugins': return <PluginMarketplace />;
      default: return <EmptyView title="준비 중" sub="이 화면은 곧 제공됩니다." icon="settings" />;
    }
  }
  const scrolls = view === 'dashboard' || view === 'plugins' || view === 'search';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar view={view} onNav={onNav} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onNew={onNew} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar view={view} onCmd={() => setCmd(true)} theme={t.theme} onTheme={(m) => setTweak('theme', m)} onSettings={() => setSettings((s) => !s)} />
        <main style={{ flex: 1, minHeight: 0, overflow: scrolls ? 'auto' : 'hidden', background: 'var(--bg-primary)' }}>
          {renderView()}
        </main>
      </div>

      <CommandPalette open={cmd} onClose={() => setCmd(false)} onNav={setView} onOpen={onOpen} onNew={onNew} />

      <TweaksPanel open={settings} onClose={() => setSettings(false)}>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={['dark', 'light']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent} options={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Dashboard" />
        <TweakRadio label="Density" value={t.dashboardDensity} options={['dense', 'spacious']} onChange={(v) => { setTweak('dashboardDensity', v); setView('dashboard'); }} />
        <TweakSection label="Knowledge Graph" />
        <TweakRadio label="Layout" value={t.graphLayout} options={['force', 'cluster', 'radial']} onChange={(v) => { setTweak('graphLayout', v); setView('graph'); }} />
        <TweakSection label="AI · Gemini" />
        <GeminiKeyField />
      </TweaksPanel>
    </div>
  );
}
