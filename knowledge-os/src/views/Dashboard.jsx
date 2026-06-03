// Knowledge OS — Dashboard view (live data: store + workflows + plugins)
import { Icon } from '../icons.jsx';
import { useDocs } from '../store.jsx';
import { useWorkflows } from '../workflow.jsx';
import { usePlugins } from '../plugins.jsx';
import { relativeTime } from '../util.js';

const LEVEL_COLOR = { info: 'var(--text-tertiary)', blocked: '#e5a23d', error: '#e5484d' };

function StatCard({ s, dense }) {
  return (
    <div className="card card-hover" style={{ padding: dense ? '12px 14px' : '18px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="section-label">{s.label}</span>
        <Icon name={s.icon} size={dense ? 13 : 15} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: dense ? 6 : 12 }}>
        <span style={{ fontSize: dense ? '22px' : '30px', fontWeight: 600, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
      </div>
    </div>
  );
}

// One line of the real plugin hook-activity log.
function ActivityItem({ a, dense }) {
  const color = LEVEL_COLOR[a.level] || 'var(--text-tertiary)';
  return (
    <div className="list-row" style={{ alignItems: 'flex-start', padding: dense ? '7px 8px' : '11px 10px' }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', flex: 'none', background: 'var(--surface-secondary)', color, marginTop: 1 }}>
        <Icon name={a.level === 'info' ? 'plugin' : 'bolt'} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <b style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{a.plugin}</b> {a.detail}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{relativeTime(new Date(a.at).toISOString())}</div>
      </div>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div style={{ padding: '16px 12px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{text}</div>;
}

function DocRow({ d, dense, onOpen }) {
  return (
    <div className="list-row" onClick={() => onOpen && onOpen(d)} style={{ padding: dense ? '7px 10px' : '10px 12px' }}>
      <Icon name="doc" size={15} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 450, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</span>
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

// One real workflow run record.
function WorkflowStatus({ w }) {
  const dot = w.ok ? 'var(--success)' : '#e5484d';
  return (
    <div className="list-row" style={{ padding: '9px 10px' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none' }}></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 450, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.workflowName}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{w.trigger} · {w.steps.length} actions</div>
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flex: 'none' }}>{relativeTime(w.at)}</span>
    </div>
  );
}

export default function Dashboard({ density = 'spacious', onOpen, onNav, onNew }) {
  const { docs } = useDocs();
  const { runs } = useWorkflows();
  const { activity } = usePlugins();
  const dense = density === 'dense';
  const gap = dense ? 12 : 20;
  const recents = docs.slice(0, dense ? 8 : 6);

  // Everything below is derived live from the real document set.
  const tagCounts = {};
  docs.forEach((d) => d.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const totalLinks = docs.reduce((n, d) => n + d.outgoing.length, 0);
  const totalWords = docs.reduce((n, d) => n + d.words, 0);
  const stats = [
    { label: '문서', value: String(docs.length), icon: 'doc' },
    { label: '링크', value: String(totalLinks), icon: 'link' },
    { label: '태그', value: String(Object.keys(tagCounts).length), icon: 'hash' },
    { label: '단어', value: totalWords.toLocaleString(), icon: 'sparkles' },
  ];

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
            {recents.length ? recents.map((d) => <DocRow key={d.id} d={d} dense={dense} onOpen={onOpen} />)
              : <EmptyRow text="아직 문서가 없습니다. New Document 로 시작하세요." />}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="kos-panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></span>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>플러그인 활동</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav && onNav('plugins')}>관리<Icon name="chevR" size={12} /></button>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {activity.length ? activity.slice(0, dense ? 5 : 4).map((a) => <ActivityItem key={a.id} a={a} dense={dense} />)
                : <EmptyRow text="훅 이벤트가 여기에 표시됩니다. 문서를 만들거나 검색해 보세요." />}
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
              {runs.length ? runs.slice(0, 4).map((w) => <WorkflowStatus key={w.id} w={w} />)
                : <EmptyRow text="실행 기록이 없습니다. Workflow Builder 에서 '지금 실행'으로 시작하세요." />}
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
