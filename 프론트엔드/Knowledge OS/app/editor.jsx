// ============================================================
// Knowledge OS — Document Editor view
// Block editor + AI inline variations (ghost / panel / popover)
// props: { aiMode: 'ghost'|'panel'|'popover', onOpen }
// ============================================================
const { useState, useRef } = React;
function EditorBlock({ b }) {
  const common = { lineHeight:1.7, color:'var(--text-primary)' };
  if(b.t==='h1') return <h1 style={{ fontSize:'30px', fontWeight:600, letterSpacing:'-0.02em', margin:'4px 0 8px' }}>{b.c}</h1>;
  if(b.t==='h2') return <h2 style={{ fontSize:'20px', fontWeight:600, margin:'22px 0 6px' }}>{b.c}</h2>;
  if(b.t==='quote') return <blockquote style={{ margin:'12px 0', padding:'4px 0 4px 16px', borderLeft:'2px solid var(--accent)', color:'var(--text-secondary)', fontSize:'var(--text-md)' }}>{b.c}</blockquote>;
  if(b.t==='code') return (
    <pre style={{ margin:'12px 0', padding:'14px 16px', background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', fontFamily:'var(--font-mono)', fontSize:'var(--text-base)', color:'var(--text-secondary)', overflow:'auto', lineHeight:1.65 }}
      dangerouslySetInnerHTML={{ __html: b.c }} />
  );
  if(b.t==='callout') return (
    <div style={{ display:'flex', gap:10, margin:'12px 0', padding:'12px 14px', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius-lg)' }}>
      <Icon name="sparkles" size={15} style={{ color:'var(--accent)', flex:'none', marginTop:2 }} />
      <div style={{ fontSize:'var(--text-md)', color:'var(--text-secondary)', lineHeight:1.6 }}>{b.c}</div>
    </div>
  );
  if(b.t==='li') return <div style={{ display:'flex', gap:10, margin:'4px 0', ...common, fontSize:'var(--text-md)' }}><span style={{ color:'var(--text-tertiary)' }}>•</span><span dangerouslySetInnerHTML={{__html:b.c}} /></div>;
  return <p style={{ margin:'10px 0', fontSize:'var(--text-md)', ...common }} dangerouslySetInnerHTML={{__html:b.c}} />;
}

const DOC_BLOCKS = [
  { t:'h1', c:'Attention Is All You Need' },
  { t:'p', c:'Transformer는 순환과 합성곱을 완전히 제거하고 <b>오직 어텐션</b>만으로 시퀀스를 모델링한다. 이는 병렬화를 가능케 하여 학습 속도를 크게 높인다.' },
  { t:'h2', c:'Self-Attention' },
  { t:'p', c:'각 토큰은 Query·Key·Value로 투영되며, 어텐션 가중치는 다음과 같이 계산된다:' },
  { t:'code', c:'<span style="color:var(--accent)">Attention</span>(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub>) V' },
  { t:'callout', c:'AI 요약: 셀프 어텐션은 시퀀스 내 모든 위치 쌍의 관계를 직접 계산해 장거리 의존성을 효과적으로 포착합니다.' },
  { t:'h2', c:'Multi-Head Attention' },
  { t:'li', c:'서로 다른 표현 부분공간을 병렬로 학습' },
  { t:'li', c:'각 헤드는 독립적인 Q/K/V 투영을 가짐' },
  { t:'li', c:'관련 개념: <span style="color:var(--accent)">[[Multi-Head]]</span> · <span style="color:var(--accent)">[[Positional Encoding]]</span>' },
];

function DocumentEditor({ aiMode='ghost', onOpen }) {
  const [showSlash, setShowSlash] = useState(false);
  const [popover, setPopover] = useState(false);

  return (
    <div style={{ display:'flex', height:'100%', minHeight:0 }}>
      {/* Editor column */}
      <div style={{ flex:1, overflow:'auto', position:'relative' }}>
        {/* breadcrumb */}
        <div style={{ height:42, display:'flex', alignItems:'center', gap:8, padding:'0 32px', borderBottom:'1px solid var(--border-subtle)', fontSize:'var(--text-sm)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', position:'sticky', top:0, background:'var(--bg-primary)', zIndex:4 }}>
          <Icon name="folder" size={13} />Research<Icon name="chevR" size={12} />Transformers<Icon name="chevR" size={12} />
          <span style={{ color:'var(--text-secondary)' }}>Attention Is All You Need</span>
          <div style={{ flex:1 }}></div>
          <span className="badge badge-success" style={{ height:18 }}><Icon name="check" size={10} />Saved</span>
        </div>

        <div style={{ maxWidth:720, margin:'0 auto', padding:'36px 32px 120px' }}>
          {/* doc meta */}
          <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
            <span className="tag">transformer</span><span className="tag">attention</span><span className="tag">seq2seq</span>
            <span className="badge badge-accent" style={{ height:22 }}><span className="dot"></span>AI Tagged</span>
          </div>

          {DOC_BLOCKS.map((b,i)=><EditorBlock key={i} b={b} />)}

          {/* Ghost text variant */}
          {aiMode==='ghost' && (
            <p style={{ margin:'10px 0', fontSize:'var(--text-md)', lineHeight:1.7 }}>
              <span style={{ color:'var(--text-primary)' }}>위치 정보는 사인·코사인 함수 기반의 </span>
              <span style={{ color:'var(--text-disabled)', borderBottom:'1px dashed var(--border-strong)' }}>positional encoding으로 주입되며, 학습 가능한 임베딩과 거의 동등한 성능을 보인다…</span>
              <span className="kbd" style={{ marginLeft:8, verticalAlign:'middle' }}>Tab</span>
              <span style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', marginLeft:6 }}>AI 제안 수락</span>
            </p>
          )}

          {/* Slash hint line */}
          <div style={{ position:'relative', margin:'14px 0' }}>
            <div onClick={()=>{ setShowSlash(s=>!s); setPopover(false); }}
              style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-tertiary)', fontSize:'var(--text-md)', cursor:'text' }}>
              <span style={{ width:1.5, height:20, background:'var(--accent)', animation:'blink 1.1s steps(2) infinite' }}></span>
              <span style={{ color:'var(--text-disabled)' }}>입력하거나 <span className="kbd">/</span> 로 블록 삽입, <span className="kbd">Space</span> 로 AI 호출…</span>
            </div>

            {/* Slash command menu */}
            {showSlash && (
              <div style={{ position:'absolute', top:30, left:0, width:300, background:'var(--surface-primary)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:6, zIndex:6 }}>
                <div className="cmdk-group" style={{ padding:'6px 8px 4px', fontSize:10, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', color:'var(--text-tertiary)' }}>Blocks</div>
                {[['ai','Ask AI','sparkles',true],['doc','Heading','hash',false],['code','Code Block','code',false],['database','Table','grid',false],['layers','Mermaid','branch',false]].map(([k,l,ic,ai],i)=>(
                  <div key={k} className="list-row" style={{ padding:'7px 8px', background:i===0?'var(--accent-bg)':'transparent' }}>
                    <Icon name={ic} size={15} style={{ color: ai?'var(--accent)':'var(--text-tertiary)' }} />
                    <span style={{ flex:1, fontSize:'var(--text-base)', color: ai?'var(--text-primary)':'var(--text-secondary)' }}>{l}</span>
                    {ai && <span className="kbd">Space</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popover variant trigger */}
          {aiMode==='popover' && (
            <div style={{ position:'relative', marginTop:10 }}>
              <span style={{ background:'var(--accent-bg)', padding:'2px 4px', borderRadius:4, fontSize:'var(--text-md)', cursor:'pointer' }}
                onClick={()=>setPopover(p=>!p)}>"scaled dot-product attention"</span>
              <span style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', marginLeft:8 }}>← 선택 후 AI 액션</span>
              {popover && (
                <div style={{ position:'absolute', top:30, left:0, width:260, background:'var(--surface-elevated)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-pop)', padding:6, zIndex:6 }}>
                  {[['sparkles','설명 추가'],['doc','요약'],['link','관련 문서 연결'],['code','예제 코드 생성']].map(([ic,l])=>(
                    <div key={l} className="list-row" style={{ padding:'7px 8px' }}>
                      <Icon name={ic} size={14} style={{ color:'var(--accent)' }} />
                      <span style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: backlinks OR AI panel depending on mode */}
      <div style={{ width:300, flex:'none', borderLeft:'1px solid var(--border-subtle)', background:'var(--bg-secondary)', display:'flex', flexDirection:'column', overflow:'auto' }}>
        {aiMode==='panel' ? (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div className="kos-panel-head" style={{ borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--accent)',boxShadow:'0 0 8px var(--accent)' }}></span>
                <span style={{ fontSize:'var(--text-md)', fontWeight:600 }}>AI Assistant</span>
              </div>
              <span className="badge" style={{ height:18 }}>Gemini Flash</span>
            </div>
            <div style={{ flex:1, padding:'14px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)', lineHeight:1.6 }}>
                이 문서는 <span className="ai-cite">[[Self-Attention]]</span> 과 밀접합니다. 멀티헤드 어텐션 섹션에 수식 유도를 추가할까요?
              </div>
              <div className="card" style={{ padding:'10px 12px', cursor:'pointer' }}>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--text-primary)', marginBottom:3 }}>제안 — 수식 블록 추가</div>
                <div style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)' }}>MultiHead(Q,K,V) = Concat(head₁…headₕ)Wᴼ</div>
              </div>
            </div>
            <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border-subtle)' }}>
              <div className="input-group">
                <Icon name="sparkles" size={14} className="input-icon" style={{ color:'var(--accent)' }} />
                <input className="input" placeholder="이 문서에 대해 질문…" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="kos-panel-head"><span style={{ fontSize:'var(--text-md)', fontWeight:600 }}>Backlinks</span><span className="badge" style={{height:18}}>14</span></div>
            <div style={{ padding:'4px 8px' }}>
              {DOCS.filter(d=>d.tags.includes('transformer')||d.tags.includes('attention')).slice(0,5).map(d=>(
                <div key={d.id} className="list-row" style={{ alignItems:'flex-start', padding:'8px' }} onClick={()=>onOpen&&onOpen(d)}>
                  <Icon name="doc" size={14} style={{ color:'var(--text-tertiary)', flex:'none', marginTop:2 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:'var(--text-base)', color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.title}</div>
                    <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:2, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{d.excerpt}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="kos-panel-head" style={{ borderTop:'1px solid var(--border-subtle)' }}><span style={{ fontSize:'var(--text-md)', fontWeight:600 }}>Outline</span></div>
            <div style={{ padding:'4px 8px 16px' }}>
              {['Self-Attention','Multi-Head Attention'].map((h,i)=>(
                <div key={i} className="list-row" style={{ padding:'6px 8px' }}><span style={{ color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)' }}>H2</span><span style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)' }}>{h}</span></div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.DocumentEditor = DocumentEditor;
