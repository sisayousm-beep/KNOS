// ============================================================
// LOGIA — Worldbuilding importer (graph-connected)
// Scans ../../세계관 (local only, gitignored) and emits
// src/seed-worldbuilding.local.js — not a flat dump but a connected
// world:
//   • 폴더 layout      → tags [project, category]
//   • [[NN_제목]] 링크 → [[제목]] 으로 정규화 (접두번호 제거 → store 가 해석)
//   • 허브 문서 생성    → 기존 [[... 허브]] 링크(~98개)를 살려 그래프 중심 형성
//   • 연표 브릿지 문서  → 혼돈 무림(578~607) ↔ 약 800년 후 천마 환생 을 연결
//   • 제외             → 에셋/에셋 프롬(성인), '모드' 파일, 빈 파일
//
// Run:  node scripts/import-worldbuilding.mjs
// ============================================================
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '세계관');
const OUT = join(__dirname, '..', 'src', 'seed-worldbuilding.local.js');

const SKIP_DIRS = new Set(['에셋', '에셋 프롬']); // adult asset prompts

// project (cleaned top-folder name) → labels + hub titles per top-category.
const PROJECT_META = {
  '천마가 환생한 곳은 마교의 삼공녀': {
    short: '천마 환생',
    hub: '천마가 환생한 곳은 마교의 삼공녀',
    sub: { '로어북': '천마 환생 로어북 허브', '캐릭터 프롬': '천마 환생 캐릭터 허브' },
  },
  '혼돈 무림의 회귀자': {
    short: '혼돈 무림',
    hub: '혼돈 무림 허브',
    sub: { '로어북': '혼돈 무림 로어북 허브', '캐릭터': '혼돈 무림 캐릭터 허브' },
  },
};
const BRIDGE = '무림 연대기 — 두 세계의 연결';

// Strip a leading "01_" / "201_" / "01." numeric prefix (separator required) and ".md".
const clean = (s) => s.replace(/\.md$/i, '').replace(/^\d+[_.]\s*/, '').trim();
// Inside content: [[10_신물]] → [[신물]] so links match cleaned titles.
const fixLinks = (md) => md.replace(/\[\[\s*\d+[_.]\s*([^\]]+?)\s*\]\]/g, '[[$1]]');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, acc);
    } else if (name.toLowerCase().endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

const files = walk(ROOT);
const docs = [];
const hubMembers = {}; // hubTitle → [memberTitle]
let skippedEmpty = 0, skippedMode = 0;
let ago = 100;

files.forEach((full) => {
  const raw = readFileSync(full, 'utf8').trim();
  if (!raw) { skippedEmpty += 1; return; }

  const rel = relative(ROOT, full);
  const parts = rel.split(/[\\/]/);
  const project = clean(parts[0]);
  const meta = PROJECT_META[project];
  // top category = the folder directly under the project ('개요' for root files).
  const category = parts.length > 2 ? clean(parts[1]) : '개요';
  let title = clean(basename(full));

  if (/모드/.test(title)) { skippedMode += 1; return; } // drop AI roleplay modes

  // Root-level prompt docs collide across projects (세계관 프롬, 시스템 프롬) → qualify.
  if (category === '개요') title = `${title} (${meta ? meta.short : project})`;

  // Assign to a category hub and record membership (for the hub's link list).
  const hubTitle = meta?.sub[category];
  if (hubTitle) (hubMembers[hubTitle] ||= []).push(title);

  docs.push({
    id: `wb-${String(docs.length + 1).padStart(3, '0')}`,
    title,
    tags: [project, category],
    ago: ago++,
    content: fixLinks(raw),
  });
});

// ---- Generated hub documents --------------------------------------------
function hubDoc(id, title, project, intro, members) {
  const list = members.length ? '\n\n## 문서\n' + members.map((t) => `- [[${t}]]`).join('\n') : '';
  return { id, title, tags: [project, '허브'], ago: 10, content: `# ${title}\n\n${intro}${list}` };
}

const hubDocs = [];
for (const [project, meta] of Object.entries(PROJECT_META)) {
  // category sub-hubs (캐릭터 / 로어북)
  for (const [cat, hubTitle] of Object.entries(meta.sub)) {
    hubDocs.push(hubDoc(
      `hub-${hubDocs.length + 1}`, hubTitle, project,
      `**${project}** 의 ${cat} 색인. 아래 문서들이 이 허브로 모입니다.`,
      (hubMembers[hubTitle] || []).sort(),
    ));
  }
  // project hub
  const subLinks = Object.values(meta.sub).map((h) => `- [[${h}]]`).join('\n');
  hubDocs.push({
    id: `hub-${hubDocs.length + 1}`, title: meta.hub, tags: [project, '허브'], ago: 5,
    content: `# ${meta.hub}\n\n**${project}** 세계의 중심 허브.\n\n## 색인\n${subLinks}\n- [[세계관 프롬 (${meta.short})]]\n- [[시스템 프롬 (${meta.short})]]\n\n## 세계 연결\n- [[${BRIDGE}]]`,
  });
}

// ---- Generated timeline bridge (the 800-year link) ----------------------
const bridgeDoc = {
  id: 'wb-bridge', title: BRIDGE, tags: ['연대기', '세계 연결'], ago: 0,
  content: `# ${BRIDGE}

두 세계관은 별개가 아니라 **하나의 무림사**다. [[혼돈 무림 허브]] 의 시대가 먼저고, **약 800년 뒤**가 [[천마가 환생한 곳은 마교의 삼공녀]] 의 시대다.

\`\`\`
혼돈 무림의 회귀자   578년 ─── 607년
                              │  약 800년
천마가 환생한 …          1361년(정마대전) ─── 1458년(혈마 재림)
\`\`\`

## 같은 존재, 두 시대
- **초대 무림맹주 = 임서하** — [[혼돈 무림 허브]] 의 [[임서하]] 가 600년 무림맹을 세우고 혈교를 멸했다. 800년 뒤 천마 환생 시대에는 [[초대 무림맹주]] 로 전해진다.
- **초대 천마 = 천시연 / 마신** — [[천시연]] 이 607년 [[무림 3대 무공]] 의 천마공을 창시하고 마신·천마가 되어 **천마신교(마교)** 를 세웠다. 그가 천마 환생 시대 [[마신]] 의 원형이다.
- **혈마 = 혈련화** — [[혈련화]] 는 혼돈 무림에서 605년 초대 무림맹주에게 죽지만, 천마 환생 시대 [[1458년]] 에 [[혈마]] 로 재림한다. 같은 [[혈교]] 다.

## 사건의 메아리
- [[정마전쟁]] 의 뿌리는 천시연이 세운 마교와 임서하의 무림맹이 갈라선 607년의 혈투에 있다.
- 800년의 시간이 인물을 전설로, 전설을 제도로 바꾸었다. 회귀자의 강호가 곧 삼공녀가 태어난 무림의 먼 과거다.

> 두 허브: [[혼돈 무림 허브]] · [[천마가 환생한 곳은 마교의 삼공녀]]`,
};

const all = [bridgeDoc, ...hubDocs, ...docs];

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  '// AUTO-GENERATED by scripts/import-worldbuilding.mjs — do not edit.\n' +
  '// Source: 세계관/ (local only, gitignored). Adult asset prompts + 모드 excluded.\n' +
  `export const WORLDBUILDING_DOCS = ${JSON.stringify(all, null, 2)};\n`,
);

console.log(`imported ${docs.length} docs + ${hubDocs.length} hubs + 1 bridge = ${all.length}`);
console.log(`skipped: ${skippedEmpty} empty, ${skippedMode} mode`);
