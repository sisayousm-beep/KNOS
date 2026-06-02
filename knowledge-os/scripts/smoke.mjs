// Throwaway smoke test for the pure Phase-1 logic modules.
import { renderMarkdown, wikiLinks, headings } from '../src/markdown.js';
import { excerpt, relativeTime, wordCount } from '../src/util.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗'} ${name}`); };

// wikiLinks — dedup, trims
ok('wikiLinks finds + dedups', JSON.stringify(wikiLinks('a [[Foo]] b [[Bar]] c [[Foo]]')) === JSON.stringify(['Foo', 'Bar']));

// headings — levels and text
const h = headings('# A\n## B\ntext\n### C');
ok('headings count = 3', h.length === 3);
ok('headings levels 1/2/3', h[0].level === 1 && h[1].level === 2 && h[2].level === 3);
ok('headings text', h[0].text === 'A' && h[2].text === 'C');

// excerpt — strips markdown
ok('excerpt strips marks', excerpt('# Title\n\n**bold** and `code` here') === 'Title bold and code here');

// renderMarkdown — h1 + wikilink anchor
const html = renderMarkdown('# Hi\n\nsee [[Vector DB 비교]] please');
ok('renderMarkdown emits <h1>', /<h1/.test(html));
ok('renderMarkdown wikilink span', /class="wikilink"/.test(html) && /data-title="Vector DB 비교"/.test(html));

// wordCount
ok('wordCount', wordCount('one two  three') === 3);

// relativeTime buckets
ok('relativeTime now', relativeTime(new Date().toISOString()) === '방금');
ok('relativeTime 2h', relativeTime(new Date(Date.now() - 2 * 3600e3).toISOString()) === '2시간 전');

// search predicate (mirrors Search.jsx)
const docs = [
  { title: 'RAG 파이프라인', tags: ['rag'], content: 'Qdrant 벡터 DB' },
  { title: 'Transformer', tags: ['attention'], content: '어텐션' },
];
const match = (q) => docs.filter((d) => {
  const ql = q.toLowerCase();
  return d.title.toLowerCase().includes(ql) || d.tags.some((t) => t.includes(ql)) || d.content.toLowerCase().includes(ql);
});
ok('search by content', match('qdrant').length === 1 && match('qdrant')[0].title === 'RAG 파이프라인');
ok('search by tag', match('attention').length === 1);
ok('search empty-ish', match('없는단어').length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
