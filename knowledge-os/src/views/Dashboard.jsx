// Knowledge OS — Dashboard view
import { Icon } from '../icons.jsx';
import { ACTIVITY, WORKFLOW_RUNS, STATS } from '../data.js';
import { useDocs } from '../store.jsx';

function StatCard({ s, dense }) {
  return (
    <div className="card card-hover" style={{ padding: dense ? '12px 14px' : '18px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="section-label">{s.label}</span>
        <Icon name={s.icon} size={dense ? 13 : 15} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: dense ? 6 : 12 }}>
        <span style={{ fontSize: dense ? '22px' : '30px', fontWeight: 600, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
        {s.delta && <span className="badge badge-success" style={{ height: 18 }}><Icon name="arrowUp" size={10} />{s.delta}</span>}
      </div>
    </div>
  );
}

function ActivityItem({ a, dense }) {
  const color = a.type === 'ai' ? 'var(--accent)' : a.type === 'link' ? 'var(--info)' : 'var(--text-tertiary)';
  return (
    <div className="list-row" style={{ alignItems: 'flex-start', padding: dense ? '7px 8px' : '11px 10px' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', flex: 'none', background: a.type === 'ai' ? 'var(--accent-bg)' : 'var(--surface-secondary)', color, marginTop: 1 }}>
        <Icon name={a.icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: a.text.replace(/<b>/g, '<b style="color:var(--text-primary);font-weight:550">') }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          <span>{a.meta}</span><span>·</span><span>{a.time}</span>
        </div>
      </div>
    </div>
  );
}

function DocRow({ d, dense, onOpen }) {
  return (
    <div className="list-row" onClick={() => onOpen && onOpen(d)} style={{ padding: dense ? '7px 10px' : '10px 12px' }}>
      <Icon name="doc" size={15} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 450, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</span>
          {d.ai && <span className="badge badge-accent" style={{ height: 16, padding: '0 6px', flex: 'none' }}><span className="dot"></span>AI</span>}
          {d.draft && <span className="badge badge-warning" style={{ height: 16, padding: '0 6px', flex: 'none' }}>Draft</span>}
        </div>
        {!dense && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.excerpt}</div>}
      </div>
      <span className="tag" style={{ flex: 'none' }}>{d.tag}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', width: 34, textAlign: 'right', flex: 'none' }}>
        <Icon name="link" size={11} style={{ verticalAlign: '-1px', marginRight: 2 }} />{d.links}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', width: 54, textAlign: 'right', flex: 'none' }}>{d.updated}</span>
    </div>
  );
}

function WorkflowStatus({ w }) {
  const dot = w.status === 'success' ? 'var(--success)' : w.status === 'running' ? 'var(--accent)' : 'var(--text-tertiary)';
  return (
    <div className="list-row" style={{ padding: '9px 10px' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none', boxShadow: w.status === 'running' ? '0 0 8px var(--accent)' : 'none' }}></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 450, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{w.trigger} · {w.actions} actions</div>
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flex: 'none' }}>{w.last}</span>
    </div>
  );
}

export default function Dashboard({ density = 'spacious', onOpen, onNav, onNew }) {
  const { docs } = useDocs();
  const dense = density === 'dense';
  const gap = dense ? 12 : 20;
  const recents = docs.slice(0, dense ? 8 : 6);

  // Live tag counts derived from real documents.
  const tagCounts = {};
  docs.forEach((d) => d.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const stats = STATS.map((s) => {
    if (s.key === 'documents') return { ...s, value: String(docs.length), delta: null };
    if (s.key === 'tags') return { ...s, value: String(Object.keys(tagCounts).length), delta: null };
    return s;
  });

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div style={{ padding: dense ? '20px 24px' : '32px 40px', maxWidth: dense ? 1480 : 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 16 : 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{today}</div>
          <h1 style={{ margin: 0, fontSize: dense ? '21px' : '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            좋은 아침입니다 — 오늘의 지식을 정리해 볼까요?
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => onNav && onNav('graph')}><Icon name="graph" size={14} />그래프 열기</button>
          <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={14} />New Document</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap, marginBottom: gap }}>
        {stats.map((s) => <StatCard key={s.label} s={s} dense={dense} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: dense ? '1.6fr 1fr' : '1.7fr 1fr', gap }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="kos-panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={14} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, whiteSpace: 'nowrap' }}>최근 문서</span>
              <span className="badge" style={{ height: 18 }}>{docs.length}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav && onNav('search')}>전체 보기<Icon name="chevR" size={12} /></button>
          </div>
          <div style={{ padding: '4px 6px' }}>
            {recents.map((d) => <DocRow key={d.id} d={d} dense={dense} onOpen={onOpen} />)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="kos-panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></span>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>AI Activity</span>
              </div>
              <span className="badge badge-accent" style={{ height: 18 }}>Live</span>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {ACTIVITY.slice(0, dense ? 5 : 4).map((a, i) => <ActivityItem key={i} a={a} dense={dense} />)}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="kos-panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="workflow" size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Workflows</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav && onNav('workflow')}>관리<Icon name="chevR" size={12} /></button>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {WORKFLOW_RUNS.map((w, i) => <WorkflowStatus key={i} w={w} />)}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: gap, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="section-label" style={{ marginRight: 4 }}>자주 쓰는 태그</span>
          {topTags.map(([name, count]) => (
            <span key={name} className="tag" style={{ cursor: 'pointer' }} onClick={() => onNav && onNav('search')}>
              {name}<span style={{ color: 'var(--text-tertiary)', marginLeft: 2 }}>{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
