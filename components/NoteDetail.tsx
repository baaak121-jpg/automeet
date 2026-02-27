"use client";

import { useState } from "react";
import type { MeetingNote } from "@/lib/types";

interface NoteDetailProps {
  note: MeetingNote;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", weekday: "short",
  }).format(new Date(ts));
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function Section({
  title,
  items,
  accent = "zinc",
}: {
  title: string;
  items: string[];
  accent?: "zinc" | "blue" | "emerald" | "violet" | "red";
}) {
  const styles = {
    zinc:    "bg-zinc-800 border-zinc-700 text-zinc-300",
    blue:    "bg-blue-500/10 border-blue-500/20 text-blue-300",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    violet:  "bg-violet-500/10 border-violet-500/20 text-violet-300",
    red:     "bg-red-500/10 border-red-500/20 text-red-300",
  };
  const dotStyles = {
    zinc:    "bg-zinc-500",
    blue:    "bg-blue-400",
    emerald: "bg-emerald-400",
    violet:  "bg-violet-400",
    red:     "bg-red-400",
  };

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <ul className={`rounded-lg border p-3 space-y-1.5 ${styles[accent]}`}>
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[accent]}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NoteDetail({ note, onClose, onDelete }: NoteDetailProps) {
  const { summary } = note;
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-800">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-zinc-100 leading-snug">
            {summary.title}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-zinc-500">{formatDate(note.createdAt)}</span>
            <span className="text-xs text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">녹음 {formatDuration(note.durationSec)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { if (confirm("이 회의록을 삭제하시겠습니까?")) onDelete(note.id); }}
            className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
            title="삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Section title="핵심 내용"  items={summary.bullets}     accent="zinc"    />
        <Section title="결정 사항"  items={summary.decisions}   accent="blue"    />
        <Section title="액션 아이템" items={summary.actionItems} accent="emerald" />
        <Section title="리스크 / 이슈" items={summary.risks}    accent="red"     />

        {/* 전사 원문 (접기/펼치기) */}
        <div>
          <button
            onClick={() => setTranscriptOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
              전사 원문
            </h3>
            <svg
              className={`w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-all ${transcriptOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {transcriptOpen && (
            <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {note.transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
