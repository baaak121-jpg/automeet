"use client";

import type { MeetingNote } from "@/lib/types";

interface NotesListProps {
  notes: MeetingNote[];
  selectedId: string | null;
  onSelect: (note: MeetingNote) => void;
  onDelete: (id: string) => void;
  onClearAll?: () => void;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function NotesList({ notes, selectedId, onSelect, onDelete, onClearAll }: NotesListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          회의록 ({notes.length})
        </h2>
        {onClearAll && notes.length > 0 && (
          <button
            onClick={() => { if (confirm("회의록 전체를 삭제하시겠습니까?")) onClearAll(); }}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* 빈 상태 */}
      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">저장된 회의록이 없습니다</p>
          <p className="text-xs text-zinc-600 mt-1">녹음 후 중지하면 자동 저장됩니다</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {notes.map((note) => {
            const isSelected = selectedId === note.id;
            return (
              <li key={note.id}>
                <div
                  onClick={() => onSelect(note)}
                  className={`
                    group relative rounded-lg px-3 py-2.5 cursor-pointer transition-all
                    ${isSelected
                      ? "bg-zinc-700 border border-zinc-600"
                      : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
                    }
                  `}
                >
                  <p className={`text-sm font-medium truncate pr-6 ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                    {note.summary.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-zinc-500">{formatDate(note.createdAt)}</span>
                    <span className="text-xs text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{formatDuration(note.durationSec)}</span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600 text-zinc-400 hover:text-red-400"
                    title="삭제"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
