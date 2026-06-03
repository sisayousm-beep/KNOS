// ============================================================
// Knowledge OS — Seed data
// The example/research dummy notes were removed. The real knowledge
// base is imported from 세계관/ (local only) by
// scripts/import-worldbuilding.mjs and merged in store.jsx.
// What remains here: the two in-app user manuals, the starter
// workflow definitions, and the navigation list.
// ============================================================

// ---- User manuals (seeded as real documents) -----------------------------
export const SEED_DOCS = [
  {
    id: 'guide-start', title: 'LOGIA 시작 가이드 (초보자용)',
    tags: ['LOGIA', '가이드'], ago: 1, starred: true,
    content: `# LOGIA 시작 가이드 (초보자용)

LOGIA는 문서를 쓰고, 서로 연결하고, AI로 검색·정리하는 개인 지식 운영체제(Knowledge OS)입니다. 더 깊은 내용은 [[LOGIA 심화 가이드 (고급)]] 를 보세요.

## 1. 화면 둘러보기
왼쪽 사이드바로 화면을 이동합니다. 숫자 키 \`1\`~\`7\` 로도 바로 이동돼요.
- **Dashboard** — 최근 문서, 통계, 활동 요약.
- **Document Editor** — 문서 작성·편집.
- **Knowledge Graph** — 문서 연결을 점과 선으로 시각화.
- **Search Center** — 제목·태그·본문 전체 검색.
- **AI Workspace** — 지식 베이스에 질문하기.
- **Workflow Builder** — 자동화 규칙.
- **Plugin Marketplace** — 기능 확장.

## 2. 첫 문서 만들기
1. 왼쪽 위 **New Document** 버튼(또는 \`Ctrl/⌘ + N\`).
2. 제목과 본문을 입력합니다. 본문은 **마크다운**을 지원해요 (\`# 제목\`, \`- 목록\`, \`**굵게**\`).
3. 저장은 자동입니다. 새로고침해도 내용이 남습니다.

## 3. 문서 연결하기 — [[위키링크]]
본문에 \`[[문서 제목]]\` 형식으로 쓰면 그 문서로 가는 링크가 됩니다.
- 연결된 상대 문서에는 **백링크**(나를 가리키는 문서 목록)가 자동으로 생깁니다.
- 이 연결들이 모여 **Knowledge Graph** 가 됩니다. 많이 연결할수록 그래프가 풍부해져요.

## 4. 검색
**Search Center** 에서 제목·태그·본문을 한 번에 찾습니다. 아무 화면에서나 \`Ctrl/⌘ + K\` 를 누르면 빠른 명령 팔레트가 열립니다.

## 5. AI 기능
**AI Workspace** 에서 "벡터 DB 관련 내용 정리해줘" 처럼 질문하면 문서들을 종합해 답합니다. 편집기 안에서는 **AI 요약**·**AI 태그** 버튼도 쓸 수 있어요.
- **API 키 없이도** 동작합니다(로컬 휴리스틱 모드). 더 똑똑한 답을 원하면 Gemini 키를 넣으세요(아래 설정).

## 6. 설정은 어디에?
오른쪽 위 **톱니바퀴(⚙) 아이콘**을 누르면 설정 패널이 (화면 우하단에) 열립니다.
- 테마(다크/라이트), 강조색, 대시보드/그래프 표시 방식.
- **AI · Gemini** 항목에 API 키를 넣고 *검증* 을 누르면 Gemini Flash 가 켜집니다.

## 7. 다음 단계
- 워크플로우로 "새 문서가 생기면 자동 요약" 같은 자동화를 만들 수 있어요.
- 플러그인으로 기능을 확장할 수 있어요.
- 자세한 원리는 [[LOGIA 심화 가이드 (고급)]] 에 있습니다.`,
  },
  {
    id: 'guide-advanced', title: 'LOGIA 심화 가이드 (고급)',
    tags: ['LOGIA', '가이드'], ago: 2,
    content: `# LOGIA 심화 가이드 (고급)

[[LOGIA 시작 가이드 (초보자용)]] 의 기본기를 마쳤다면, 여기서 내부 동작을 설명합니다.

## 1. 아키텍처
- **Tauri v2 + React 18 + Vite**. 네이티브 WebView2 위에서 도는 데스크톱 앱(웹/Electron 아님).
- 저장은 전부 **localStorage**. 외부 서버·DB 없음. 주요 키:
  - \`logia.docs.v2\` — 문서, \`logia.tweaks.v1\` — 설정.
  - \`logia.rag.v1\` — 벡터 인덱스, \`logia.gemini.key\` — API 키.
  - \`logia.workflows.v1\` / \`logia.workflow.runs.v1\` — 워크플로우·실행로그.
  - \`logia.plugins.v1\` / \`logia.plugin.activity.v1\` — 플러그인 상태·훅 로그.

## 2. AI 계층 (하이브리드)
\`src/ai.js\` 가 요약·태그·질문응답을 담당합니다.
- Gemini 키가 있으면 **Gemini Flash**(\`gemini-2.0-flash\` REST) 호출.
- 없으면 **로컬 휴리스틱**(추출 요약·빈도 기반 태그·키워드 검색)으로 폴백 — 오프라인에서도 동작.

## 3. RAG (검색 증강)
\`src/rag.js\` — 외부 벡터 DB 없이 로컬에서 동작합니다.
- 문서를 ~400자 **청크**로 분할.
- **임베딩**: 키가 있으면 Gemini \`text-embedding-004\`, 없으면 로컬 해시 TF(256차원).
- **코사인 벡터 검색** 으로 관련 청크 retrieval → 그 컨텍스트로 답변 생성.
- AI Workspace 의 **인덱스 빌드** 버튼으로 색인을 만듭니다. 인덱스가 없으면 키워드 검색으로 폴백.

## 4. 워크플로우 엔진 (트리거 → 액션)
\`src/workflow.jsx\` + \`src/engine.js\`.
- 트리거: \`DocumentCreated\` / \`DocumentUpdated\` / \`TagAdded\`(문서 변화 diff), \`DailySchedule\`(24h), \`Manual\`.
- 액션: \`Summarize\` / \`GenerateTag\` / \`CallAI\` / \`SendWebhook\` / \`RunScript\`.
- 액션이 문서를 수정해 트리거가 다시 도는 무한 루프는 **재진입 가드**(runningRef)로 차단합니다.
- 기본 제공 워크플로우는 \`enabled: false\` 상태 — 런치 시 예기치 않은 AI 호출이 없도록.

## 5. 플러그인 SDK (Hook · Sandbox · Store)
\`src/plugins.js\` + \`src/plugins.jsx\`.
- **훅 6종**: \`onDocumentCreated/Updated/Deleted\`, \`onTagAdded\`, \`onSearch\`, \`onAIResponse\`. 모듈 싱글톤 버스로 발생.
- **샌드박스**: 플러그인은 선언한 권한(\`docs:read\`/\`docs:write\`/\`ai\`/\`network\`)만 사용. 선언 안 한 호출은 차단되어 **Hook Activity** 로그에 '차단'으로 남습니다.
- **스토어**: 내장 플러그인을 설치/사용/중지하고, '샌드박스 점검'으로 권한을 확인합니다. 상태는 localStorage 영속.

## 6. 데이터 출처
- 예시 더미 노트는 제거됨. 실제 지식 베이스는 \`세계관/\`(로컬 전용, git 미포함)에서 \`scripts/import-worldbuilding.mjs\` 로 임포트해 \`src/seed-worldbuilding.local.js\` 로 생성, 첫 실행 시 시드됩니다. 성인 에셋 프롬프트 폴더는 제외됩니다.
- 세계관을 바꿨으면 \`node scripts/import-worldbuilding.mjs\` 재실행 → 재빌드.

## 7. 빌드 함정 (이 머신 한정)
- 프로젝트 경로의 **한글(비-ASCII)** 때문에 \`vite build\` 의 네이티브 Rollup 렌더가 크래시함.
- 해결: 프론트엔드는 **ASCII 경로**(예: \`C:\\\\Temp\\\\kos\`)에서 \`vite build\` → \`dist\` 를 복사 → 한글 경로에서 \`npm run app:build\`(Rust/Tauri 단계는 한글 경로 OK).

## 8. 단축키
\`Ctrl/⌘ + K\` 명령 팔레트 · \`Ctrl/⌘ + N\` 새 문서 · \`1\`~\`7\` 화면 이동 · \`Esc\` 닫기.`,
  },
];

