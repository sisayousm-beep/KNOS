// ============================================================
// Knowledge OS — Workflow Builder view
// Trigger / Action / AI / Condition nodes on a canvas, draggable.
// props: {}
// ============================================================
const { useState, useRef } = React;
const NODE_KINDS = {
  trigger:   { color:'var(--success)',  bg:'var(--success-bg)',  icon:'bolt',     label:'TRIGGER' },
  ai:        { color:'var(--accent)',   bg:'var(--accent-bg)',   icon:'sparkles', label:'AI' },
  action:    { color:'var(--text-secondary)', bg:'var(--surface-secondary)', icon:'play', label:'ACTION' },
  condition: { color:'var(--warning)',  bg:'var(--warning-bg)',  icon:'branch',   label:'CONDITION' },
  output:    { color:'var(--info)',      bg:'var(--info-bg)',     icon:'webhook',  label:'OUTPUT' },
};

const INITIAL_NODES = [
  { id:'n1', kind:'trigger',   x:60,  y:200, title:'Document Created', sub:'on new document', io:'DocumentCreated' },
  { id:'n2', kind:'ai',        x:320, y:120, title:'AI Summarize',     sub:'Gemini Flash', io:'Summarize' },
  { id:'n3', kind:'ai',        x:320, y:280, title:'Generate Tags',    sub:'auto-categorize', io:'GenerateTag' },
  { id:'n4', kind:'condition', x:600, y:200, title:'If tags ≥ 3',      sub:'branch condition', io:'Condition' },
  { id:'n5', kind:'action',    x:860, y:120, title:'Connect Graph',    sub:'link related docs', io:'GraphConnect' },
  { id:'n6', kind:'output',    x:860, y:280, title:'Send Webhook',     sub:'POST /notify', io:'SendWebhook' },
];
const CONNECTIONS = [
  ['n1','n2'],['n1','n3'],['n2','n4'],['n3','n4'],['n4','n5'],['n4','n6'],
];
const NODE_W = 188, NODE_H = 74;

