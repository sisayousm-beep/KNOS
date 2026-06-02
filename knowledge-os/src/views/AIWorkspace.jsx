// ============================================================
// Knowledge OS — AI Workspace (Phase 3: 질문응답)
// Asks the local knowledge base: retrieves relevant docs, then answers
// with Gemini Flash if a key is set, else a local keyword summary.
// (Full embedding/vector RAG is Phase 4.)
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { Icon } from '../icons.jsx';
import { useDocs } from '../store.jsx';
import * as ai from '../ai.js';

const EXAMPLES = [
  '벡터 DB 관련 내용 정리해줘',
  'Transformer 핵심만 요약해줘',
  'RAG 청크 전략은?',
];

export default function AIWorkspace({ onOpen }) {
  const { docs } = useDocs();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const keyed = ai.hasKey();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, busy]);

  async function send(q) {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const { answer, sources, source } = await ai.ask(question, docs);
      setMsgs((m) => [...m, { role: 'ai', text: answer, sources, source }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'ai', text: `오류: ${e.message}`, sources: [], source: 'error' }]);
    } finally {
      setBusy(false);
    }
  }

  const threads = msgs.filter((m) => m.role === 'user').map((m) => m.text).slice(-5).reverse();

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: '0 0 18px var(--accent-glow)' }}><Icon name="sparkles" size={22} style={{ color: '#fff' }} /></span>
                <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: 6 }}>지식 베이스에 질문하세요</div>
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 20 }}>{docs.length}개 문서에서 답을 찾습니다 · {keyed ? 'Gemini Flash' : '로컬 모드'}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {EXAMPLES.map((e) => (
                    <button key={e} className="btn btn-sm" onClick={() => send(e)}>{e}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '10px 14px', background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '14px 14px 4px 14px', fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>{m.text}</div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 0 12px var(--accent-glow)' }}><Icon name="sparkles" size={15} style={{ color: '#fff' }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: m.sources?.length ? 12 : 0, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  {m.sources?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      {m.sources.map((s) => (
                        <div key={s.id} className="card card-hover" style={{ padding: '11px 12px', cursor: 'pointer' }} onClick={() => onOpen?.(s)}>
                          <Icon name="doc" size={14} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 450, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>retrieved · {m.source === 'gemini' ? 'Gemini' : 'local'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="sparkles" size={15} style={{ color: '#fff' }} /></span>
                <div className="ai-loading" style={{ fontSize: 'var(--text-md)', alignSelf: 'center' }}>관련 문서를 종합하는 중…</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
            <textarea className="input" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="전체 지식 베이스에 질문하세요 — Enter로 전송" style={{ minHeight: 54, paddingRight: 80 }}></textarea>
            <button className="btn btn-primary btn-sm" disabled={busy || !input.trim()} onClick={() => send()} style={{ position: 'absolute', right: 8, bottom: 8 }}><Icon name="arrowUp" size={13} />Ask</button>
          </div>
        </div>
      </div>
      <div style={{ width: 260, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '16px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="section-label">Context</span>
          <span className="badge badge-accent" style={{ height: 16, marginLeft: 'auto' }}>Phase 3</span>
        </div>
        <div className="card" style={{ padding: '12px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name="sparkles" size={14} style={{ color: keyed ? 'var(--success)' : 'var(--text-tertiary)' }} /><span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{keyed ? 'Gemini Flash' : '로컬 모드'}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.7 }}>{docs.length} docs indexed<br />{keyed ? 'AI 종합 답변' : '키워드 검색 답변'}</div>
        </div>
        {!keyed && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: 12 }}>설정 → AI · Gemini 에서 API 키를 넣으면 AI 종합 답변이 켜집니다.</div>}
        {threads.length > 0 && <>
          <div className="section-label" style={{ margin: '16px 0 10px' }}>Recent threads</div>
          {threads.map((t, i) => (
            <div key={i} className="list-row" style={{ padding: '7px 8px', cursor: 'pointer' }} onClick={() => send(t)}><Icon name="clock" size={13} style={{ color: 'var(--text-tertiary)' }} /><span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span></div>
          ))}
        </>}
      </div>
    </div>
  );
}
