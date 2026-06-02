import { Icon } from '../icons.jsx';

// Phase 3 (AI / RAG) preview. The conversation is illustrative — wiring a real
// Gemini + vector backend is a later phase of the design.
export default function AIWorkspace() {
  const msgs = [
    { role: 'user', text: '지난달에 작성한 벡터 DB 관련 내용 정리해줘' },
    { role: 'ai', text: '지난 30일간 벡터 DB 관련 문서 3건을 찾았습니다. 핵심 내용을 정리하면:', sources: ['Vector DB 비교', 'Embedding 가이드', 'RAG 파이프라인'] },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '10px 14px', background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '14px 14px 4px 14px', fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>{m.text}</div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 0 12px var(--accent-glow)' }}><Icon name="sparkles" size={15} style={{ color: '#fff' }} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{m.text}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {m.sources.map((s) => (
                      <div key={s} className="card card-hover" style={{ padding: '11px 12px', cursor: 'pointer' }}>
                        <Icon name="doc" size={14} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 450, lineHeight: 1.4 }}>{s}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>retrieved · RAG</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                    <button className="btn btn-sm"><Icon name="doc" size={12} />문서로 저장</button>
                    <button className="btn btn-sm btn-ghost"><Icon name="link" size={12} />그래프에 연결</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="sparkles" size={15} style={{ color: '#fff' }} /></span>
              <div className="ai-loading" style={{ fontSize: 'var(--text-md)', alignSelf: 'center' }}>관련 문서를 종합하는 중…</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
            <textarea className="input" placeholder="전체 지식 베이스에 질문하세요 — RAG 기반 응답 (Phase 3)" style={{ minHeight: 54, paddingRight: 80 }}></textarea>
            <button className="btn btn-primary btn-sm" style={{ position: 'absolute', right: 8, bottom: 8 }}><Icon name="arrowUp" size={13} />Ask</button>
          </div>
        </div>
      </div>
      <div style={{ width: 260, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '16px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="section-label">Context · RAG</span>
          <span className="badge badge-accent" style={{ height: 16, marginLeft: 'auto' }}>Phase 3</span>
        </div>
        <div className="card" style={{ padding: '12px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name="database" size={14} style={{ color: 'var(--info)' }} /><span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Qdrant Index</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.7 }}>248 docs · 14,820 chunks<br />dim 1536 · HNSW</div>
        </div>
        <div className="section-label" style={{ margin: '16px 0 10px' }}>Recent threads</div>
        {['벡터 DB 정리', 'Transformer 핵심', 'RAG 청크 전략'].map((t) => (
          <div key={t} className="list-row" style={{ padding: '7px 8px' }}><Icon name="clock" size={13} style={{ color: 'var(--text-tertiary)' }} /><span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span></div>
        ))}
      </div>
    </div>
  );
}
