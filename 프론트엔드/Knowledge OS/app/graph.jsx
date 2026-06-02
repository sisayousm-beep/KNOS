// ============================================================
// Knowledge OS — Knowledge Graph view
// Force-directed / Cluster / Radial layouts, interactive.
// props: { layout, onOpen }
// ============================================================
const { useState, useEffect, useRef, useMemo } = React;

// Build node list from DOCS + a couple of synthetic nodes referenced by edges
function buildGraph() {
  const ids = new Set(DOCS.map(d=>d.id));
  EDGES.forEach(([a,b])=>{ ids.add(a); ids.add(b); });
  const extra = {
    'd-scaling': { id:'d-scaling', title:'Scaling Hypothesis', tag:'scaling', links:4 },
  };
  const nodes = [...ids].map(id => {
    const d = DOCS.find(x=>x.id===id) || extra[id] || { id, title:id.replace('d-',''), tag:'misc', links:2 };
    return { ...d, deg: 0 };
  });
  const adj = {}; nodes.forEach(n=>adj[n.id]=[]);
  EDGES.forEach(([a,b,w])=>{ if(adj[a]&&adj[b]){ adj[a].push({t:b,w}); adj[b].push({t:a,w}); } });
  nodes.forEach(n=> n.deg = (adj[n.id]||[]).length);
  return { nodes, adj };
}

const TAG_HUES = { transformer:210, attention:200, llm:220, rag:160, 'vector-db':150, embedding:170, agent:265, 'fine-tuning':35, evaluation:300, quantization:20, prompting:280, moe:190, scaling:230, misc:0 };

