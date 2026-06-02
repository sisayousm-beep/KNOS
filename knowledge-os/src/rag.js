// ============================================================
// Knowledge OS — Phase 4 RAG (Chunk → Embedding → Vector Search)
// 설계도 §2.4 파이프라인을 오프라인 데스크톱에 맞게: 외부 Vector DB
// (Qdrant 등) 대신 로컬 인메모리 인덱스 + localStorage 영속화.
// 임베딩은 하이브리드 — Gemini text-embedding-004(키 있을 때) / 로컬 해시 TF.
// 검색 결과 청크는 ai.ask()가 LLM 컨텍스트로 사용한다.
// ============================================================

const STORE = 'logia.rag.v1';
const GKEY = 'logia.gemini.key';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'text-embedding-004';
const LOCAL_DIM = 256;

function key() {
  try { return localStorage.getItem(GKEY) || ''; } catch { return ''; }
}

// In-memory copy so search still works if localStorage write was refused.
let _index = null;

// ---- text → chunks ----------------------------------------------------------

function strip(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`>]/g, '')
    .trim();
}

// ~400-char chunks split on blank lines; title prepended for context.
function chunkDoc(doc) {
  const title = (doc.title || '').trim();
  const paras = strip(doc.content || '').split(/\n{2,}/).map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const chunks = [];
  let cur = '';
  for (const p of paras) {
    if (cur && (cur.length + p.length) > 400) { chunks.push(cur); cur = p; }
    else cur = cur ? `${cur} ${p}` : p;
  }
  if (cur) chunks.push(cur);
  return chunks
    .filter((c) => c.length >= 20)
    .map((text) => ({ docId: doc.id, title, text: title ? `${title} — ${text}` : text }));
}

// ---- embeddings -------------------------------------------------------------

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length >= 2);
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

function localEmbed(text) {
  const v = new Array(LOCAL_DIM).fill(0);
  for (const t of tokenize(text)) v[hashStr(t) % LOCAL_DIM] += 1;
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

async function geminiEmbedBatch(texts) {
  const k = key();
  const res = await fetch(`${BASE}/models/${EMBED_MODEL}:batchEmbedContents?key=${encodeURIComponent(k)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((t) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: t }] },
      })),
    }),
  });
  if (!res.ok) {
    let msg = `Embedding HTTP ${res.status}`;
    try { const j = await res.json(); if (j.error?.message) msg = j.error.message; } catch { /* keep status */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return (data.embeddings || []).map((e) => e.values);
}

// Embed many texts in the given mode. Gemini batched ≤100 per request.
async function embedAll(texts, mode, onProgress) {
  if (mode === 'local') {
    const out = texts.map(localEmbed);
    onProgress?.(texts.length, texts.length);
    return out;
  }
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const slice = texts.slice(i, i + 100);
    out.push(...await geminiEmbedBatch(slice));
    onProgress?.(Math.min(i + 100, texts.length), texts.length);
  }
  return out;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// ---- index lifecycle --------------------------------------------------------

function read() {
  if (_index) return _index;
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) _index = JSON.parse(raw);
  } catch { /* ignore corrupt */ }
  return _index;
}

export function indexInfo() {
  const idx = read();
  return idx?.items?.length ? { count: idx.items.length, docs: new Set(idx.items.map((i) => i.docId)).size, mode: idx.mode } : null;
}

export function clearIndex() {
  _index = null;
  try { localStorage.removeItem(STORE); } catch { /* ignore */ }
}

// (Re)build the whole index from the current documents.
// Returns { count, docs, mode }.
export async function buildIndex(docs, onProgress) {
  const mode = key() ? 'gemini' : 'local';
  const chunks = docs.flatMap(chunkDoc);
  if (!chunks.length) { clearIndex(); return { count: 0, docs: 0, mode }; }
  const vectors = await embedAll(chunks.map((c) => c.text), mode, onProgress);
  const items = chunks.map((c, i) => ({ ...c, vector: vectors[i] }));
  _index = { mode, dim: vectors[0]?.length || 0, items, builtAt: Date.now() };
  try { localStorage.setItem(STORE, JSON.stringify(_index)); } catch { /* over quota → keep in-memory */ }
  return { count: items.length, docs: new Set(items.map((i) => i.docId)).size, mode };
}

// Vector search → top-k chunks: [{ docId, title, text, score }].
export async function search(query, topK = 5) {
  const idx = read();
  if (!idx?.items?.length) return [];
  // Query must be embedded the same way the index was, or dims won't match.
  if (idx.mode === 'gemini' && !key()) return [];
  const [qv] = await embedAll([query], idx.mode);
  return idx.items
    .map((it) => ({ docId: it.docId, title: it.title, text: it.text, score: cosine(qv, it.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
