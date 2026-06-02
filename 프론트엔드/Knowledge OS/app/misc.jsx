// ============================================================
// Knowledge OS — Secondary views: Search, AI Workspace, Plugins
// ============================================================
const { useState } = React;

function SearchCenter({ onOpen }) {
  const [q, setQ] = useState('vector db');
  const results = DOCS.filter(d => !q || d.title.toLowerCase().includes(q.toLowerCase()) || d.tags.some(t=>t.includes(q.toLowerCase())) || d.excerpt.includes(q));
  return (
    <div style={{ maxWidth:880, margin:'0 auto', padding:'40px 32px' }}>
      <div className="input-group" style={{ marginBottom:8 }}>
        <Icon name="search" size={16} className="input-icon" />
        <input className="input" value={q} onChange={e=>setQ(e.target.value)} style={{ height:46, fontSize:'var(--text-lg)' }} placeholder="지식 검색 — 자연어로 질문하세요" />
        <span className="badge badge-accent input-kbd" style={{ height:22 }}><Icon name="sparkles" size={11} />Semantic</span>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['All','Documents','Tags','AI Answers','Code'].map((f,i)=>(
          <button key={f} className={'btn btn-sm'+(i===0?' btn-primary':'')}>{f}</button>
        ))}
        <div style={{ flex:1 }}></div>
        <button className="btn btn-sm btn-ghost"><Icon name="filter" size={13} />Filters</button>
      </div>

      {/* AI answer */}
      <div className="card" style={{ padding:'16px 18px', marginBottom:20, background:'var(--accent-bg)', borderColor:'var(--accent-border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <Icon name="sparkles" size={15} style={{ color:'var(--accent)' }} />
          <span style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--accent)' }}>AI ANSWER</span>
          <span className="badge" style={{ height:18, marginLeft:'auto' }}>3 sources</span>
        </div>
        <div style={{ fontSize:'var(--text-md)', color:'var(--text-secondary)', lineHeight:1.65 }}>
          벡터 DB 후보 중 <b style={{color:'var(--text-primary)'}}>Qdrant</b>는 Rust 기반으로 필터링과 프로덕션 안정성이 강점이고, <b style={{color:'var(--text-primary)'}}>Chroma</b>는 빠른 프로토타이핑에 적합합니다. RAG 파이프라인에서는 HNSW 인덱스 파라미터 튜닝이 검색 품질을 좌우합니다.
          <span className="ai-cite">[[Vector DB 비교]]</span><span className="ai-cite">[[RAG 파이프라인]]</span>
        </div>
      </div>

      <div className="section-label" style={{ marginBottom:10 }}>{results.length} documents</div>
      <div className="card" style={{ overflow:'hidden' }}>
        {results.map(d=>(
          <div key={d.id} className="list-row" style={{ alignItems:'flex-start', padding:'12px 14px', borderRadius:0, borderBottom:'1px solid var(--border-subtle)' }} onClick={()=>onOpen&&onOpen(d)}>
            <Icon name="doc" size={15} style={{ color:'var(--text-tertiary)', flex:'none', marginTop:2 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'var(--text-md)', color:'var(--text-primary)', fontWeight:450 }}>{d.title}</span>
                {d.ai && <span className="badge badge-accent" style={{ height:16, padding:'0 6px' }}><span className="dot"></span>AI</span>}
              </div>
              <div style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', marginTop:4, lineHeight:1.5 }}>{d.excerpt}</div>
              <div style={{ display:'flex', gap:6, marginTop:8 }}>{d.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
            </div>
            <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', flex:'none' }}>{d.updated}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIWorkspace() {
  const msgs = [
    { role:'user', text:'지난달에 작성한 벡터 DB 관련 내용 정리해줘' },
    { role:'ai', text:'지난 30일간 벡터 DB 관련 문서 3건을 찾았습니다. 핵심 내용을 정리하면:', sources:['Vector DB 비교','Embedding 가이드','RAG 파이프라인'] },
  ];
  return (
    <div style={{ display:'flex', height:'100%', minHeight:0 }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ flex:1, overflow:'auto', padding:'32px 0' }}>
          <div style={{ maxWidth:720, margin:'0 auto', padding:'0 32px', display:'flex', flexDirection:'column', gap:24 }}>
            {msgs.map((m,i)=> m.role==='user' ? (
              <div key={i} style={{ alignSelf:'flex-end', maxWidth:'80%', padding:'10px 14px', background:'var(--surface-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'14px 14px 4px 14px', fontSize:'var(--text-md)', color:'var(--text-primary)' }}>{m.text}</div>
            ) : (
              <div key={i} style={{ display:'flex', gap:12 }}>
                <span style={{ width:28, height:28, borderRadius:8, background:'var(--accent)', display:'grid', placeItems:'center', flex:'none', boxShadow:'0 0 12px var(--accent-glow)' }}><Icon name="sparkles" size={15} style={{color:'#fff'}} /></span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'var(--text-md)', color:'var(--text-secondary)', lineHeight:1.7, marginBottom:12 }}>{m.text}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                    {m.sources.map(s=>(
                      <div key={s} className="card card-hover" style={{ padding:'11px 12px', cursor:'pointer' }}>
                        <Icon name="doc" size={14} style={{ color:'var(--accent)', marginBottom:8 }} />
                        <div style={{ fontSize:'var(--text-sm)', color:'var(--text-primary)', fontWeight:450, lineHeight:1.4 }}>{s}</div>
                        <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginTop:4 }}>retrieved · RAG</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:14 }}>
                    <button className="btn btn-sm"><Icon name="doc" size={12} />문서로 저장</button>
                    <button className="btn btn-sm btn-ghost"><Icon name="link" size={12} />그래프에 연결</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ width:28, height:28, borderRadius:8, background:'var(--accent)', display:'grid', placeItems:'center', flex:'none' }}><Icon name="sparkles" size={15} style={{color:'#fff'}} /></span>
              <div className="ai-loading" style={{ fontSize:'var(--text-md)', alignSelf:'center' }}>관련 문서를 종합하는 중…</div>
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 32px 24px', borderTop:'1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth:720, margin:'0 auto', position:'relative' }}>
            <textarea className="input" placeholder="전체 지식 베이스에 질문하세요 — RAG 기반 응답" style={{ minHeight:54, paddingRight:80 }}></textarea>
            <button className="btn btn-primary btn-sm" style={{ position:'absolute', right:8, bottom:8 }}><Icon name="arrowUp" size={13} />Ask</button>
          </div>
        </div>
      </div>
      <div style={{ width:260, flex:'none', borderLeft:'1px solid var(--border-subtle)', background:'var(--bg-secondary)', padding:'16px', overflow:'auto' }}>
        <div className="section-label" style={{ marginBottom:12 }}>Context · RAG</div>
        <div className="card" style={{ padding:'12px', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><Icon name="database" size={14} style={{color:'var(--info)'}} /><span style={{ fontSize:'var(--text-sm)', fontWeight:600 }}>Qdrant Index</span></div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'var(--text-xs)', color:'var(--text-tertiary)', lineHeight:1.7 }}>248 docs · 14,820 chunks<br/>dim 1536 · HNSW</div>
        </div>
        <div className="section-label" style={{ margin:'16px 0 10px' }}>Recent threads</div>
        {['벡터 DB 정리','Transformer 핵심','RAG 청크 전략'].map(t=>(
          <div key={t} className="list-row" style={{ padding:'7px 8px' }}><Icon name="clock" size={13} style={{color:'var(--text-tertiary)'}} /><span style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t}</span></div>
        ))}
      </div>
    </div>
  );
}

const PLUGINS = [
  { name:'Git Sync', desc:'문서를 자동으로 Git 저장소에 커밋', icon:'code', installed:true, verified:true, dl:'12.4k' },
  { name:'Calendar', desc:'문서에 일정과 리마인더 연결', icon:'calendar', installed:false, verified:true, dl:'8.1k' },
  { name:'PDF Import', desc:'PDF를 구조화된 문서로 변환', icon:'doc', installed:true, verified:true, dl:'24.7k' },
  { name:'YouTube Summary', desc:'영상 URL을 요약 노트로', icon:'play', installed:false, verified:false, dl:'5.3k' },
  { name:'Research Assistant', desc:'논문을 자동 분석하고 인용 추출', icon:'sparkles', installed:false, verified:true, dl:'18.9k', featured:true },
  { name:'Webhook Hub', desc:'외부 서비스로 이벤트 전송', icon:'webhook', installed:false, verified:true, dl:'3.7k' },
];

function PluginMarketplace() {
  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 40px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:600, letterSpacing:'-0.02em' }}>Plugin Marketplace</h1>
          <p style={{ margin:0, fontSize:'var(--text-md)', color:'var(--text-secondary)' }}>모든 기능을 플러그인으로 확장하세요 · SDK · Hooks · Sandbox</p>
        </div>
        <button className="btn"><Icon name="code" size={14} />Developer SDK</button>
      </div>
      <div className="input-group" style={{ maxWidth:380, marginBottom:24 }}>
        <Icon name="search" size={14} className="input-icon" /><input className="input" placeholder="플러그인 검색…" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {PLUGINS.map(p=>(
          <div key={p.name} className="card card-hover" style={{ padding:'16px', borderColor: p.featured?'var(--accent-border)':'var(--border-subtle)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <span style={{ width:40, height:40, borderRadius:10, background:'var(--surface-secondary)', border:'1px solid var(--border-subtle)', display:'grid', placeItems:'center', color:'var(--accent)', flex:'none' }}>
                <Icon name={p.icon} size={19} />
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:'var(--text-md)', fontWeight:600 }}>{p.name}</span>
                  {p.verified && <span className="tt"><Icon name="check" size={13} style={{ color:'var(--success)' }} /><span className="tt-body">Verified publisher</span></span>}
                  {p.featured && <span className="badge badge-accent" style={{ height:18 }}>Featured</span>}
                </div>
                <div style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', marginTop:2 }}><Icon name="arrowUp" size={10} style={{verticalAlign:'-1px'}} />{p.dl} installs</div>
              </div>
            </div>
            <p style={{ margin:'12px 0 14px', fontSize:'var(--text-base)', color:'var(--text-secondary)', lineHeight:1.55 }}>{p.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {p.installed
                ? <button className="btn btn-sm" style={{ flex:1 }}><Icon name="settings" size={12} />설정</button>
                : <button className="btn btn-primary btn-sm" style={{ flex:1 }}><Icon name="plus" size={12} />설치</button>}
              <button className="btn btn-icon btn-sm btn-ghost"><Icon name="eye" size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* permission note */}
      <div className="card" style={{ marginTop:20, padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
        <Icon name="plugin" size={16} style={{ color:'var(--text-tertiary)', flex:'none' }} />
        <div style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', lineHeight:1.5 }}>
          모든 플러그인은 <b style={{color:'var(--text-secondary)'}}>샌드박스</b>에서 실행되며 설치 시 권한을 명시적으로 요청합니다. Verified 배지는 코드 검증을 통과한 퍼블리셔입니다.
        </div>
      </div>
    </div>
  );
}

function EmptyView({ title, sub, icon }) {
  return (
    <div style={{ height:'100%', display:'grid', placeItems:'center' }}>
      <div style={{ textAlign:'center', maxWidth:380 }}>
        <div style={{ width:56, height:56, borderRadius:14, background:'var(--surface-secondary)', border:'1px solid var(--border-subtle)', display:'grid', placeItems:'center', margin:'0 auto 18px', color:'var(--text-tertiary)' }}><Icon name={icon} size={26} /></div>
        <h2 style={{ margin:'0 0 8px', fontSize:'var(--text-xl)', fontWeight:600 }}>{title}</h2>
        <p style={{ margin:0, fontSize:'var(--text-md)', color:'var(--text-tertiary)', lineHeight:1.6 }}>{sub}</p>
      </div>
    </div>
  );
}

Object.assign(window, { SearchCenter, AIWorkspace, PluginMarketplace, EmptyView });
