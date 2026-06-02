// ============================================================
// Knowledge OS — Seed data (AI/ML research notes)
// Used once to populate the local store on first run.
// `ago` = minutes before first-launch, turned into a real timestamp.
// ============================================================

export const SEED_DOCS = [
  {
    id: 'd-transformer', title: 'Attention Is All You Need',
    tags: ['transformer', 'attention', 'seq2seq'], ago: 2, ai: true, starred: true,
    content: `# Attention Is All You Need

Transformer는 순환과 합성곱을 완전히 제거하고 **오직 어텐션**만으로 시퀀스를 모델링한다. 이는 병렬화를 가능케 하여 학습 속도를 크게 높인다.

## Self-Attention

각 토큰은 Query·Key·Value로 투영되며, 어텐션 가중치는 \`softmax(QKᵀ/√dₖ)V\` 로 계산된다. 자세한 유도는 [[Self-Attention Mechanism]] 참고.

## Multi-Head Attention

- 서로 다른 표현 부분공간을 병렬로 학습
- 각 헤드는 독립적인 Q/K/V 투영을 가짐

관련 문서: [[LLM Scaling Laws 정리]], [[Mixture of Experts 아키텍처]]`,
  },
  {
    id: 'd-attention', title: 'Self-Attention Mechanism',
    tags: ['attention', 'transformer'], ago: 14, ai: true,
    content: `# Self-Attention Mechanism

scaled dot-product attention: \`softmax(QKᵀ/√dₖ)V\`. 스케일링 인자 √dₖ 는 내적이 커질 때 softmax 기울기가 소실되는 것을 막는다.

## 멀티헤드

멀티헤드는 서로 다른 표현 부분공간을 병렬로 학습한다. 상위 개념은 [[Attention Is All You Need]] 에 정리되어 있다.`,
  },
  {
    id: 'd-llm', title: 'LLM Scaling Laws 정리',
    tags: ['llm', 'scaling', 'training'], ago: 60, ai: true,
    content: `# LLM Scaling Laws 정리

**Chinchilla**: 컴퓨트 최적 학습은 모델 크기와 토큰 수를 동등하게 스케일링한다. 파라미터당 약 20 토큰이 권장된다.

## 시사점

- 데이터가 부족하면 큰 모델은 과소학습된다
- 추론 비용까지 고려하면 더 작은 모델 + 더 많은 토큰이 유리

연결: [[LoRA & QLoRA 파인튜닝 노트]], [[양자화 — GPTQ, AWQ, GGUF]]`,
  },
  {
    id: 'd-rag', title: 'RAG 파이프라인 설계',
    tags: ['rag', 'retrieval', 'vector-db'], ago: 1440, draft: true,
    content: `# RAG 파이프라인 설계

문서 → Chunk → Embedding → Vector DB → 검색 → LLM. 청크 크기와 오버랩이 검색 품질을 좌우한다.

## 체크리스트

- 청크 256~512 토큰, 오버랩 10~20%
- 메타데이터 필터링으로 정밀도 향상
- 재순위(rerank)로 상위 결과 품질 보강

참고: [[Vector DB 비교 — Qdrant vs Chroma]], [[Embedding 모델 선택 가이드]]`,
  },
  {
    id: 'd-vectordb', title: 'Vector DB 비교 — Qdrant vs Chroma',
    tags: ['vector-db', 'rag', 'infra'], ago: 1500,
    content: `# Vector DB 비교 — Qdrant vs Chroma

**Qdrant**: Rust 기반, 필터링 강점, 프로덕션 적합. **Chroma**: 빠른 프로토타이핑에 적합.

## HNSW 파라미터

- \`m\`: 그래프 연결 수 — 정확도/메모리 트레이드오프
- \`ef_construct\`: 색인 품질
- \`ef\`: 검색 시 후보 폭

상위 설계는 [[RAG 파이프라인 설계]] 참고.`,
  },
  {
    id: 'd-embedding', title: 'Embedding 모델 선택 가이드',
    tags: ['embedding', 'rag', 'vector-db'], ago: 2880, ai: true,
    content: `# Embedding 모델 선택 가이드

검색용 임베딩은 대칭/비대칭 태스크를 구분해야 한다. MTEB 벤치마크와 차원 수 트레이드오프를 함께 고려한다.

## 선택 기준

- 다국어 지원 여부
- 차원 수(저장/속도) vs 품질
- 정규화 및 거리 척도(cosine)

관련: [[RAG 파이프라인 설계]]`,
  },
  {
    id: 'd-finetune', title: 'LoRA & QLoRA 파인튜닝 노트',
    tags: ['fine-tuning', 'llm', 'training'], ago: 4320,
    content: `# LoRA & QLoRA 파인튜닝 노트

저랭크 어댑터로 파라미터의 1% 미만만 학습한다. **QLoRA**는 4-bit 양자화로 단일 GPU 학습을 가능케 한다.

## 핵심 하이퍼파라미터

- rank \`r\`, \`alpha\`, dropout
- 타깃 모듈(q_proj, v_proj …)

연결: [[양자화 — GPTQ, AWQ, GGUF]], [[LLM Scaling Laws 정리]]`,
  },
  {
    id: 'd-agent', title: 'Agent Workflow & Tool Use',
    tags: ['agent', 'workflow', 'llm'], ago: 5760, ai: true,
    content: `# Agent Workflow & Tool Use

**ReAct**: 추론과 행동을 교차한다. 도구 호출 → 관찰 → 반성의 루프. 플래닝과 메모리가 신뢰성의 핵심이다.

## 구성 요소

- 도구 스키마 정의
- 관찰 결과의 컨텍스트 주입
- 종료 조건과 가드레일

관련: [[Prompt Engineering 패턴]], [[RAG 파이프라인 설계]]`,
  },
  {
    id: 'd-eval', title: 'LLM 평가 방법론',
    tags: ['evaluation', 'llm'], ago: 7200,
    content: `# LLM 평가 방법론

LLM-as-judge, 휴먼 평가, 자동 메트릭의 상관관계를 본다. 벤치마크 오염과 일반화 측정의 어려움이 핵심 난점이다.

## 실무 팁

- 고정 평가셋 + 회귀 추적
- 페어와이즈 비교가 절대 점수보다 안정적

관련: [[Prompt Engineering 패턴]]`,
  },
  {
    id: 'd-quant', title: '양자화 — GPTQ, AWQ, GGUF',
    tags: ['quantization', 'infra', 'llm'], ago: 8640,
    content: `# 양자화 — GPTQ, AWQ, GGUF

가중치 양자화로 메모리·지연 시간을 절감한다. 4-bit에서도 perplexity 손실을 최소화하는 보정 기법이 관건이다.

## 포맷

- **GPTQ**: 사후 양자화, GPU 추론
- **AWQ**: 활성화 인지 가중치 양자화
- **GGUF**: CPU/llama.cpp 친화

연결: [[LoRA & QLoRA 파인튜닝 노트]]`,
  },
  {
    id: 'd-prompt', title: 'Prompt Engineering 패턴',
    tags: ['prompting', 'llm', 'agent'], ago: 10080, draft: true,
    content: `# Prompt Engineering 패턴

Few-shot, CoT, self-consistency. 구조화된 출력과 제약 디코딩으로 신뢰성을 높인다.

## 패턴 모음

- 역할 지정 + 출력 스키마
- 단계적 사고(CoT) 유도
- 다중 샘플 투표(self-consistency)

관련: [[Agent Workflow & Tool Use]], [[LLM 평가 방법론]]`,
  },
  {
    id: 'd-moe', title: 'Mixture of Experts 아키텍처',
    tags: ['moe', 'transformer', 'scaling'], ago: 10080, ai: true,
    content: `# Mixture of Experts 아키텍처

희소 활성화로 파라미터를 키우되 연산은 일정하게 유지한다. 라우팅과 로드 밸런싱이 학습 안정성을 좌우한다.

## 핵심

- top-k 라우팅
- 보조 손실로 전문가 균형 유지

상위 개념: [[Attention Is All You Need]], [[LLM Scaling Laws 정리]]`,
  },
];

