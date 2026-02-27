# AutoMeet — AI 회의록 자동 생성

녹음 → 중지 → 자동 전사/요약 → 로컬 IndexedDB 누적 저장

---

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.local.example .env.local
# .env.local을 에디터로 열어 필요한 값 설정
```

### 3-A. Mock 모드 (API 키 없이 즉시 테스트)
```bash
# .env.local: MEETING_PROVIDER=mock (기본값)
npm run dev
# → http://localhost:3000
```

> Mock 모드에서는 Netlify Function 없이 브라우저에서 직접 더미 결과를 반환합니다.  
> **주의**: `npm run dev`는 Mock 전용입니다. Gemini 실제 호출은 `netlify dev`를 사용하세요.

### 3-B. Gemini 실제 호출 (netlify dev)
```bash
# 1. .env.local 수정
MEETING_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Netlify CLI로 통합 실행 (프론트 + Functions 함께)
npm run dev:netlify
# → http://localhost:8888
```

---

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `MEETING_PROVIDER` | O | `mock` 또는 `gemini` (기본: `mock`) |
| `GEMINI_API_KEY` | gemini 시 필수 | [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급 |
| `GEMINI_MODEL` | 선택 | 기본값: `gemini-2.5-flash-lite-preview-04-17` |

> **보안**: `.env.local`은 `.gitignore`에 포함되어 있습니다. API 키를 절대 커밋하지 마세요.

---

## 아키텍처

```
브라우저
  └── useRecorder (MediaRecorder + WebAudio)
        └── stop 시 → requestMeetingNotes(audioBlob)
              └── POST /.netlify/functions/meeting-notes
                    └── providerFactory (MEETING_PROVIDER)
                          ├── MockProvider       (mock)
                          └── GeminiFlashLiteProvider (gemini)
                                └── @google/generative-ai
              └── 결과 → IndexedDB 저장 → UI 표시
```

### Provider 추가 방법 (예: OpenAI)
1. `lib/providers/openai.ts` 생성 → `MeetingNotesProvider` 인터페이스 구현
2. `lib/providers/index.ts` 팩토리에 `"openai"` 케이스 추가
3. `.env.local`에서 `MEETING_PROVIDER=openai` 설정

---

## 제한사항 (MVP)

| 항목 | 제한 |
|------|------|
| 오디오 최대 크기 | ~5.5MB (Netlify 6MB 제한) |
| 권장 녹음 시간 | 3분 이하 (WebM Opus ~32kbps 기준) |
| Netlify 함수 실행 시간 | 최대 26초 (무료 플랜) |

**긴 회의 지원이 필요한 경우**:
- Netlify Background Functions로 전환
- 청크 업로드 + 부분 전사 병합 방식 구현 (TODO 주석 참고)

---

## 파일 구조

```
automeet/
├── app/
│   └── page.tsx                    메인 단일 페이지
├── components/
│   ├── WaveformCanvas.tsx          우→좌 파형 시각화
│   ├── RecorderPanel.tsx           버튼/타이머/상태 배지
│   ├── NotesList.tsx               회의록 목록
│   └── NoteDetail.tsx              회의록 상세
├── lib/
│   ├── types.ts                    공통 UI 타입
│   ├── api/
│   │   └── meetingNotesClient.ts   프론트 API 클라이언트
│   ├── db/
│   │   └── indexedDb.ts            IndexedDB + localStorage 폴백
│   ├── hooks/
│   │   └── useRecorder.ts          MediaRecorder + WebAudio + 상태
│   ├── providers/
│   │   ├── types.ts                MeetingNotesProvider 인터페이스
│   │   ├── index.ts                providerFactory
│   │   ├── mock.ts                 Mock provider
│   │   └── geminiFlashLite.ts      Gemini 2.5 Flash Lite provider
│   └── prompts/
│       └── summary_ko.ts           한국어 요약 프롬프트
├── netlify/
│   └── functions/
│       └── meeting-notes.ts        Netlify Function (엔드포인트)
├── .env.local                      로컬 환경변수 (gitignore)
├── .env.local.example              환경변수 템플릿
└── netlify.toml                    Netlify 빌드/배포 설정
```

---

## Netlify 배포

1. GitHub에 push
2. Netlify에서 새 사이트 연결 → Build command: `npm run build`, Publish: `.next`
3. Netlify 대시보드 → Site settings → Environment variables에 추가:
   - `MEETING_PROVIDER=gemini`
   - `GEMINI_API_KEY=...`
4. `@netlify/plugin-nextjs` 플러그인 자동 적용 (netlify.toml에 설정됨)

---

## 타입 체크 / 빌드

```bash
npm run type-check   # TypeScript 타입 검사
npm run build        # Next.js 프로덕션 빌드
```