function WorkflowBuilder() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [sel, setSel] = useState('n2');
  const [pan, setPan] = useState({ x:0, y:0 });
  const [running, setRunning] = useState(false);
  const [activeEdge, setActiveEdge] = useState(-1);
  const wrapRef = useRef(null);

  function dragNode(e, id){
    e.stopPropagation();
    setSel(id);
    const start={ x:e.clientX, y:e.clientY };
    const node = nodes.find(n=>n.id===id); const o={ x:node.x, y:node.y };
    const move=(ev)=>{
      setNodes(ns=>ns.map(n=>n.id===id?{...n, x:o.x+(ev.clientX-start.x), y:o.y+(ev.clientY-start.y)}:n));
    };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  }
  function dragCanvas(e){
    const start={ x:e.clientX, y:e.clientY }, p0={...pan};
    const move=(ev)=>setPan({ x:p0.x+(ev.clientX-start.x), y:p0.y+(ev.clientY-start.y) });
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  }

  // run animation
  function runFlow(){
    if(running) return;
    setRunning(true); setActiveEdge(0);
    let i=0;
    const tick=()=>{
      i++;
      if(i>=CONNECTIONS.length){ setActiveEdge(-1); setRunning(false); return; }
      setActiveEdge(i); setTimeout(tick, 480);
    };
    setTimeout(tick, 480);
  }

  const nodeById = id => nodes.find(n=>n.id===id);
  const selNode = nodeById(sel);

  function edgePath(a,b){
    const x1=a.x+NODE_W, y1=a.y+NODE_H/2, x2=b.x, y2=b.y+NODE_H/2;
    const dx=Math.max(40,(x2-x1)/2);
    return `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
  }

  return (
    <div style={{ display:'flex', height:'100%', minHeight:0 }}>
      {/* Left palette */}
      <div style={{ width:208, flex:'none', borderRight:'1px solid var(--border-subtle)', background:'var(--bg-secondary)', overflow:'auto' }}>
        <div style={{ padding:'14px 14px 10px' }}>
          <div className="section-label">Node Library</div>
        </div>
        {Object.entries(NODE_KINDS).map(([k,v])=>(
          <div key={k} style={{ padding:'0 10px 8px' }}>
            <div className="section-label" style={{ fontSize:10, padding:'8px 4px 4px', color:v.color }}>{v.label}</div>
            {paletteItems(k).map(it=>(
              <div key={it} className="list-row" style={{ padding:'7px 8px', marginBottom:2, cursor:'grab' }}>
                <span style={{ width:24, height:24, borderRadius:6, display:'grid', placeItems:'center', background:v.bg, color:v.color, flex:'none' }}>
                  <Icon name={v.icon} size={13} />
                </span>
                <span style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)' }}>{it}</span>
                <Icon name="plus" size={12} style={{ marginLeft:'auto', color:'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* toolbar */}
        <div style={{ height:46, flex:'none', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10, padding:'0 16px', background:'var(--bg-secondary)' }}>
          <Icon name="workflow" size={15} style={{ color:'var(--text-tertiary)' }} />
          <span style={{ fontSize:'var(--text-md)', fontWeight:600 }}>Auto-organize new docs</span>
          <span className="badge badge-success" style={{ height:20 }}><span className="dot"></span>Active</span>
          <div style={{ flex:1 }}></div>
          <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>142 runs · 99.2% success</span>
          <button className="btn btn-sm"><Icon name="clock" size={13} />History</button>
          <button className="btn btn-primary btn-sm" onClick={runFlow} disabled={running}>
            {running ? <><span className="spinner" style={{width:12,height:12}}></span>Running…</> : <><Icon name="play" size={12} />Test Run</>}
          </button>
        </div>

        {/* graph area */}
        <div ref={wrapRef} onPointerDown={dragCanvas}
          style={{ flex:1, position:'relative', overflow:'hidden', cursor:'grab',
            background:'var(--bg-primary)',
            backgroundImage:'radial-gradient(var(--dot-grid) 1px, transparent 1px)', backgroundSize:'24px 24px',
            backgroundPosition:`${pan.x}px ${pan.y}px` }}>
          <div style={{ position:'absolute', left:pan.x, top:pan.y, width:0, height:0 }}>
            {/* edges */}
            <svg style={{ position:'absolute', overflow:'visible', pointerEvents:'none' }} width="1" height="1">
              {CONNECTIONS.map((c,i)=>{
                const a=nodeById(c[0]), b=nodeById(c[1]); if(!a||!b) return null;
                const on = running && i<=activeEdge;
                return <path key={i} d={edgePath(a,b)} fill="none"
                  stroke={on?'var(--accent)':'var(--border-strong)'} strokeWidth={on?2.4:1.6}
                  strokeDasharray={on?'6 4':'none'} style={{ transition:'stroke .2s' }}>
                  {on && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />}
                </path>;
              })}
            </svg>
            {/* nodes */}
            {nodes.map(n=>{
              const k=NODE_KINDS[n.kind]; const isSel=n.id===sel;
              const isActive = running && CONNECTIONS.slice(0,activeEdge+1).some(c=>c[1]===n.id||c[0]===n.id);
              return (
                <div key={n.id} onPointerDown={(e)=>dragNode(e,n.id)}
                  style={{ position:'absolute', left:n.x, top:n.y, width:NODE_W, height:NODE_H,
                    background:'var(--surface-primary)', border:`1px solid ${isSel?'var(--accent)':'var(--border-default)'}`,
                    borderRadius:'var(--radius-lg)', boxShadow: isSel?'0 0 0 3px var(--accent-glow), var(--shadow-md)':'var(--shadow-sm)',
                    cursor:'grab', userSelect:'none', transition:'box-shadow .15s, border-color .15s',
                    outline: isActive?'2px solid var(--accent)':'none', outlineOffset:2 }}>
                  {/* ports */}
                  {n.kind!=='trigger' && <span style={{ position:'absolute', left:-5, top:NODE_H/2-5, width:10, height:10, borderRadius:'50%', background:'var(--bg-primary)', border:'2px solid var(--border-strong)' }}></span>}
                  {n.kind!=='output' && <span style={{ position:'absolute', right:-5, top:NODE_H/2-5, width:10, height:10, borderRadius:'50%', background:'var(--bg-primary)', border:`2px solid ${k.color}` }}></span>}
                  <div style={{ display:'flex', alignItems:'center', gap:9, padding:'12px 13px' }}>
                    <span style={{ width:32, height:32, borderRadius:8, display:'grid', placeItems:'center', background:k.bg, color:k.color, flex:'none' }}>
                      <Icon name={k.icon} size={16} />
                    </span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.06em', color:k.color, marginBottom:2 }}>{k.label}</div>
                      <div style={{ fontSize:'var(--text-base)', fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.title}</div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.sub}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* mini hint */}
          <div style={{ position:'absolute', bottom:14, left:14, fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)',
            padding:'6px 10px', background:'var(--surface-primary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
            노드를 드래그하세요 · 캔버스를 끌어 이동 · Test Run으로 실행 미리보기
          </div>
        </div>
      </div>

      {/* Right config */}
      <div style={{ width:288, flex:'none', borderLeft:'1px solid var(--border-subtle)', background:'var(--bg-secondary)', overflow:'auto' }}>
        {selNode && <>
          <div style={{ padding:'16px', borderBottom:'1px solid var(--border-subtle)' }}>
            <div className="section-label" style={{ marginBottom:12 }}>Node Config</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:36, height:36, borderRadius:9, display:'grid', placeItems:'center', background:NODE_KINDS[selNode.kind].bg, color:NODE_KINDS[selNode.kind].color, flex:'none' }}>
                <Icon name={NODE_KINDS[selNode.kind].icon} size={18} />
              </span>
              <div>
                <div style={{ fontSize:'var(--text-md)', fontWeight:600 }}>{selNode.title}</div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{selNode.io}</div>
              </div>
            </div>
          </div>
          <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="label">Label</label>
              <input className="input" defaultValue={selNode.title} />
            </div>
            {selNode.kind==='ai' && <>
              <div>
                <label className="label">Model</label>
                <div className="segmented" style={{ width:'100%' }}>
                  <button className="active" style={{flex:1}}>Flash</button><button style={{flex:1}}>Pro</button><button style={{flex:1}}>Local</button>
                </div>
              </div>
              <div>
                <label className="label">Prompt</label>
                <textarea className="input" defaultValue="이 문서를 3문장으로 요약하고 핵심 개념을 추출해줘." />
              </div>
            </>}
            {selNode.kind==='condition' && <>
              <div>
                <label className="label">Field</label>
                <input className="input mono" defaultValue="tags.length" />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input mono" defaultValue="≥" style={{ width:60, textAlign:'center' }} />
                <input className="input mono" defaultValue="3" />
              </div>
            </>}
            {selNode.kind==='output' && <div>
              <label className="label">Webhook URL</label>
              <input className="input mono" defaultValue="https://api.notify/v1" />
            </div>}
            {selNode.kind==='trigger' && <div>
              <label className="label">Event</label>
              <div className="card" style={{ padding:'9px 11px', fontFamily:'var(--font-mono)', fontSize:'var(--text-sm)', color:'var(--success)' }}>{selNode.io}</div>
            </div>}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:4 }}>
              <span style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)' }}>Enabled</span>
              <label className="switch"><input type="checkbox" defaultChecked /><span className="track"></span><span className="thumb"></span></label>
            </div>
          </div>
          <div style={{ padding:'0 16px 16px' }}>
            <button className="btn btn-danger btn-sm" style={{ width:'100%' }}><Icon name="trash" size={12} />노드 삭제</button>
          </div>
        </>}
      </div>
    </div>
  );
}

function paletteItems(kind){
  return ({
    trigger: ['Document Created','Tag Added','Schedule'],
    ai: ['Summarize','Generate Tags','Ask AI'],
    action: ['Connect Graph','Run Script'],
    condition: ['If / Else'],
    output: ['Webhook','Git Sync'],
  })[kind] || [];
}

window.WorkflowBuilder = WorkflowBuilder;