// ---- Phase 5 starter workflows (real, executable by the engine) ----------
// Seeded disabled so launching the app never fires AI calls unexpectedly;
// toggle one on, or use "지금 실행" to test against a chosen document.
export const SEED_WORKFLOWS = [
  {
    id: 'wf-organize', name: 'Auto-organize new docs', enabled: false, trigger: 'DocumentCreated',
    actions: [
      { id: 'wf-organize-a1', type: 'Summarize', config: {} },
      { id: 'wf-organize-a2', type: 'GenerateTag', config: {} },
    ],
    stats: { runs: 0, success: 0, lastRun: null },
  },
  {
    id: 'wf-ontag', name: 'Summarize on tag', enabled: false, trigger: 'TagAdded',
    actions: [{ id: 'wf-ontag-a1', type: 'Summarize', config: {} }],
    stats: { runs: 0, success: 0, lastRun: null },
  },
  {
    id: 'wf-digest', name: 'Daily research digest', enabled: false, trigger: 'DailySchedule',
    actions: [{ id: 'wf-digest-a1', type: 'CallAI', config: { prompt: '최근 작성한 문서들의 핵심을 한국어로 정리해줘.' } }],
    stats: { runs: 0, success: 0, lastRun: null },
  },
];

export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', kbd: '1' },
  { id: 'editor', label: 'Document Editor', icon: 'doc', kbd: '2' },
  { id: 'graph', label: 'Knowledge Graph', icon: 'graph', kbd: '3' },
  { id: 'search', label: 'Search Center', icon: 'search', kbd: '4' },
  { id: 'ai', label: 'AI Workspace', icon: 'sparkles', kbd: '5' },
  { id: 'workflow', label: 'Workflow Builder', icon: 'workflow', kbd: '6' },
  { id: 'plugins', label: 'Plugin Marketplace', icon: 'plugin', kbd: '7' },
];
