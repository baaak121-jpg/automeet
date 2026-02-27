// UI 상태 타입
export type UIState =
  | "idle"
  | "recording"
  | "paused"
  | "transcribing"
  | "summarizing"
  | "done"
  | "error";

// 전사 결과
export interface TranscriptResult {
  transcript: string;
}

// 요약 결과
export interface SummaryResult {
  title: string;
  bullets: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
}

// Mock/실제 API 공통 입력 타입
export interface TranscribeSummarizeInput {
  durationSec: number;
}

// Mock/실제 API 공통 출력 타입
export interface TranscribeSummarizeOutput {
  transcript: string;
  summary: SummaryResult;
}

// 회의록 DB 모델
export interface MeetingNote {
  id: string;
  createdAt: number;
  durationSec: number;
  transcript: string;
  summary: SummaryResult;
}

// 상태 배지 라벨 맵
export const STATE_LABELS: Record<UIState, string> = {
  idle: "대기 중",
  recording: "녹음 중",
  paused: "일시정지",
  transcribing: "전사 중",
  summarizing: "요약 중",
  done: "완료",
  error: "오류",
};

// 상태 배지 색상 맵 (다크 테마)
export const STATE_COLORS: Record<UIState, string> = {
  idle:        "bg-zinc-800 text-zinc-400",
  recording:   "bg-red-500/20 text-red-400 border border-red-500/30",
  paused:      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  transcribing:"bg-blue-500/20 text-blue-400 border border-blue-500/30",
  summarizing: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  done:        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  error:       "bg-red-500/20 text-red-400 border border-red-500/30",
};
