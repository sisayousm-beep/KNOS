// ============================================================
// Knowledge OS — Markdown rendering + light parsing
// marked for the heavy lifting; [[wikilinks]] handled on top.
// ============================================================
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

const WIKILINK = /\[\[([^\]]+)\]\]/g;

// Render markdown to HTML. [[Title]] becomes an accent-styled link span.
export function renderMarkdown(md = '') {
  const withLinks = md.replace(WIKILINK, (_, t) => {
    const title = t.trim();
    return `<a class="wikilink" data-title="${title.replace(/"/g, '&quot;')}" href="#">${title}</a>`;
  });
  return marked.parse(withLinks);
}

// Outgoing [[wikilink]] titles found in a document body.
export function wikiLinks(md = '') {
  const out = [];
  let m;
  WIKILINK.lastIndex = 0;
  while ((m = WIKILINK.exec(md))) out.push(m[1].trim());
  return [...new Set(out)];
}

// Headings (## ...) for the outline panel.
export function headings(md = '') {
  return md.split('\n')
    .map((line) => {
      const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      return m ? { level: m[1].length, text: m[2].trim() } : null;
    })
    .filter(Boolean);
}
