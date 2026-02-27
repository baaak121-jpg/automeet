/**
 * Mock 전사/요약 API
 * 나중에 fetch('/api/transcribe') 등 실제 API로 교체 가능하도록
 * 동일한 시그니처(TranscribeSummarizeInput → TranscribeSummarizeOutput)로 분리
 */
import type {
  TranscribeSummarizeInput,
  TranscribeSummarizeOutput,
} from "./types";

const MOCK_TRANSCRIPTS = [
  `안녕하세요, 오늘 회의를 시작하겠습니다. 첫 번째 안건은 Q2 마케팅 전략입니다. 
소셜 미디어 캠페인을 강화하고, 인플루언서 협업을 늘리는 방향으로 논의했습니다. 
예산은 전분기 대비 20% 증가가 필요하다는 의견이 있었습니다.
두 번째로 신규 기능 출시 일정을 검토했습니다. 개발팀에서는 3월 말 출시가 가능하다고 보고했으며,
QA 기간을 2주 확보하는 것이 중요하다는 점을 강조했습니다.
마지막으로 팀 워크숍 일정을 4월 첫째 주로 확정했습니다.`,

  `이번 주 스프린트 리뷰입니다. 완료된 태스크: 사용자 인증 모듈 개선, 대시보드 성능 최적화.
미완료 태스크: 알림 시스템 - 다음 스프린트로 이월. 
블로커: API 서버 레이턴시 이슈가 발견되었으며 인프라팀과 협의 중입니다.
다음 스프린트 목표는 모바일 앱 베타 출시 준비입니다.`,

  `제품 로드맵 회의입니다. 올해 상반기 핵심 목표는 MAU 50만 달성입니다.
신기능 우선순위: 1) AI 추천 기능 2) 다국어 지원 3) 오프라인 모드.
리소스 배분: 개발 70%, 디자인 20%, QA 10%.
경쟁사 분석 결과 차별화 포인트는 UX와 성능임을 재확인했습니다.`,
];

const MOCK_SUMMARIES = [
  {
    title: "Q2 마케팅 전략 및 제품 출시 계획 회의",
    bullets: [
      "소셜 미디어 캠페인 강화 및 인플루언서 협업 확대 방향으로 합의",
      "Q2 마케팅 예산 전분기 대비 20% 증액 검토 필요",
      "신규 기능 3월 말 출시 목표, QA 기간 2주 확보",
      "팀 워크숍 4월 첫째 주로 확정",
    ],
    decisions: [
      "인플루언서 협업 예산 증액 승인",
      "신규 기능 출시일 3월 31일로 잠정 확정",
      "팀 워크숍 날짜 4월 7일 확정",
    ],
    actionItems: [
      "마케팅팀: 인플루언서 후보 리스트 작성 (담당: 김OO, 기한: 2주 내)",
      "개발팀: 출시 전 체크리스트 공유 (담당: 이OO, 기한: 다음 주)",
      "HR팀: 워크숍 장소 예약 확인 (담당: 박OO, 기한: 이번 주)",
    ],
    risks: [
      "예산 증액이 승인되지 않을 경우 캠페인 규모 축소 필요",
      "3월 말 출시 시 QA 기간 부족으로 품질 이슈 발생 가능성",
    ],
  },
  {
    title: "주간 스프린트 리뷰 및 다음 스프린트 계획",
    bullets: [
      "사용자 인증 모듈 개선 및 대시보드 성능 최적화 완료",
      "알림 시스템 개발 다음 스프린트로 이월",
      "API 서버 레이턴시 이슈 인프라팀 협의 중",
      "다음 스프린트 목표: 모바일 앱 베타 출시 준비",
    ],
    decisions: [
      "알림 시스템 다음 스프린트 1순위로 배정",
      "API 레이턴시 이슈 인프라팀 전담 처리",
    ],
    actionItems: [
      "인프라팀: API 레이턴시 원인 분석 보고서 제출 (기한: 3일 내)",
      "개발팀: 모바일 앱 베타 테스터 모집 공고 준비",
    ],
    risks: [
      "API 레이턴시 이슈 미해결 시 모바일 앱 출시 일정 지연 가능",
    ],
  },
  {
    title: "2026 상반기 제품 로드맵 수립 회의",
    bullets: [
      "상반기 핵심 KPI: MAU 50만 달성",
      "신기능 우선순위: AI 추천 → 다국어 지원 → 오프라인 모드",
      "리소스 배분 개발 70% / 디자인 20% / QA 10% 확정",
      "경쟁사 대비 UX·성능 차별화 전략 유지",
    ],
    decisions: [
      "AI 추천 기능 Q1 개발 착수 확정",
      "다국어 지원 Q2로 배정",
      "리소스 배분 비율 확정",
    ],
    actionItems: [
      "PM: 로드맵 문서화 후 전사 공유 (기한: 이번 주 금요일)",
      "디자인팀: AI 추천 UI 시안 작성 착수",
    ],
    risks: [
      "AI 추천 기능 개발 지연 시 전체 로드맵 도미노 지연 위험",
      "경쟁사 유사 기능 선출시 시 차별화 전략 재검토 필요",
    ],
  },
];

let mockIndex = 0;

export async function mockTranscribeSummarize(
  input: TranscribeSummarizeInput
): Promise<TranscribeSummarizeOutput> {
  // 전사 시뮬레이션 (1초)
  await new Promise((res) => setTimeout(res, 1000));

  // 요약 시뮬레이션 (1초) - 호출 측에서 상태를 transcribing → summarizing으로 변경 후 재호출하지 않고
  // 여기서 총 2초 딜레이를 줌. 상태 전환은 훅에서 처리.
  await new Promise((res) => setTimeout(res, 1000));

  const idx = mockIndex % MOCK_SUMMARIES.length;
  mockIndex++;

  return {
    transcript: MOCK_TRANSCRIPTS[idx],
    summary: MOCK_SUMMARIES[idx],
  };
}

/**
 * TODO: 실제 백엔드 연동 시 아래처럼 교체
 *
 * export async function transcribeSummarize(
 *   input: TranscribeSummarizeInput
 * ): Promise<TranscribeSummarizeOutput> {
 *   const res = await fetch('/api/transcribe-summarize', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(input),
 *   });
 *   if (!res.ok) throw new Error('API 호출 실패');
 *   return res.json();
 * }
 */
