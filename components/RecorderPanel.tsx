"use client";

import type { UIState } from "@/lib/types";
import { STATE_LABELS } from "@/lib/types";

interface RecorderPanelProps {
  uiState: UIState;
  timerSec: number;
  errorMsg: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const STATE_DARK_COLORS: Record<UIState, string> = {
  idle:        "bg-zinc-800 text-zinc-400",
  recording:   "bg-red-500/20 text-red-400 border border-red-500/30",
  paused:      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  transcribing:"bg-blue-500/20 text-blue-400 border border-blue-500/30",
  summarizing: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  done:        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  error:       "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function RecorderPanel({
  uiState, timerSec, errorMsg,
  onStart, onPause, onResume, onStop,
}: RecorderPanelProps) {
  const isIdle       = uiState === "idle" || uiState === "done" || uiState === "error";
  const isRecording  = uiState === "recording";
  const isPaused     = uiState === "paused";
  const isProcessing = uiState === "transcribing" || uiState === "summarizing";

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-6">

      {/* 상태 배지 */}
      <div className="flex items-center gap-2">
        {isRecording && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${STATE_DARK_COLORS[uiState]}`}>
          {STATE_LABELS[uiState]}
        </span>
      </div>

      {/* 타이머 — 모바일에서 크게 */}
      <div className="font-mono text-6xl sm:text-7xl font-thin text-zinc-100 tracking-widest tabular-nums select-none">
        {formatTime(timerSec)}
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-xs text-center leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* 처리 중 */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <svg className="animate-spin h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {uiState === "transcribing" ? "음성 변환 중..." : "회의록 요약 중..."}
        </div>
      )}

      {/* 버튼 그룹 — 모바일 터치 최적화 (min 44px) */}
      <div className="flex items-center gap-3 w-full max-w-sm sm:max-w-md sm:w-auto">

        {/* 녹음 시작 */}
        <button
          onClick={onStart}
          disabled={!isIdle}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2
            px-5 h-12 sm:h-11 rounded-xl text-sm font-medium transition-all
            ${isIdle
              ? "bg-red-500 hover:bg-red-400 active:bg-red-600 active:scale-95 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-current flex-shrink-0" />
          <span>녹음 시작</span>
        </button>

        {/* 일시정지 / 재개 */}
        <button
          onClick={isPaused ? onResume : onPause}
          disabled={!isRecording && !isPaused}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2
            px-5 h-12 sm:h-11 rounded-xl text-sm font-medium transition-all
            ${(isRecording || isPaused)
              ? "bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 active:scale-95 text-zinc-100"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          {isPaused ? (
            <>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              <span>재개</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>일시정지</span>
            </>
          )}
        </button>

        {/* 중지 */}
        <button
          onClick={onStop}
          disabled={!isRecording && !isPaused}
          className={`
            flex-1 sm:flex-none flex items-center justify-center gap-2
            px-5 h-12 sm:h-11 rounded-xl text-sm font-medium transition-all
            ${(isRecording || isPaused)
              ? "bg-zinc-100 hover:bg-white active:bg-zinc-200 active:scale-95 text-zinc-900"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
          <span>중지</span>
        </button>

      </div>
    </div>
  );
}
