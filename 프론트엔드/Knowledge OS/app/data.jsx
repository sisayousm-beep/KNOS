// ============================================================
// Knowledge OS — Mock data (AI/ML research notes)
// ============================================================

const DOCS = [
  { id: 'd-transformer', title: 'Attention Is All You Need', tag: 'transformer', tags:['transformer','attention','seq2seq'], links: 14, words: 2840, updated: '2분 전', updatedSort: 1, ai: true, starred: true,
    excerpt: 'Self-attention은 Query·Key·Value 투영의 가중합으로 시퀀스 내 모든 위치를 직접 연결한다. RNN의 순차 의존성을 제거하고 병렬화를 가능케 한다.' },
  { id: 'd-attention', title: 'Self-Attention Mechanism', tag: 'attention', tags:['attention','transformer'], links: 11, words: 1620, updated: '14분 전', updatedSort: 2, ai: true,
    excerpt: 'scaled dot-product attention: softmax(QKᵀ/√dₖ)V. 멀티헤드는 서로 다른 표현 부분공간을 병렬로 학습한다.' },
  { id: 'd-llm', title: 'LLM Scaling Laws 정리', tag: 'llm', tags:['llm','scaling','training'], links: 19, words: 3210, updated: '1시간 전', updatedSort: 3, ai: true,
    excerpt: 'Chinchilla: 컴퓨트 최적 학습은 모델 크기와 토큰 수를 동등하게 스케일링한다. 파라미터당 ~20 토큰.' },
  { id: 'd-rag', title: 'RAG 파이프라인 설계', tag: 'rag', tags:['rag','retrieval','vector-db'], links: 21, words: 2470, updated: '어제', updatedSort: 4, draft: true,
    excerpt: '문서 → Chunk → Embedding → Vector DB → 검색 → LLM. 청크 크기와 오버랩이 검색 품질을 좌우한다.' },
  { id: 'd-vectordb', title: 'Vector DB 비교 — Qdrant vs Chroma', tag: 'vector-db', tags:['vector-db','rag','infra'], links: 8, words: 1980, updated: '어제', updatedSort: 5,
    excerpt: 'Qdrant: Rust 기반, 필터링 강점, 프로덕션 적합. Chroma: 빠른 프로토타이핑. HNSW 인덱스 파라미터 비교.' },
  { id: 'd-embedding', title: 'Embedding 모델 선택 가이드', tag: 'embedding', tags:['embedding','rag','vector-db'], links: 13, words: 1740, updated: '2일 전', updatedSort: 6, ai: true,
    excerpt: '검색용 임베딩은 대칭/비대칭 태스크를 구분해야 한다. MTEB 벤치마크와 차원 수 트레이드오프.' },
  { id: 'd-finetune', title: 'LoRA & QLoRA 파인튜닝 노트', tag: 'fine-tuning', tags:['fine-tuning','llm','training'], links: 9, words: 2110, updated: '3일 전', updatedSort: 7,
    excerpt: '저랭크 어댑터로 파라미터의 1% 미만만 학습. QLoRA는 4-bit 양자화로 단일 GPU 학습을 가능케 한다.' },
  { id: 'd-agent', title: 'Agent Workflow & Tool Use', tag: 'agent', tags:['agent','workflow','llm'], links: 16, words: 2630, updated: '4일 전', updatedSort: 8, ai: true,
    excerpt: 'ReAct: 추론과 행동을 교차. 도구 호출, 관찰, 반성의 루프. 플래닝과 메모리가 신뢰성의 핵심.' },
  { id: 'd-eval', title: 'LLM 평가 방법론', tag: 'evaluation', tags:['evaluation','llm'], links: 7, words: 1450, updated: '5일 전', updatedSort: 9,
    excerpt: 'LLM-as-judge, 휴먼 평가, 자동 메트릭의 상관관계. 벤치마크 오염과 일반화 측정의 어려움.' },
  { id: 'd-quant', title: '양자화 — GPTQ, AWQ, GGUF', tag: 'quantization', tags:['quantization','infra','llm'], links: 6, words: 1290, updated: '6일 전', updatedSort: 10,
    excerpt: '가중치 양자화로 메모리·지연 시간 절감. 4-bit에서도 perplexity 손실 최소화하는 보정 기법.' },
  { id: 'd-prompt', title: 'Prompt Engineering 패턴', tag: 'prompting', tags:['prompting','llm','agent'], links: 12, words: 1880, updated: '1주 전', updatedSort: 11, draft: true,
    excerpt: 'Few-shot, CoT, self-consistency. 구조화된 출력과 제약 디코딩으로 신뢰성 향상.' },
  { id: 'd-moe', title: 'Mixture of Experts 아키텍처', tag: 'moe', tags:['moe','transformer','scaling'], links: 10, words: 2040, updated: '1주 전', updatedSort: 12, ai: true,
    excerpt: '희소 활성화로 파라미터를 키우되 연산은 일정하게. 라우팅과 로드 밸런싱이 학습 안정성을 좌우.' },
];

