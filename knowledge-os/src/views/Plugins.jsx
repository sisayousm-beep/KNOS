// ============================================================
// Knowledge OS — Plugin Marketplace (Phase 6)
// Real store over the built-in plugin catalog: install / enable /
// disable, inspect declared permissions, run a sandbox check, and
// watch the live hook activity log that loaded plugins produce.
// ============================================================
import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { usePlugins } from '../plugins.jsx';
import { PERMISSIONS } from '../plugins.js';
import { relativeTime } from '../util.js';

const LEVEL = {
  info: { color: 'var(--text-tertiary)', icon: 'check' },
  blocked: { color: '#e5a23d', icon: 'x' },
  error: { color: '#e5484d', icon: 'x' },
};

function PermBadges({ perms }) {
  if (!perms.length) {
    return <span className="tag" style={{ opacity: 0.7 }}>권한 없음</span>;
  }
  return perms.map((p) => (
    <span key={p} className="tag" style={{ color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
      {PERMISSIONS[p] || p}
    </span>
  ));
}

function PluginCard({ p, onInstall, onUninstall, onToggle, onProbe }) {
  return (
    <div className="card card-hover" style={{ padding: '16px', borderColor: p.featured ? 'var(--accent-border)' : 'var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flex: 'none' }}>
          <Icon name={p.icon} size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{p.name}</span>
            {p.featured && <span className="badge badge-accent" style={{ height: 18 }}>Featured</span>}
            {p.installed && p.enabled && <span className="badge badge-accent" style={{ height: 18 }}><span className="dot"></span>활성</span>}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            v{p.version} · {p.author}
          </div>
        </div>
      </div>
      <p style={{ margin: '12px 0 10px', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.desc}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <PermBadges perms={p.permissions} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {p.installed ? (
          <>
            <button className={'btn btn-sm' + (p.enabled ? ' btn-primary' : '')} style={{ flex: 1 }} onClick={() => onToggle(p.id)}>
              <Icon name={p.enabled ? 'pause' : 'play'} size={12} />{p.enabled ? '중지' : '사용'}
            </button>
            <button className="btn btn-icon btn-sm btn-ghost" title="샌드박스 권한 점검" onClick={() => onProbe(p.id)}><Icon name="eye" size={13} /></button>
            <button className="btn btn-icon btn-sm btn-ghost" title="제거" onClick={() => onUninstall(p.id)}><Icon name="trash" size={13} /></button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onInstall(p.id)}><Icon name="plus" size={12} />설치</button>
        )}
      </div>
    </div>
  );
}

export default function PluginMarketplace() {
  const { catalog, activity, install, uninstall, toggle, probe, clearLog, activeCount } = usePlugins();
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = catalog.filter((p) => !ql || p.name.toLowerCase().includes(ql) || p.desc.toLowerCase().includes(ql));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em' }}>Plugin Marketplace</h1>
          <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>
            모든 기능을 플러그인으로 확장 · SDK · Hooks · Sandbox · <b style={{ color: 'var(--text-primary)' }}>{activeCount}</b>개 활성
          </p>
        </div>
        <span className="badge badge-accent" style={{ height: 22 }}>Phase 6</span>
      </div>

      <div className="input-group" style={{ maxWidth: 380, marginBottom: 24 }}>
        <Icon name="search" size={14} className="input-icon" />
        <input className="input" placeholder="플러그인 검색…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {shown.map((p) => (
          <PluginCard key={p.id} p={p} onInstall={install} onUninstall={uninstall} onToggle={toggle} onProbe={probe} />
        ))}
      </div>

      {/* Live hook activity — proves hooks fire and the sandbox blocks. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
        <Icon name="bolt" size={15} style={{ color: 'var(--accent)' }} />
        <span className="section-label" style={{ margin: 0 }}>Hook Activity</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{activity.length}</span>
        <div style={{ flex: 1 }}></div>
        {activity.length > 0 && <button className="btn btn-sm btn-ghost" onClick={clearLog}><Icon name="trash" size={12} />지우기</button>}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {activity.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            아직 이벤트 없음. 문서를 만들거나 수정하고, 검색하거나 AI에 질문하면 활성 플러그인의 훅이 여기에 기록됩니다.
          </div>
        ) : activity.map((a) => {
          const lv = LEVEL[a.level] || LEVEL.info;
          return (
            <div key={a.id} className="list-row" style={{ alignItems: 'flex-start', padding: '9px 14px', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)', cursor: 'default' }}>
              <Icon name={lv.icon} size={13} style={{ color: lv.color, flex: 'none', marginTop: 3 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.plugin}</span>
                  {a.level === 'blocked' && <span className="badge badge-warning" style={{ height: 16, padding: '0 6px' }}>차단</span>}
                  {a.level === 'error' && <span className="badge badge-warning" style={{ height: 16, padding: '0 6px', color: '#e5484d' }}>오류</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.5, wordBreak: 'break-word' }}>{a.detail}</div>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flex: 'none' }}>{relativeTime(new Date(a.at).toISOString())}</span>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Icon name="plugin" size={16} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          모든 플러그인은 <b style={{ color: 'var(--text-secondary)' }}>샌드박스</b>에서 실행되며 선언한 권한만 사용할 수 있습니다. 선언하지 않은 호출은 차단되어 위 로그에 <b style={{ color: '#e5a23d' }}>차단</b>으로 남습니다.
        </div>
      </div>
    </div>
  );
}