function KnowledgeGraph({ layout='force', onOpen }) {
  const { nodes, adj } = useMemo(buildGraph, []);
  const wrapRef = useRef(null);
  const posRef = useRef({});
  const [, force] = useState(0);
  const [size, setSize] = useState({ w: 900, h: 640 });
  const [hover, setHover] = useState(null);
  const [sel, setSel] = useState('d-transformer');
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef(null);
  const panRef = useRef({ x:0, y:0 });
  const [pan, setPan] = useState({ x:0, y:0 });

  // init positions
  useEffect(() => {
    const p = {};
    nodes.forEach((n,i) => {
      const a = (i/nodes.length)*Math.PI*2;
      p[n.id] = { x: Math.cos(a)*180 + (Math.random()-0.5)*40, y: Math.sin(a)*180 + (Math.random()-0.5)*40, vx:0, vy:0 };
    });
    posRef.current = p;
    force(v=>v+1); // ensure an immediate render with initial positions (don't wait for rAF)
  }, [nodes]);

  // resize observer
  useEffect(() => {
    const el = wrapRef.current; if(!el) return;
    const ro = new ResizeObserver(()=>{ const r=el.getBoundingClientRect(); setSize({ w:r.width, h:r.height }); });
    ro.observe(el); return ()=>ro.disconnect();
  }, []);

  // BFS distance from sel (for radial)
  const dist = useMemo(() => {
    const d = {}; nodes.forEach(n=>d[n.id]=Infinity); d[sel]=0;
    const q=[sel];
    while(q.length){ const c=q.shift(); (adj[c]||[]).forEach(({t})=>{ if(d[t]>d[c]+1){ d[t]=d[c]+1; q.push(t);} }); }
    return d;
  }, [sel, nodes, adj]);

  // simulation loop
  useEffect(() => {
    let raf; let alpha = 1;
    const cx = ()=>size.w/2, cy = ()=>size.h/2;
    const tags = [...new Set(nodes.map(n=>n.tag))];
    const clusterCenter = {};
    tags.forEach((t,i)=>{ const a=(i/tags.length)*Math.PI*2; clusterCenter[t]={ x:Math.cos(a)*230, y:Math.sin(a)*230 }; });

    function step() {
      const p = posRef.current;
      const ns = nodes;
      // repulsion
      for (let i=0;i<ns.length;i++){
        for (let j=i+1;j<ns.length;j++){
          const a=p[ns[i].id], b=p[ns[j].id]; if(!a||!b) continue;
          let dx=a.x-b.x, dy=a.y-b.y; let d2=dx*dx+dy*dy||0.01; let d=Math.sqrt(d2);
          const rep = (layout==='cluster'?900:1600)/d2;
          const fx=dx/d*rep, fy=dy/d*rep;
          a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
        }
      }
      // springs
      EDGES.forEach(([s,t,w])=>{
        const a=p[s], b=p[t]; if(!a||!b) return;
        let dx=b.x-a.x, dy=b.y-a.y; let d=Math.sqrt(dx*dx+dy*dy)||0.01;
        const target = layout==='radial'?70:110;
        const k=0.02*(w||1); const f=(d-target)*k;
        const fx=dx/d*f, fy=dy/d*f;
        a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
      });
      // mode forces
      ns.forEach(n=>{
        const a=p[n.id]; if(!a) return;
        if(layout==='force'){
          a.vx += (0-a.x)*0.004; a.vy += (0-a.y)*0.004;
        } else if(layout==='cluster'){
          const c=clusterCenter[n.tag]||{x:0,y:0};
          a.vx += (c.x-a.x)*0.02; a.vy += (c.y-a.y)*0.02;
        } else if(layout==='radial'){
          const ring = dist[n.id]===Infinity?4:dist[n.id];
          const R = ring*120;
          const cur = Math.atan2(a.y, a.x);
          const tx = Math.cos(cur)*R, ty = Math.sin(cur)*R;
          a.vx += (tx-a.x)*0.05; a.vy += (ty-a.y)*0.05;
          if(n.id===sel){ a.vx += (0-a.x)*0.2; a.vy += (0-a.y)*0.2; }
        }
      });
      // integrate
      ns.forEach(n=>{
        const a=p[n.id]; if(!a) return;
        if(dragRef.current===n.id) { a.vx=0; a.vy=0; return; }
        a.vx*=0.82; a.vy*=0.82;
        a.x+=a.vx*alpha; a.y+=a.vy*alpha;
      });
      alpha *= 0.99; if(alpha<0.06) alpha=0.06;
      force(v=>v+1);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(raf);
  }, [layout, size.w, size.h, dist, sel, nodes]);

  // pointer drag for nodes / pan
  function onPointerDown(e, id){
    e.stopPropagation();
    dragRef.current = id;
    const move = (ev)=>{
      const rect = wrapRef.current.getBoundingClientRect();
      const x = (ev.clientX-rect.left - size.w/2 - pan.x)/zoom;
      const y = (ev.clientY-rect.top - size.h/2 - pan.y)/zoom;
      const p = posRef.current[id]; if(p){ p.x=x; p.y=y; p.vx=0; p.vy=0; }
    };
    const up = ()=>{ dragRef.current=null; window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  }
  function onCanvasDown(e){
    const start={ x:e.clientX, y:e.clientY }, p0={...pan};
    const move=(ev)=>{ setPan({ x:p0.x+(ev.clientX-start.x), y:p0.y+(ev.clientY-start.y) }); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  }

  const p = posRef.current;
  const selNode = nodes.find(n=>n.id===sel);
  const connected = new Set((adj[sel]||[]).map(e=>e.t));
  const cx = size.w/2 + pan.x, cy = size.h/2 + pan.y;

  return (
    <div style={{ display:'flex', height:'100%', minHeight:0 }}>
      {/* Graph canvas */}
      <div ref={wrapRef} onPointerDown={onCanvasDown}
        style={{ flex:1, position:'relative', overflow:'hidden', cursor:'grab',
          background:'var(--graph-bg)',
          backgroundImage:'radial-gradient(var(--dot-grid) 1px, transparent 1px)', backgroundSize:'22px 22px' }}>

        {/* toolbar */}
        <div style={{ position:'absolute', top:14, left:14, zIndex:5, display:'flex', gap:8, alignItems:'center' }}>
          <div className="badge badge-accent" style={{ height:24 }}><Icon name="graph" size={12} />{nodes.length} nodes · {EDGES.length} edges</div>
        </div>
        <div style={{ position:'absolute', top:14, right:14, zIndex:5, display:'flex', gap:6, flexDirection:'column' }}>
          <button className="btn btn-icon btn-sm" onClick={()=>setZoom(z=>Math.min(2.2,z+0.2))}><Icon name="zoomIn" size={14} /></button>
          <button className="btn btn-icon btn-sm" onClick={()=>setZoom(z=>Math.max(0.5,z-0.2))}><Icon name="zoomOut" size={14} /></button>
          <button className="btn btn-icon btn-sm" onClick={()=>{ setZoom(1); setPan({x:0,y:0}); }}><Icon name="pin" size={13} /></button>
        </div>

        <svg width={size.w} height={size.h} style={{ position:'absolute', inset:0 }}>
          <g transform={`translate(${cx},${cy}) scale(${zoom})`}>
            {/* edges */}
            {EDGES.map(([s,t,w],i)=>{
              const a=p[s], b=p[t]; if(!a||!b) return null;
              const isSel = s===sel||t===sel;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isSel?'var(--graph-edge-sel)':'var(--graph-edge)'}
                strokeWidth={isSel?1.6:(0.6+w*0.3)} />;
            })}
            {/* nodes */}
            {nodes.map(n=>{
              const a=p[n.id]; if(!a) return null;
              const isSel=n.id===sel, isConn=connected.has(n.id), isHover=hover===n.id;
              const r = 6 + Math.min(n.deg*1.6, 12);
              const hue = TAG_HUES[n.tag] ?? 220;
              let fill = 'var(--graph-node)';
              if(isSel) fill='var(--graph-node-active)';
              else if(isConn) fill='var(--graph-node-conn)';
              const dim = sel && !isSel && !isConn ? 0.4 : 1;
              return (
                <g key={n.id} transform={`translate(${a.x},${a.y})`} opacity={dim}
                  style={{ cursor:'pointer' }}
                  onPointerDown={(e)=>onPointerDown(e,n.id)}
                  onClick={(e)=>{ e.stopPropagation(); setSel(n.id); }}
                  onMouseEnter={()=>setHover(n.id)} onMouseLeave={()=>setHover(null)}>
                  {isSel && <circle r={r+7} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.4}>
                    <animate attributeName="r" values={`${r+5};${r+10};${r+5}`} dur="2.4s" repeatCount="indefinite" /></circle>}
                  <circle r={r} fill={fill} stroke={isSel?'var(--accent-hover)':'var(--bg-primary)'} strokeWidth={isSel?2:1.5}
                    style={{ filter: isSel?'drop-shadow(0 0 8px var(--accent))':'none' }} />
                  {(isHover||isSel||n.deg>=4) && (
                    <text y={r+13} textAnchor="middle" fontSize={11/Math.max(zoom*0.7,0.8)}
                      fill={isSel?'var(--text-primary)':'var(--text-secondary)'}
                      fontWeight={isSel?600:450} fontFamily="var(--font-sans)" style={{ pointerEvents:'none' }}>
                      {n.title.length>22?n.title.slice(0,21)+'…':n.title}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* legend */}
        <div style={{ position:'absolute', bottom:14, left:14, zIndex:5, display:'flex', gap:14, alignItems:'center',
          padding:'7px 12px', background:'var(--surface-primary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
          {[['Active','var(--graph-node-active)'],['Connected','var(--graph-node-conn)'],['Default','var(--graph-node)']].map(([l,c])=>(
            <span key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:c }}></span>{l}
            </span>
          ))}
          <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', borderLeft:'1px solid var(--border-subtle)', paddingLeft:14 }}>
            {layout} layout · drag · scroll-free zoom →
          </span>
        </div>
      </div>

      {/* Right inspector */}
      <div style={{ width:300, flex:'none', borderLeft:'1px solid var(--border-subtle)', background:'var(--bg-secondary)', display:'flex', flexDirection:'column', overflow:'auto' }}>
        {selNode && <>
          <div style={{ padding:'16px 16px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 8px var(--accent)' }}></span>
              <span className="section-label">Selected node</span>
            </div>
            <div style={{ fontSize:'var(--text-lg)', fontWeight:600, letterSpacing:'-0.01em', marginBottom:8 }}>{selNode.title}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span className="tag">{selNode.tag}</span>
              <span className="badge" style={{ height:20 }}><Icon name="link" size={11} />{selNode.deg} connections</span>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop:14, width:'100%' }} onClick={()=>onOpen&&onOpen(selNode)}>
              <Icon name="arrowRight" size={13} />문서 열기
            </button>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div className="section-label" style={{ marginBottom:10 }}>Backlinks · 연결 강도</div>
            <div className="list">
              {(adj[sel]||[]).sort((a,b)=>b.w-a.w).map(({t,w})=>{
                const tn = nodes.find(n=>n.id===t);
                return (
                  <div key={t} className="list-row" style={{ padding:'8px 8px' }} onClick={()=>setSel(t)}>
                    <Icon name="doc" size={14} style={{ color:'var(--text-tertiary)', flex:'none' }} />
                    <span style={{ flex:1, fontSize:'var(--text-base)', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tn?tn.title:t}</span>
                    <span style={{ width:46, height:4, borderRadius:2, background:'var(--surface-elevated)', flex:'none', overflow:'hidden' }}>
                      <span style={{ display:'block', height:'100%', width:`${w/3*100}%`, background:'var(--accent)' }}></span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding:'4px 16px 16px' }}>
            <div className="card" style={{ padding:'12px 13px', background:'var(--accent-bg)', borderColor:'var(--accent-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                <Icon name="sparkles" size={13} style={{ color:'var(--accent)' }} />
                <span style={{ fontSize:'var(--text-sm)', fontWeight:600, color:'var(--accent)', whiteSpace:'nowrap' }}>AI 추천 연결</span>
              </div>
              <div style={{ fontSize:'var(--text-base)', color:'var(--text-secondary)', lineHeight:1.55 }}>
                이 문서는 <b style={{color:'var(--text-primary)',fontWeight:550}}>Mixture of Experts</b>와 0.82 유사도를 보입니다. 연결을 추가할까요?
              </div>
              <button className="btn btn-sm" style={{ marginTop:10 }}><Icon name="plus" size={12} />연결 추가</button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

window.KnowledgeGraph = KnowledgeGraph;
