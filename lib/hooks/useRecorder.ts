"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { UIState, MeetingNote } from "../types";
import { requestMeetingNotes, ApiError } from "../api/meetingNotesClient";
import { saveNote, getAllNotes, deleteNote, clearAllNotes } from "../db/indexedDb";

export interface RecorderState {
  uiState: UIState;
  timerSec: number;
  analyserNode: AnalyserNode | null;
  notes: MeetingNote[];
  selectedNote: MeetingNote | null;
  errorMsg: string | null;
  currentResult: MeetingNote | null;
}

export interface RecorderActions {
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  selectNote: (note: MeetingNote | null) => void;
  removeNote: (id: string) => Promise<void>;
  clearNotes: () => Promise<void>;
}

export function useRecorder(): RecorderState & RecorderActions {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [timerSec, setTimerSec] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<MeetingNote | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerSecRef = useRef(0);
  const uiStateRef = useRef<UIState>("idle");

  // 오디오 청크 수집 버퍼 (stop 시 Blob으로 조합)
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  const setUiStateSync = useCallback((s: UIState) => {
    uiStateRef.current = s;
    setUiState(s);
  }, []);

  // DB 초기 목록 로드
  useEffect(() => {
    getAllNotes().then(setNotes).catch(console.error);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      timerSecRef.current += 1;
      setTimerSec(timerSecRef.current);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    pauseTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setAnalyserNode(null);
    mediaRecorderRef.current = null;
  }, [pauseTimer]);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    setCurrentResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API 분석기 설정
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // MediaRecorder 설정 (브라우저 지원 우선순위)
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      // 오디오 청크 수집
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // timeslice 250ms: 일시정지 중에도 데이터 수집 유지
      recorder.start(250);
      timerSecRef.current = 0;
      setTimerSec(0);
      startTimer();
      setUiStateSync("recording");
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요."
          : "마이크를 시작할 수 없습니다. 기기에 마이크가 연결되어 있는지 확인해 주세요.";
      setErrorMsg(msg);
      setUiStateSync("error");
    }
  }, [startTimer, setUiStateSync]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      pauseTimer();
      setUiStateSync("paused");
    }
  }, [pauseTimer, setUiStateSync]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setUiStateSync("recording");
    }
  }, [startTimer, setUiStateSync]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const durationSec = timerSecRef.current;
    const mimeType = mimeTypeRef.current;

    pauseTimer();

    // stop 이벤트에서 청크 수집 완료를 보장하기 위해 onstop 콜백 사용
    recorder.onstop = async () => {
      const chunks = [...audioChunksRef.current];
      audioChunksRef.current = []; // 참조 즉시 해제

      const audioBlob = new Blob(chunks, { type: mimeType });
      cleanup();
      setUiStateSync("transcribing");

      try {
        // 전사 중 UI 상태 (1초 후 summarizing으로 전환)
        const stateTimer = setTimeout(() => setUiStateSync("summarizing"), 1000);

        const result = await requestMeetingNotes({
          audioBlob,
          durationSec,
          mimeType,
        });

        clearTimeout(stateTimer);
        setUiStateSync("summarizing");

        const note: MeetingNote = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          durationSec,
          transcript: result.transcript,
          summary: result.summary,
        };

        await saveNote(note);
        const updated = await getAllNotes();
        setNotes(updated);
        setCurrentResult(note);
        setSelectedNote(note);
        setUiStateSync("done");
      } catch (err) {
        let msg = "전사/요약 중 오류가 발생했습니다.";
        if (err instanceof ApiError) {
          if (err.code === "AUDIO_TOO_LARGE") {
            msg = "녹음이 너무 깁니다. 약 3분 이하로 녹음해 주세요.";
          } else if (err.code === "NETWORK_ERROR") {
            msg = "서버에 연결할 수 없습니다. 네트워크 상태를 확인하거나 netlify dev를 실행해 주세요.";
          } else {
            msg = err.message;
          }
        }
        setErrorMsg(msg);
        setUiStateSync("error");
      }
    };

    recorder.stop();
  }, [pauseTimer, cleanup, setUiStateSync]);

  const selectNote = useCallback((note: MeetingNote | null) => {
    setSelectedNote(note);
  }, []);

  const removeNote = useCallback(async (id: string) => {
    await deleteNote(id);
    const updated = await getAllNotes();
    setNotes(updated);
    setSelectedNote((prev) => (prev?.id === id ? null : prev));
  }, []);

  const clearNotes = useCallback(async () => {
    await clearAllNotes();
    setNotes([]);
    setSelectedNote(null);
    setCurrentResult(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    uiState,
    timerSec,
    analyserNode,
    notes,
    selectedNote,
    errorMsg,
    currentResult,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    selectNote,
    removeNote,
    clearNotes,
  };
}

/** 브라우저별 지원 MIME 타입 우선순위 선택 */
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "audio/webm";
}
