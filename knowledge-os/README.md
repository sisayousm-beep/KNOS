# LOGIA — Knowledge OS

개인용 Knowledge OS 데스크톱 앱. `설계도.json`(Knowledge OS 설계서)의 **Phase 1**(문서 편집기 · 저장 · 검색)을 실제 동작하도록 구현했고, 이후 단계(그래프 · AI · RAG · 워크플로우 · 플러그인)는 UI 프리뷰로 포함되어 있습니다.

- **프레임워크**: Tauri v2 (네이티브 WebView2) + React 18 + Vite
- **저장**: 로컬 영속성 (`localStorage`) — 문서가 재시작 후에도 유지됩니다
- **브랜드**: LOGIA (다크 테마, 퍼플 액센트)

---

## 지금 동작하는 것 (Phase 1)

- **문서 편집기**: 제목 · 태그 · 마크다운 본문, 자동 저장(autosave)
- **Write / Preview**: 마크다운 실시간 렌더링
- **검색**: 제목 · 태그 · 본문 전체 텍스트 검색
- **지식 링크**: `[[다른 문서]]` 위키링크 → 백링크 패널 + 클릭 이동
- **아웃라인**: 본문의 `#` 제목으로 목차 자동 생성
- **대시보드**: 최근 문서 · 실시간 문서/태그 통계

> Knowledge Graph · AI Workspace · Workflow · Plugins 화면은 설계서의 후속 Phase를 위한 시각 프리뷰입니다(아직 백엔드/AI 미연결).

---

## 실행 / 빌드

### 1) 의존성 설치
```powershell
npm install
```

### 2) 데스크톱 앱 개발 모드
```powershell
npm run app        # = tauri dev (네이티브 창으로 실행)
```
브라우저로 UI만 빠르게 보려면:
```powershell
npm run dev        # http://localhost:5173
```

### 3) 설치 파일(.exe) 빌드
Rust(cargo)가 필요합니다. **cargo 경로는 PATH 끝에 추가**하세요(앞에 추가하면 프론트엔드 빌드가 깨집니다 — 아래 참고):

```powershell
$env:Path = "$env:Path;$env:USERPROFILE\.cargo\bin"
npm run build      # 프론트엔드(dist) 먼저 빌드
npm run app:build  # Tauri가 dist를 묶어 설치파일 생성
```
결과물:
```
src-tauri\target\release\bundle\nsis\LOGIA_0.1.0_x64-setup.exe
```

---

## 빌드 관련 메모 (이 머신에서 겪은 이슈)

1. **`.cargo\bin`을 PATH 맨 앞에 두면** Vite 프로덕션 빌드가 네이티브 Rollup 단계에서 크래시(`0xC0000409`)합니다. → PATH **끝**에 추가하면 정상.
2. 같은 이유로 `tauri build`가 프론트엔드를 직접 빌드하면(=`beforeBuildCommand`) 크래시합니다. 그래서 `beforeBuildCommand`를 비워두고 **`npm run build`로 dist를 먼저 만든 뒤** `npm run app:build`를 실행합니다.
3. Vite의 `reportCompressedSize`(gzip 크기 출력)도 이 머신에서 Node를 크래시시켜 `vite.config.js`에서 꺼두었습니다(빌드 결과물에는 영향 없음).

## 프로젝트 구조
```
knowledge-os/
├─ index.html              # Vite 진입점
├─ vite.config.js
├─ src/
│  ├─ main.jsx             # React 부트스트랩 + DocsProvider
│  ├─ App.jsx              # 셸: 사이드바 · 탑바 · 커맨드팔레트 · 라우팅
│  ├─ store.jsx            # 문서 스토어(localStorage) — Phase 1 영속성
│  ├─ data.js              # 시드 문서 + 그래프/통계 시드
│  ├─ markdown.js          # 마크다운 렌더 + [[위키링크]] · 아웃라인 파싱
│  ├─ util.js              # 상대시간 · 발췌 · 단어수
│  ├─ tweaks.jsx           # 설정 패널(테마/액센트/밀도/그래프 레이아웃)
│  ├─ icons.jsx
│  ├─ styles/              # tokens.css · components.css · app.css
│  └─ views/               # Dashboard · Editor · Search · Graph · …
└─ src-tauri/              # Tauri(Rust) 데스크톱 셸
```