// Graph edges (source -> target, weight 1..3)
const EDGES = [
  ['d-transformer','d-attention',3],['d-transformer','d-llm',2],['d-transformer','d-moe',2],
  ['d-attention','d-llm',1],['d-llm','d-finetune',2],['d-llm','d-eval',2],['d-llm','d-quant',1],
  ['d-llm','d-scaling',1],['d-rag','d-vectordb',3],['d-rag','d-embedding',3],['d-rag','d-agent',1],
  ['d-vectordb','d-embedding',2],['d-embedding','d-llm',1],['d-finetune','d-quant',2],
  ['d-agent','d-prompt',2],['d-agent','d-llm',2],['d-prompt','d-eval',1],['d-moe','d-llm',2],
  ['d-prompt','d-finetune',1],['d-agent','d-rag',2],
];

const TAGS = [
  { name: 'transformer', count: 8, ai: false },
  { name: 'llm', count: 12, ai: false },
  { name: 'rag', count: 6, ai: true },
  { name: 'vector-db', count: 5, ai: true },
  { name: 'attention', count: 4, ai: false },
  { name: 'agent', count: 7, ai: true },
  { name: 'embedding', count: 5, ai: true },
  { name: 'fine-tuning', count: 4, ai: false },
];

const ACTIVITY = [
  { type:'ai', icon:'sparkles', text:'AI가 <b>RAG 파이프라인 설계</b>에 3개 태그를 생성했습니다', meta:'rag · retrieval · vector-db', time:'2분 전' },
  { type:'link', icon:'link', text:'<b>Attention</b> ↔ <b>Mixture of Experts</b> 연결이 추천되었습니다', meta:'연결 강도 0.82', time:'18분 전' },
  { type:'doc', icon:'doc', text:'<b>LLM Scaling Laws 정리</b> 문서를 편집했습니다', meta:'+412 단어', time:'1시간 전' },
  { type:'ai', icon:'sparkles', text:'AI 요약이 <b>Vector DB 비교</b>에 추가되었습니다', meta:'Gemini Flash', time:'어제' },
  { type:'workflow', icon:'workflow', text:'워크플로우 <b>On Document Created</b>가 실행되었습니다', meta:'4 actions · 성공', time:'어제' },
];

const WORKFLOW_RUNS = [
  { name:'Auto-organize new docs', trigger:'DocumentCreated', actions:4, status:'success', last:'2분 전', runs:142 },
  { name:'Daily research digest', trigger:'DailySchedule', actions:3, status:'success', last:'오늘 09:00', runs:38 },
  { name:'Paper → Summary + Tags', trigger:'TagAdded', actions:5, status:'running', last:'실행 중', runs:67 },
  { name:'Git sync on update', trigger:'DocumentUpdated', actions:2, status:'idle', last:'1시간 전', runs:512 },
];

const STATS = [
  { label:'Documents', value:'248', delta:'+12', icon:'doc' },
  { label:'Connections', value:'1,204', delta:'+47', icon:'link' },
  { label:'AI Actions', value:'3,891', delta:'+218', icon:'sparkles' },
  { label:'Tags', value:'86', delta:'+5', icon:'hash' },
];

const NAV = [
  { id:'dashboard', label:'Dashboard', icon:'home', kbd:'1' },
  { id:'editor', label:'Document Editor', icon:'doc', kbd:'2' },
  { id:'graph', label:'Knowledge Graph', icon:'graph', kbd:'3' },
  { id:'search', label:'Search Center', icon:'search', kbd:'4' },
  { id:'ai', label:'AI Workspace', icon:'sparkles', kbd:'5' },
  { id:'workflow', label:'Workflow Builder', icon:'workflow', kbd:'6' },
  { id:'plugins', label:'Plugin Marketplace', icon:'plugin', kbd:'7' },
];

Object.assign(window, { DOCS, EDGES, TAGS, ACTIVITY, WORKFLOW_RUNS, STATS, NAV });
