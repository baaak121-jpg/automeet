"use client";

import { useEffect, useRef } from "react";
import type { UIState } from "@/lib/types";

interface WaveformCanvasProps {
  analyserNode: AnalyserNode | null;
  uiState: UIState;
}

const SCROLL_SPEED = 2;      // px/frame (우→좌 이동 속도)
const AMP_BOOST = 3.5;       // 진폭 증폭 배수
const MIN_AMP = 3;           // 녹음 중 최소 진폭 (묵음도 약간 표시)
const WAVE_COLOR = "#ef4444";
const PAUSE_COLOR = "#f97316";
const BG_COLOR = "#0f172a";

export default function WaveformCanvas({
  analyserNode,
  uiState,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const isActive = uiState === "recording" || uiState === "paused";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 오프스크린 캔버스 초기화 (스크롤 버퍼용)
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    offscreenRef.current = offscreen;

    const offCtx = offscreen.getContext("2d")!;
    offCtx.fillStyle = BG_COLOR;
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

    // 분석기 버퍼
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 512;
    const dataArray = new Uint8Array(bufferLength);

    let animating = true;

    const draw = () => {
      if (!animating) return;
      rafRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      // 새 진폭 샘플 가져오기
      let amplitude = 0;
      if (analyserNode && uiState === "recording") {
        analyserNode.getByteTimeDomainData(dataArray);
        // RMS 기반 진폭 계산 (평균보다 감도 높음)
        let sumSq = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / bufferLength);
        amplitude = Math.max(MIN_AMP, rms * (h * 0.5) * AMP_BOOST);
        // 최대 캔버스 절반 높이까지만
        amplitude = Math.min(amplitude, h * 0.48);
      } else if (uiState === "paused") {
        amplitude = Math.random() * 2.5;
      }

      const offCtx2 = offscreen.getContext("2d")!;

      // 1. 오프스크린 전체를 좌로 SCROLL_SPEED px 이동
      const imageData = offCtx2.getImageData(SCROLL_SPEED, 0, w - SCROLL_SPEED, h);
      offCtx2.fillStyle = BG_COLOR;
      offCtx2.fillRect(0, 0, w, h);
      offCtx2.putImageData(imageData, 0, 0);

      // 2. 오른쪽 끝에 새 컬럼 그리기
      const x = w - SCROLL_SPEED;
      const color = uiState === "paused" ? PAUSE_COLOR : WAVE_COLOR;

      // 수직 라인 (진폭만큼)
      offCtx2.strokeStyle = color;
      offCtx2.lineWidth = SCROLL_SPEED;
      offCtx2.lineCap = "round";
      offCtx2.beginPath();
      offCtx2.moveTo(x, midY - amplitude);
      offCtx2.lineTo(x, midY + amplitude);
      offCtx2.stroke();

      // 3. 오프스크린 → 메인 캔버스로 복사
      ctx.drawImage(offscreen, 0, 0);
    };

    draw();

    return () => {
      animating = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, uiState]);

  // 캔버스 크기가 바뀌면 오프스크린도 리셋
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreenRef.current) return;
    offscreenRef.current.width = canvas.width;
    offscreenRef.current.height = canvas.height;
  }, []);

  if (!isActive) return null;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <canvas
        ref={canvasRef}
        width={900}
        height={160}
        className="w-full h-[160px] block"
        style={{ background: BG_COLOR }}
      />
    </div>
  );
}
