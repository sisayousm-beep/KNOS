// ============================================================
// Knowledge OS — Document Editor (Phase 1: real, persisted editing)
// Title + tags + markdown body. Autosaves to the local store.
// Write / Preview toggle, live backlinks + outline from the graph.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { useDocs } from '../store.jsx';
import { renderMarkdown, headings } from '../markdown.js';

function sameTags(a, b) {
  return a.length === b.length && a.every((t, i) => t === b[i]);
}

export default function DocumentEditor({ docId, onOpen, onNew, onNav }) {
  const { docs, getDoc, updateDoc, deleteDoc } = useDocs();
  const doc = getDoc(docId) || docs[0];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [mode, setMode] = useState('write');
  const [status, setStatus] = useState('saved');
  const idRef = useRef(null);

  // Load local editing state when the open document changes.
  useEffect(() => {
    if (!doc) { idRef.current = null; return; }
    if (idRef.current !== doc.id) {
      idRef.current = doc.id;
      setTitle(doc.title);
      setContent(doc.content);
      setTags(doc.tags);
      setMode('write');
      setStatus('saved');
    }
  }, [doc]);

  // Debounced autosave.
  useEffect(() => {
    if (!doc || idRef.current !== doc.id) return;
    if (title === doc.title && content === doc.content && sameTags(tags, doc.tags)) return;
    setStatus('saving');
    const h = setTimeout(() => {
      updateDoc(doc.id, { title, content, tags });
      setStatus('saved');
    }, 500);
    return () => clearTimeout(h);
  }, [title, content, tags, doc, updateDoc]);

  if (!doc) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', color: 'var(--text-tertiary)' }}><Icon name="doc" size={26} /></div>
          <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-xl)', fontWeight: 600 }}>문서가 없습니다</h2>
          <p style={{ margin: '0 0 18px', fontSize: 'var(--text-md)', color: 'var(--text-tertiary)' }}>새 문서를 만들어 지식을 기록해 보세요.</p>
          <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={14} />New Document</button>
        </div>
      </div>
    );
  }

  function addTag() {
    const v = tagDraft.trim().replace(/^#/, '');
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagDraft('');
  }
  function removeTag(t) { setTags(tags.filter((x) => x !== t)); }

  function onDelete() {
    const id = doc.id;
    const rest = docs.filter((d) => d.id !== id);
    idRef.current = null;
    deleteDoc(id);
    if (rest[0]) onOpen(rest[0]); else onNav('dashboard');
  }

  function onProseClick(e) {
    const a = e.target.closest('.wikilink');
    if (!a) return;
    e.preventDefault();
    const target = docs.find((d) => d.title.trim() === a.getAttribute('data-title'));
    if (target) onOpen(target);
  }

  const backlinks = doc.backlinks.map((id) => docs.find((d) => d.id === id)).filter(Boolean);
  const outline = headings(content);
  const words = (content.trim().match(/\S+/g) || []).length;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Editor column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* breadcrumb / toolbar */}
        <div style={{ height: 42, flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', background: 'var(--bg-primary)' }}>
          <Icon name="folder" size={13} />Research<Icon name="chevR" size={12} />
          <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{title || '제목 없음'}</span>
          <div style={{ flex: 1 }}></div>
          {status === 'saving'
            ? <span className="badge" style={{ height: 18 }}><span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }}></span>저장 중…</span>
            : <span className="badge badge-success" style={{ height: 18 }}><Icon name="check" size={10} />저장됨</span>}
          <div className="segmented" style={{ marginLeft: 4 }}>
            <button className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}>Write</button>
            <button className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>Preview</button>
          </div>
          <button className="btn btn-icon btn-sm btn-ghost" title="문서 삭제" onClick={onDelete}><Icon name="trash" size={13} /></button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px 120px' }}>
            <input className="kos-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 없는 문서" />

            {/* tags */}
            <div style={{ display: 'flex', gap: 6, margin: '16px 0 20px', flexWrap: 'wrap', alignItems: 'center' }}>
              {tags.map((t) => (
                <span key={t} className="tag" style={{ cursor: 'default' }}>
                  {t}
                  <span onClick={() => removeTag(t)} style={{ cursor: 'pointer', marginLeft: 2, display: 'inline-flex' }} title="태그 제거">
                    <Icon name="x" size={10} style={{ color: 'var(--text-tertiary)' }} />
                  </span>
                </span>
              ))}
              <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                onBlur={addTag} placeholder="+ 태그"
                style={{ width: 80, background: 'none', border: 'none', outline: 'none', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }} />
            </div>

            {mode === 'write' ? (
              <textarea className="kos-editor-area" value={content} onChange={(e) => setContent(e.target.value)}
                placeholder={'마크다운으로 작성하세요…\n\n# 제목\n## 소제목\n- 목록\n[[다른 문서]] 로 연결, `코드`, **굵게**'}
                style={{ minHeight: 'calc(100vh - 320px)' }} />
            ) : (
              <div className="prose" onClick={onProseClick}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<p style="color:var(--text-disabled)">(내용 없음)</p>' }} />
            )}
          </div>
        </div>
      </div>

      {/* Right: backlinks + outline */}
      <div style={{ width: 300, flex: 'none', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div className="kos-panel-head">
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Backlinks</span>
          <span className="badge" style={{ height: 18 }}>{backlinks.length}</span>
        </div>
        <div style={{ padding: '4px 8px' }}>
          {backlinks.length === 0
            ? <div style={{ padding: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>이 문서를 <span style={{ color: 'var(--accent)' }}>[[{title}]]</span> 로 참조하는 문서가 아직 없습니다.</div>
            : backlinks.map((d) => (
              <div key={d.id} className="list-row" style={{ alignItems: 'flex-start', padding: '8px' }} onClick={() => onOpen(d)}>
                <Icon name="doc" size={14} style={{ color: 'var(--text-tertiary)', flex: 'none', marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.excerpt}</div>
                </div>
              </div>
            ))}
        </div>

        <div className="kos-panel-head" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Outline</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{words} words</span>
        </div>
        <div style={{ padding: '4px 8px 16px' }}>
          {outline.length === 0
            ? <div style={{ padding: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>제목(#)을 추가하면 목차가 생깁니다.</div>
            : outline.map((h, i) => (
              <div key={i} className="list-row" style={{ padding: '6px 8px', paddingLeft: 8 + (h.level - 1) * 12 }}>
                <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>H{h.level}</span>
                <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
