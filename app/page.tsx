"use client";

import { useState } from "react";
import { useRecorder } from "@/lib/hooks/useRecorder";
import WaveformCanvas from "@/components/WaveformCanvas";
import RecorderPanel from "@/components/RecorderPanel";
import NotesList from "@/components/NotesList";
import NoteDetail from "@/components/NoteDetail";

export default function Home() {
  const {
    uiState, timerSec, analyserNode,
    notes, selectedNote, errorMsg,
    startRecording, pauseRecording, resumeRecording, stopRecording,
    selectNote, removeNote, clearNotes,
  } = useRecorder();

  // 모바일: 회의록 목록 토글
  const [listOpen, setListOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* 헤더 */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 leading-none">AutoMeet</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">AI 회의록 자동 생성</p>
            </div>
          </div>

          {/* 모바일: 회의록 목록 토글 버튼 */}
          <button
            onClick={() => setListOpen((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium active:bg-zinc-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            회의록 {notes.length > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{notes.length}</span>}
          </button>
        </div>
      </header>

      {/* 모바일 회의록 서랍 */}
      {listOpen && (
        <div className="lg:hidden border-b border-zinc-800 bg-zinc-900 px-4 py-3 max-h-72 overflow-y-auto scroll-ios">
          <NotesList
            notes={notes}
            selectedId={selectedNote?.id ?? null}
            onSelect={(note) => { selectNote(note); setListOpen(false); }}
            onDelete={removeNote}
            onClearAll={clearNotes}
          />
        </div>
      )}

      {/* 본문 */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6">

        {/* 왼쪽(데스크톱) / 상단(모바일): 녹음 + 파형 + 회의록 상세 */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* 녹음 컨트롤 카드 */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 px-6 py-8 sm:p-8">
            <RecorderPanel
              uiState={uiState}
              timerSec={timerSec}
              errorMsg={errorMsg}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
            />
          </div>

          {/* 파형 캔버스 */}
          <WaveformCanvas analyserNode={analyserNode} uiState={uiState} />

          {/* 회의록 상세 */}
          {selectedNote && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 sm:p-5 flex flex-col">
              <NoteDetail
                note={selectedNote}
                onClose={() => selectNote(null)}
                onDelete={async (id) => { await removeNote(id); }}
              />
            </div>
          )}
        </div>

        {/* 오른쪽(데스크톱만): 회의록 리스트 */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 sticky top-20">
            <NotesList
              notes={notes}
              selectedId={selectedNote?.id ?? null}
              onSelect={selectNote}
              onDelete={removeNote}
              onClearAll={clearNotes}
            />
          </div>
        </div>

      </main>

      {/* 모바일 하단 여백 (홈 인디케이터) */}
      <div className="h-4 lg:hidden" />
    </div>
  );
}
