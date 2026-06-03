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

// Titles of the authored synthesis docs (the integration layer).
const SYN = {
  martial: '무공의 탄생 — 구무림에서 천마공까지',
  jeongma: '정마의 기원 — 임서하와 천시연',
  myth: '마교의 신화 — 천시연에서 천제령까지',
  blood: '혈교의 두 강림 — 혈련화와 혈마',
  law: '세계의 법칙 — 이치와 윤회',
};

// Connective passages woven into key documents (appended as "세계의 맥락").
// These tie each pivotal doc into the single, 800-year-spanning world.
const PATCHES = {
  '천제령': `- 그가 휘두르는 **천마검**·**사화지옥도**와 익힌 **천마공**은 모두 초대 천마 [[마신]]의 것이다. 800년 전 [[천시연]]이 남긴 무구와 무공을 그대로 잇는 적통이다. → [[${SYN.myth}]]
- 마교는 그를 "100년의 천재"라 부르지만, 그 위에는 본명조차 잊힌 시조 [[마신]]의 신화가 있다.
- 딸 [[월연우]]가 익히는 [[비정마공]] 또한 이 계보의 가지다.`,
  '마신': `- 마교에 본명이 남지 않은 이 시조의 진짜 이름은 **[[천시연]]** — 800년 전 [[혼돈 무림 허브]]의 붕교검대주였다. 감정을 느끼지 못한 채 다섯 이치를 모두 다룬 무재가, 607년 [[초대 무림맹주]]와의 혈투 끝에 천마공을 창시하며 마신이 되었다.
- 그가 연 '무공의 시대' 이전, 구무림은 오직 이치만 수련했다. → [[${SYN.martial}]]
- 현 마교주 [[천제령]]이 그의 천마검·사화지옥도·천마공을 잇는다. → [[${SYN.myth}]]`,
  '천시연': `- 훗날 그녀는 본명이 잊힌 채 **[[마신]]**, 초대 천마, 초대 마교주로 전해진다. 607년 [[초대 무림맹주]]([[임서하]])와의 일주일 혈투 중 천마공을 창시하며 **천마신교(마교)**를 연다. → [[${SYN.myth}]]
- 그가 창시한 천마공은 800년 뒤 [[천제령]]에게로 이어지고 [[무림 3대 무공]]의 하나로 남는다.
- 578년 [[혈마]]([[혈련화]])를 일방적으로 농락한 일화는 [[${SYN.blood}]]의 첫 장이다.`,
  '임서하': `- 무명의 유랑 무인이던 그녀는 600년 무림맹을 세워 **[[초대 무림맹주]]**가 되고 정파의 시조가 된다. → [[${SYN.jeongma}]]
- 605년경 [[혈마]]([[혈련화]])를 쓰러뜨려 [[혈교]]를 멸한 위업은 800년 뒤 [[정마전쟁]] 속 정파의 신화로 남는다.
- 607년 [[천시연]]([[마신]])과의 무승부가 정(正)과 마(魔)를 가른 분기점이다.`,
  '초대 무림맹주': `- 그 정체는 800년 전 [[혼돈 무림 허브]]의 독립 무인 **[[임서하]]**다. 유·환·기 세 이치를 다루던 이가 무림맹을 세우고 [[혈마]]를 멸한 뒤 정파의 시조로 전해졌다. → [[${SYN.jeongma}]]`,
  '혈마': `- 800년을 넘는 단 하나의 존재. [[혼돈 무림 허브]]에서도 같은 **[[혈련화]]**로, 516년부터 노화 없이 살아 578년 [[천시연]]([[마신]])에게 농락당하고 [[초대 무림맹주]]([[임서하]])에게 스러졌다. → [[${SYN.blood}]]
- [[1458년]]의 재림은 [[윤회 사상]]의 음계·[[암년]] 법칙으로 설명된다. → [[${SYN.law}]]`,
  '혈련화': `- 그녀가 곧 [[혈마]]다. 800년 뒤에도 같은 이름으로, [[1458년]] 반인반마로 재림해 다시 무림에 전쟁을 일으킨다. → [[${SYN.blood}]]`,
  '비정마공': `- 2대 천마가 창안했으나, 그 뿌리는 초대 천마 [[마신]]([[천시연]])이 연 천마공의 계보에 있다. → [[${SYN.martial}]]
- 마교주 직계 [[천제령]]·[[월연우]]로 이어지는 적통의 무공이다.`,
  '무림 3대 무공': `- 천마공은 607년 [[천시연]]([[마신]])이 [[초대 무림맹주]]와의 혈투 한복판에서 창시한 무공이다. 구무림을 끝낸 '무공의 시대'의 정점. → [[${SYN.martial}]]`,
  '혼란의 시대': `- 이 시대를 끝낸 것이 [[천시연]]([[마신]])이다. 오직 이치만 있던 구무림에서 천마공을 창시해 '무공의 시대'를 열었다. → [[${SYN.martial}]]
- 무림맹([[임서하]]) 설립 이전, 정·마의 구분조차 없던 시대. → [[${SYN.jeongma}]]`,
  '윤회 사상': `- 음계(내세)와 양계(속세), 그리고 [[암년]]에 위상이 같아질 때 강한 령이 건너온다는 이 법칙은, 800년 뒤 [[혈마]]([[혈련화]])가 [[1458년]] 재림하는 근거가 된다. → [[${SYN.law}]]`,
  '정마전쟁': `- 정과 마의 반목은 607년, [[임서하]]([[초대 무림맹주]])의 무림맹과 [[천시연]]([[마신]])의 마교가 갈라선 무승부에서 비롯됐다. → [[${SYN.jeongma}]]`,
};

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

  // Weave the connective passage into pivotal docs (the integration layer).
  let body = fixLinks(raw);
  if (PATCHES[title]) body += `\n\n## 세계의 맥락\n${PATCHES[title]}`;

  docs.push({
    id: `wb-${String(docs.length + 1).padStart(3, '0')}`,
    title,
    tags: [project, category],
    ago: ago++,
    content: body,
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

## 통합 문서
- [[${SYN.martial}]]
- [[${SYN.jeongma}]]
- [[${SYN.myth}]]
- [[${SYN.blood}]]
- [[${SYN.law}]]

> 두 허브: [[혼돈 무림 허브]] · [[천마가 환생한 곳은 마교의 삼공녀]]`,
};

// ---- Synthesis layer: authored docs that reorganize the two worlds into one.
const SYNTHESIS = [
  {
    id: 'syn-martial', title: SYN.martial, tags: ['통합 세계관', '무공'], ago: 3,
    content: `# ${SYN.martial}

> 통합 세계관 · [[${BRIDGE}]]

600년 이전 [[혼란의 시대]](구무림)에는 '무공'이라 부를 체계가 없었다. 사람들은 오직 다섯 이치(강·쾌·유·환·기)만을 수련했다. → [[${SYN.law}]]

## 최초의 창시자
[[혼돈 무림 허브]]의 붕교검대주 [[천시연]]은 다섯 이치를 모두 다룬 전무후무한 무재였다. 607년 [[초대 무림맹주]]([[임서하]])와의 일주일 혈투 중, 순수한 기교와 적응만으로 **천마공**을 창시한다. 무림 최초의 '무공'이었고, 그 순간 '무공의 시대'가 열렸다. 그는 이후 [[마신]]으로 전해진다.

## 갈라지는 계보
- 천마공 → 마교의 비전. 2대 천마의 [[비정마공]]으로 가지를 치고, 800년 뒤 [[천제령]]에게 이어진다.
- 소림의 나한진·무명의 환류검과 함께 후대의 [[무림 3대 무공]]을 이룬다.

> 모든 무공은 이 한 번의 깨달음에서 비롯됐다.`,
  },
  {
    id: 'syn-jeongma', title: SYN.jeongma, tags: ['통합 세계관', '정마'], ago: 4,
    content: `# ${SYN.jeongma}

> 통합 세계관 · [[${BRIDGE}]]

[[정마전쟁]]으로 굳어진 정(正)과 마(魔)의 반목에는 800년 전 두 사람이 있다.

## 임서하 — 정(正)의 씨앗
무명의 유랑 무인 [[임서하]]는 민초의 고통을 외면하지 못해 무림맹을 세우고 [[초대 무림맹주]]가 되었다. [[혈마]]를 멸하고 세운 질서가 정파의 시작이다.

## 천시연 — 마(魔)의 시조
감정을 느끼지 못한 채 강함만 좇은 [[천시연]]은 [[마신]]이 되어 천마신교(마교)를 열었다. → [[${SYN.myth}]]

## 갈림길 — 607년
둘의 일주일 혈투는 무승부였고, 임서하는 천시연에게 '마신·천마'의 칭호를 내렸다. 정과 마는 그렇게 한 전장에서 갈라졌고, 그 골은 800년 뒤 [[혼란의 시대]] 너머 [[정마전쟁]]으로 제도화된다.`,
  },
  {
    id: 'syn-myth', title: SYN.myth, tags: ['통합 세계관', '마교'], ago: 5,
    content: `# ${SYN.myth}

> 통합 세계관 · [[${BRIDGE}]]

마교가 떠받드는 시조 [[마신]]은 본명조차 잊힌 신화다. 그 진짜 이름은 [[천시연]] — 800년 전 [[혼돈 무림 허브]]의 붕교검대주였다.

## 시조
천시연은 607년 천마공을 창시하고 천마신교를 세워 초대 천마가 되었다. → [[${SYN.martial}]]

## 적통
- 현 마교주 [[천제령]]은 천시연과 **같은 무구**(천마검·사화지옥도)와 **같은 무공**(천마공)을 잇는다. 800년을 건넌 직접 계승이다.
- 마교주 직계의 [[비정마공]], 그리고 [[월연우]]를 비롯한 자제들이 이 핏줄의 가지다.

## 신화가 된 인간
마교는 천제령을 "100년의 천재"라 부르지만, 정작 그 위 시조는 감정도 이름도 잊힌 한 사람이었다. 전설은 사실을 흐리며 신화가 되었다.`,
  },
  {
    id: 'syn-blood', title: SYN.blood, tags: ['통합 세계관', '혈교'], ago: 6,
    content: `# ${SYN.blood}

> 통합 세계관 · [[${BRIDGE}]]

[[혈교]]의 교주 [[혈마]]는 단 하나의 존재, [[혈련화]]다. 800년을 사이에 두고 두 번 강림한다.

## 첫 강림 — 구무림
516년부터 노화 없이 살며 피와 전쟁을 갈망했다. 578년 [[천시연]]([[마신]])에게 일방적으로 농락당했고, [[초대 무림맹주]]([[임서하]])와의 전투 끝에 스러진다.

## 재림 — 1458년
잔당이 명맥을 잇다가, [[1458년]] 혈녀를 제물로 반인반마의 모습으로 부활시킨다. 이 부활은 [[윤회 사상]]의 음계와 [[암년]] 법칙으로 설명된다. → [[${SYN.law}]]

> 피로 세상을 씻으려는 의지는 800년을 건너 다시 무림을 덮친다.`,
  },
  {
    id: 'syn-law', title: SYN.law, tags: ['통합 세계관', '법칙'], ago: 7,
    content: `# ${SYN.law}

> 통합 세계관 · [[${BRIDGE}]]

두 시대를 관통하는 두 가지 근본 규칙.

## 다섯 이치
강(剛)·쾌(快)·유(流)·환(環)·기(氣). [[혼란의 시대]] 이래 무의 토대이며, [[천시연]]은 다섯을 모두 다룬 유일한 존재였다. → [[${SYN.martial}]]

## 윤회 — 음계와 양계
[[윤회 사상]]에 따르면 만물은 음계(내세)와 양계(속세)를 오간다. 보통은 건너올 수 없으나 [[암년]]에 두 위상이 같아지면 강한 령이 속세로 돌아온다. 이 법칙이 [[혈마]]의 [[1458년]] 재림을 가능케 한다. → [[${SYN.blood}]]`,
  },
];

const all = [bridgeDoc, ...SYNTHESIS, ...hubDocs, ...docs];

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  '// AUTO-GENERATED by scripts/import-worldbuilding.mjs — do not edit.\n' +
  '// Source: 세계관/ (local only, gitignored). Adult asset prompts + 모드 excluded.\n' +
  `export const WORLDBUILDING_DOCS = ${JSON.stringify(all, null, 2)};\n`,
);

console.log(`imported ${docs.length} docs + ${SYNTHESIS.length} synthesis + ${hubDocs.length} hubs + 1 bridge = ${all.length}`);
const patched = docs.filter((d) => d.content.includes('## 세계의 맥락')).length;
console.log(`patched ${patched} docs · skipped ${skippedEmpty} empty, ${skippedMode} mode`);
