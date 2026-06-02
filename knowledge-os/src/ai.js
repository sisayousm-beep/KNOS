// ============================================================
// Knowledge OS — Phase 3 AI engine (요약 / 자동 태그 / 질문응답)
// Hybrid: uses Gemini Flash when an API key is set, otherwise falls
// back to local heuristics so every feature works fully offline.
// Design (설계도.json §2.3, Phase 3) calls for Gemini Free Tier.
// ============================================================
import { excerpt } from './util.js';

const KEY = 'logia.gemini.key';
const MODEL = 'gemini-2.0-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ---- API key persistence ----------------------------------------------------

export function getKey() {
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
}

export function setKey(value) {
  try {
    const v = (value || '').trim();
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch { /* ignore quota / disabled storage */ }
}

export function hasKey() { return !!getKey(); }

// Validate a key with a cheap, side-effect-free GET (lists models).
// Returns { ok: true } or { ok: false, error: string }.
export async function validateKey(key) {
  const k = (key || '').trim();
  if (!k) return { ok: false, error: '키가 비어 있습니다.' };
  try {
    const res = await fetch(`${BASE}/models?key=${encodeURIComponent(k)}`);
    if (res.ok) return { ok: true };
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j.error?.message) msg = j.error.message; } catch { /* keep status */ }
    return { ok: false, error: msg };
  } catch (e) {
    return { ok: false, error: e.message || '네트워크 오류' };
  }
}

// ---- Gemini call -------------------------------------------------------------

async function gemini(prompt, { temperature = 0.3, maxOutputTokens = 1024 } = {}) {
  const key = getKey();
  if (!key) throw new Error('NO_KEY');
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens },
    }),
  });
  if (!res.ok) {
    let msg = `Gemini HTTP ${res.status}`;
    try { const j = await res.json(); if (j.error?.message) msg = j.error.message; } catch { /* keep status */ }
    throw new Error(msg);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text.trim()) throw new Error('빈 응답');
  return text.trim();
}

// ---- Local heuristic helpers -------------------------------------------------

