// ============================================================
// Knowledge OS — small pure helpers
// ============================================================

export function uid(prefix = 'd') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// "방금", "12분 전", "3시간 전", "2일 전", or a date.
export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  if (day < 30) return `${Math.floor(day / 7)}주 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// Rough token count — whitespace split. Good enough for a stat chip.
export function wordCount(md = '') {
  const m = md.trim().match(/\S+/g);
  return m ? m.length : 0;
}

// First meaningful line, markdown syntax stripped, for previews.
export function excerpt(md = '', max = 150) {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')          // code fences
    .replace(/^#{1,6}\s+/gm, '')               // heading marks
    .replace(/\[\[([^\]]+)\]\]/g, '$1')         // wikilinks
    .replace(/[*_`>#-]/g, '')                   // inline marks
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}