// Graph edges (source -> target, weight 1..3) — seed for the Knowledge Graph view.
export const EDGES = [
  ['d-transformer', 'd-attention', 3], ['d-transformer', 'd-llm', 2], ['d-transformer', 'd-moe', 2],
  ['d-attention', 'd-llm', 1], ['d-llm', 'd-finetune', 2], ['d-llm', 'd-eval', 2], ['d-llm', 'd-quant', 1],
  ['d-llm', 'd-scaling', 1], ['d-rag', 'd-vectordb', 3], ['d-rag', 'd-embedding', 3], ['d-rag', 'd-agent', 1],
  ['d-vectordb', 'd-embedding', 2], ['d-embedding', 'd-llm', 1], ['d-finetune', 'd-quant', 2],
  ['d-agent', 'd-prompt', 2], ['d-agent', 'd-llm', 2], ['d-prompt', 'd-eval', 1], ['d-moe', 'd-llm', 2],
  ['d-prompt', 'd-finetune', 1], ['d-agent', 'd-rag', 2],
];

export const ACTIVITY = [
  { type: 'ai', icon: 'sparkles', text: 'AI가 <b>RAG 파이프라인 설계</b>에 3개 태그를 생성했습니다', meta: 'rag · retrieval · vector-db', time: '2분 전' },
  { type: 'link', icon: 'link', text: '<b>Attention</b> ↔ <b>Mixture of Experts</b> 연결이 추천되었습니다', meta: '연결 강도 0.82', time: '18분 전' },
  { type: 'doc', icon: 'doc', text: '<b>LLM Scaling Laws 정리</b> 문서를 편집했습니다', meta: '+412 단어', time: '1시간 전' },
  { type: 'ai', icon: 'sparkles', text: 'AI 요약이 <b>Vector DB 비교</b>에 추가되었습니다', meta: 'Gemini Flash', time: '어제' },
  { type: 'workflow', icon: 'workflow', text: '워크플로우 <b>On Document Created</b>가 실행되었습니다', meta: '4 actions · 성공', time: '어제' },
];

export const WORKFLOW_RUNS = [
  { name: 'Auto-organize new docs', trigger: 'DocumentCreated', actions: 4, status: 'success', last: '2분 전', runs: 142 },
  { name: 'Daily research digest', trigger: 'DailySchedule', actions: 3, status: 'success', last: '오늘 09:00', runs: 38 },
  { name: 'Paper → Summary + Tags', trigger: 'TagAdded', actions: 5, status: 'running', last: '실행 중', runs: 67 },
  { name: 'Git sync on update', trigger: 'DocumentUpdated', actions: 2, status: 'idle', last: '1시간 전', runs: 512 },
];

// Vanity stats. Documents + Tags are recomputed live from the store; the
// rest stay as seed numbers (those subsystems arrive in later phases).
export const STATS = [
  { key: 'documents', label: 'Documents', value: '248', delta: '+12', icon: 'doc' },
  { key: 'connections', label: 'Connections', value: '1,204', delta: '+47', icon: 'link' },
  { key: 'ai', label: 'AI Actions', value: '3,891', delta: '+218', icon: 'sparkles' },
  { key: 'tags', label: 'Tags', value: '86', delta: '+5', icon: 'hash' },
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