// Plain text from markdown (drops fences, headings marks, wikilink brackets).
function plain(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentences(text) {
  return text.split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

const STOP = new Set([
  // English
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out',
  'has', 'had', 'his', 'how', 'its', 'who', 'with', 'this', 'that', 'from', 'they', 'have', 'were',
  'when', 'what', 'your', 'into', 'than', 'then', 'them', 'each', 'which', 'their', 'about',
  // Korean (조사/대명사/일반어)
  '그리고', '그러나', '하지만', '이것', '저것', '그것', '여기', '거기', '에서', '에게', '으로', '하는', '하다',
  '있다', '없다', '이다', '대한', '대해', '관련', '내용', '문서', '경우', '통해', '위해', '및', '등', '것', '수',
  '를', '을', '이', '가', '은', '는', '의', '에', '와', '과', '도', '만', '로',
]);

function tokens(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !STOP.has(t));
}

// Extractive summary: lead paragraph sentences + a couple of headings.
function localSummary(doc) {
  const heads = (doc.content.match(/^#{1,3}\s+(.+)$/gm) || [])
    .map((h) => h.replace(/^#{1,3}\s+/, '').trim());
  const body = sentences(plain(doc.content)).slice(0, 3).join(' ');
  const parts = [];
  if (body) parts.push(body.length > 280 ? body.slice(0, 280).trimEnd() + '…' : body);
  if (heads.length > 1) parts.push('주요 섹션: ' + heads.slice(0, 5).join(', '));
  return parts.join('\n\n') || excerpt(doc.content) || '요약할 본문이 없습니다.';
}

// Frequency-based keyword tags; title + headings get extra weight.
function localTags(doc, max = 5) {
  const freq = {};
  const bump = (text, w) => tokens(text).forEach((t) => { freq[t] = (freq[t] || 0) + w; });
  bump(doc.title || '', 3);
  bump((doc.content.match(/^#{1,3}\s+(.+)$/gm) || []).join(' '), 2);
  bump(plain(doc.content), 1);
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, max);
}

// Score docs against a query for retrieval (title/tags weighted).
export function rankDocs(query, docs, limit = 4) {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  return docs
    .map((d) => {
      const hay = `${d.title} ${d.title} ${(d.tags || []).join(' ')} ${(d.tags || []).join(' ')} ${plain(d.content)}`.toLowerCase();
      const score = q.reduce((s, term) => s + (hay.split(term).length - 1), 0);
      return { doc: d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.doc);
}

// ---- Public Phase-3 features (hybrid) ---------------------------------------

// Returns { text, source: 'gemini' | 'local' }.
export async function summarize(doc) {
  if (hasKey()) {
    try {
      const text = await gemini(
        `다음 문서를 한국어로 3~4문장으로 간결히 요약해줘. 핵심만, 불필요한 머리말 없이.\n\n제목: ${doc.title}\n\n${plain(doc.content).slice(0, 6000)}`,
        { temperature: 0.2, maxOutputTokens: 512 },
      );
      return { text, source: 'gemini' };
    } catch (e) {
      if (e.message !== 'NO_KEY') throw e;
    }
  }
  return { text: localSummary(doc), source: 'local' };
}

// Returns { tags: string[], source }.
export async function suggestTags(doc, existing = []) {
  const have = new Set(existing.map((t) => t.toLowerCase()));
  let tags, source;
  if (hasKey()) {
    try {
      const out = await gemini(
        `다음 문서에 어울리는 핵심 태그 3~5개를 추천해줘. 소문자 영어 또는 한국어 단어, 공백 없이. 쉼표로만 구분해서 한 줄로 답해줘. 다른 말 금지.\n\n제목: ${doc.title}\n\n${plain(doc.content).slice(0, 4000)}`,
        { temperature: 0.4, maxOutputTokens: 64 },
      );
      tags = out.split(/[,\n]/).map((t) => t.trim().replace(/^#/, '').replace(/\s+/g, '-')).filter(Boolean);
      source = 'gemini';
    } catch (e) {
      if (e.message !== 'NO_KEY') throw e;
    }
  }
  if (!tags) { tags = localTags(doc); source = 'local'; }
  const fresh = [...new Set(tags)].filter((t) => t && !have.has(t.toLowerCase())).slice(0, 5);
  return { tags: fresh, source };
}

// Returns { answer, sources: doc[], source }.
export async function ask(question, docs) {
  const context = rankDocs(question, docs, 4);
  if (hasKey()) {
    try {
      const ctx = context.length
        ? context.map((d, i) => `[문서 ${i + 1}] ${d.title}\n${plain(d.content).slice(0, 1500)}`).join('\n\n')
        : '(관련 문서를 찾지 못함)';
      const answer = await gemini(
        `너는 개인 지식베이스 비서다. 아래 문서들만 근거로 사용자의 질문에 한국어로 답해라. 모르면 모른다고 말해라.\n\n=== 문서 ===\n${ctx}\n\n=== 질문 ===\n${question}`,
        { temperature: 0.3, maxOutputTokens: 1024 },
      );
      return { answer, sources: context, source: 'gemini' };
    } catch (e) {
      if (e.message !== 'NO_KEY') throw e;
    }
  }
  // Local fallback: stitch excerpts from the retrieved docs.
  if (!context.length) {
    return { answer: '지식베이스에서 관련 문서를 찾지 못했습니다. 다른 키워드로 질문해 보세요.', sources: [], source: 'local' };
  }
  const body = context.map((d) => `• ${d.title} — ${excerpt(d.content, 120)}`).join('\n');
  return {
    answer: `관련 문서 ${context.length}건을 찾았습니다. 핵심을 정리하면:\n\n${body}\n\n(로컬 검색 결과 — Gemini 키를 설정하면 AI가 종합 답변을 작성합니다.)`,
    sources: context,
    source: 'local',
  };
}
