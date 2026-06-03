// ============================================================
// LOGIA — One-time world reorganization
// Rewrites 세계관/ from two project folders into a unified thematic
// layout:  세계관/<분류>/<시대>/<제목>.md  + YAML frontmatter.
//   • scaffolding (# 키워드 / # 프롬프트 / # LINKS / 허브 링크) stripped
//   • [[NN_제목]] links normalized → [[제목]]
//   • contradictions reconciled inline (혈마 603→605 …)
//   • 모드 / 에셋 / 시스템 프롬 / 빈 파일  →  dropped
// The 00_정전 codex (authored separately) is left untouched.
// Originals are backed up at 세계관_원본_백업/ . Run once.
// ============================================================
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '세계관');
const P1 = '01_천마가 환생한 곳은 마교의 삼공녀'; // 현재
const P2 = '02_혼돈 무림의 회귀자';                 // 과거

const clean = (s) => s.replace(/\.md$/i, '').replace(/^\d+[_.]\s*/, '').trim();

// title → 분류 for lore/root docs (characters are auto-classified to 인물).
const CLASS = {
  '정마전쟁': '사건', '만천화우': '무공', '독과 독공 대응': '무공', '비정마공': '무공',
  '혈교': '세력', '혈마': '인물', '초대 무림맹주': '인물', '혼란의 시대': '세계설정',
  '마신': '인물', '무림 3대 무공': '무공', '1458년': '사건', '암년': '세계설정',
  '마교 건물 구조': '지역',
  '유환논쟁(환유논쟁)': '세계설정', '영약의 종류': '세계설정', '강': '세계설정', '쾌': '세계설정',
  '기': '세계설정', '유': '세계설정', '환': '세계설정', '대붕법봉': '영물신물', '남궁서란 과거': '사건',
  '신물': '영물신물', '무음산': '지역', '삼대마경': '무공', '절환': '세계설정', '윤회 사상': '세계설정',
  '혈해': '지역', '역천호': '영물신물', '무신': '세계설정', '영물': '세계설정', '대붕': '영물신물',
  '용조': '영물신물', '수장귀': '영물신물', '백호': '영물신물', '기린': '영물신물', '천조': '영물신물',
  '지룡왕': '영물신물', '미래시': '사건',
};
// title → 시대 override (cross-era subjects); default = project era.
const ERA_OVERRIDE = {
  '마신': '과거', '초대 무림맹주': '과거', '혼란의 시대': '과거',
  '혈마': '양시대', '혈련화': '양시대', '무림 3대 무공': '양시대', '비정마공': '양시대',
  '영약의 종류': '양시대', '강': '양시대', '쾌': '양시대', '기': '양시대', '유': '양시대', '환': '양시대',
  '윤회 사상': '양시대', '무신': '양시대', '영물': '양시대', '절환': '양시대',
};
// collision-safe renames (세계관 프롬·혈련화 appear in both projects).
const RENAME = {
  [`${P1}|세계관 프롬`]: '천마 환생 세계 설정',
  [`${P2}|세계관 프롬`]: '혼돈 무림 세계 설정',
  [`${P1}|혈련화`]: '혈련화 (천마 환생)',
};
// inline reconciliation edits.
const RECON = { '혈마': [['603년 초대 무림맹주', '605년 초대 무림맹주']] };

const SKIP_DIRS = new Set(['에셋', '에셋 프롬']);
const isMode = (t) => /모드/.test(t);
const isSystem = (t) => t === '시스템 프롬';

function walk(dir, acc = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(full, acc); }
    else if (name.toLowerCase().endsWith('.md')) acc.push(full);
  }
  return acc;
}

// Strip prompt scaffolding and hub links; normalize wikilinks.
function normalize(raw) {
  const lines = raw.split(/\r?\n/);
  const out = [];
  let skipKw = false;
  for (const ln of lines) {
    const t = ln.trim();
    if (t === '# 키워드') { skipKw = true; continue; }
    if (skipKw) { if (/^#\s/.test(t)) skipKw = false; else continue; }
    if (t === '# 프롬프트' || t === '# LINKS') continue;
    if (/^\[\[[^\]]*허브\]\]$/.test(t)) continue;
    if (t === '[[천마가 환생한 곳은 마교의 삼공녀]]' || t === '[[혼돈 무림 허브]]') continue;
    out.push(ln);
  }
  let body = out.join('\n');
  body = body.replace(/\[\[\s*\d+[_.]\s*([^\]]+?)\s*\]\]/g, '[[$1]]'); // NN_제목 → 제목
  body = body.replace(/\[\[[^\]]*허브\]\]/g, '');                      // stray hub links
  return body.replace(/\n{3,}/g, '\n\n').trim();
}

const files = walk(ROOT).filter((f) => !f.includes(`${ROOT}\\00_정전`) && !f.includes('/00_정전/'));
let written = 0, dropped = 0;
for (const full of files) {
  const rel = full.slice(ROOT.length + 1);
  const proj = rel.split(/[\\/]/)[0];
  if (proj !== P1 && proj !== P2) continue;           // only the two project folders
  const era0 = proj === P1 ? '현재' : '과거';
  const isChar = /캐릭터/.test(rel);
  let title = clean(basename(full));

  if (isMode(title) || isSystem(title)) { dropped++; continue; }
  const raw = readFileSync(full, 'utf8').trim();
  if (!raw) { dropped++; continue; }

  const cat = isChar ? '인물' : (CLASS[title] || '세계설정');
  const era = ERA_OVERRIDE[title] || era0;
  const renamed = RENAME[`${proj}|${title}`];
  if (renamed) title = renamed;

  let body = normalize(raw);
  for (const [a, b] of (RECON[title] || [])) body = body.split(a).join(b);

  const outDir = join(ROOT, cat, era);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${title}.md`), `---\n분류: ${cat}\n시대: ${era}\n---\n\n${body}\n`);
  written++;
}

// Remove the old project folders (originals are backed up).
for (const p of [P1, P2]) rmSync(join(ROOT, p), { recursive: true, force: true });

console.log(`reorganized ${written} docs, dropped ${dropped} (mode/system/empty). old project folders removed.`);
