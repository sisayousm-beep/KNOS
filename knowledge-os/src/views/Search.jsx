// Knowledge OS — Search Center (Phase 1: real full-text filter over the store)
import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { useDocs } from '../store.jsx';

export default function SearchCenter({ onOpen }) {
  const { docs } = useDocs();
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const results = docs.filter((d) => {
    if (!ql) return true;
    return d.title.toLowerCase().includes(ql)
      || d.tags.some((t) => t.toLowerCase().includes(ql))
      || d.content.toLowerCase().includes(ql);
  });

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 32px' }}>
      <div className="input-group" style={{ marginBottom: 8 }}>
        <Icon name="search" size={16} className="input-icon" />
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          style={{ height: 46, fontSize: 'var(--text-lg)' }} placeholder="지식 검색 — 제목, 태그, 본문 전체에서 찾기" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', 'Documents', 'Tags', 'Code'].map((f, i) => (
          <button key={f} className={'btn btn-sm' + (i === 0 ? ' btn-primary' : '')}>{f}</button>
        ))}
        <div style={{ flex: 1 }}></div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
          시맨틱 검색 · Phase 3
        </span>
      </div>

      <div className="section-label" style={{ marginBottom: 10 }}>{results.length} documents</div>
      {results.length === 0 ? (
        <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          "<b style={{ color: 'var(--text-secondary)' }}>{q}</b>" 에 대한 문서가 없습니다.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {results.map((d) => (
            <div key={d.id} className="list-row" style={{ alignItems: 'flex-start', padding: '12px 14px', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)' }} onClick={() => onOpen && onOpen(d)}>
              <Icon name="doc" size={15} style={{ color: 'var(--text-tertiary)', flex: 'none', marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', fontWeight: 450 }}>{d.title}</span>
                  {d.ai && <span className="badge badge-accent" style={{ height: 16, padding: '0 6px' }}><span className="dot"></span>AI</span>}
                  {d.draft && <span className="badge badge-warning" style={{ height: 16, padding: '0 6px' }}>Draft</span>}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5 }}>{d.excerpt}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>{d.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flex: 'none' }}>{d.updated}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
