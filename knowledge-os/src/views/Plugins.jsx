import { Icon } from '../icons.jsx';

const PLUGINS = [
  { name: 'Git Sync', desc: '문서를 자동으로 Git 저장소에 커밋', icon: 'code', installed: true, verified: true, dl: '12.4k' },
  { name: 'Calendar', desc: '문서에 일정과 리마인더 연결', icon: 'calendar', installed: false, verified: true, dl: '8.1k' },
  { name: 'PDF Import', desc: 'PDF를 구조화된 문서로 변환', icon: 'doc', installed: true, verified: true, dl: '24.7k' },
  { name: 'YouTube Summary', desc: '영상 URL을 요약 노트로', icon: 'play', installed: false, verified: false, dl: '5.3k' },
  { name: 'Research Assistant', desc: '논문을 자동 분석하고 인용 추출', icon: 'sparkles', installed: false, verified: true, dl: '18.9k', featured: true },
  { name: 'Webhook Hub', desc: '외부 서비스로 이벤트 전송', icon: 'webhook', installed: false, verified: true, dl: '3.7k' },
];

export default function PluginMarketplace() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em' }}>Plugin Marketplace</h1>
          <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>모든 기능을 플러그인으로 확장하세요 · SDK · Hooks · Sandbox</p>
        </div>
        <button className="btn"><Icon name="code" size={14} />Developer SDK</button>
      </div>
      <div className="input-group" style={{ maxWidth: 380, marginBottom: 24 }}>
        <Icon name="search" size={14} className="input-icon" /><input className="input" placeholder="플러그인 검색…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {PLUGINS.map((p) => (
          <div key={p.name} className="card card-hover" style={{ padding: '16px', borderColor: p.featured ? 'var(--accent-border)' : 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flex: 'none' }}>
                <Icon name={p.icon} size={19} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{p.name}</span>
                  {p.verified && <span className="tt"><Icon name="check" size={13} style={{ color: 'var(--success)' }} /><span className="tt-body">Verified publisher</span></span>}
                  {p.featured && <span className="badge badge-accent" style={{ height: 18 }}>Featured</span>}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}><Icon name="arrowUp" size={10} style={{ verticalAlign: '-1px' }} />{p.dl} installs</div>
              </div>
            </div>
            <p style={{ margin: '12px 0 14px', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {p.installed
                ? <button className="btn btn-sm" style={{ flex: 1 }}><Icon name="settings" size={12} />설정</button>
                : <button className="btn btn-primary btn-sm" style={{ flex: 1 }}><Icon name="plus" size={12} />설치</button>}
              <button className="btn btn-icon btn-sm btn-ghost"><Icon name="eye" size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Icon name="plugin" size={16} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          모든 플러그인은 <b style={{ color: 'var(--text-secondary)' }}>샌드박스</b>에서 실행되며 설치 시 권한을 명시적으로 요청합니다. <b style={{ color: 'var(--text-secondary)' }}>Phase 6</b> 플러그인 SDK에서 활성화됩니다.
        </div>
      </div>
    </div>
  );
}
