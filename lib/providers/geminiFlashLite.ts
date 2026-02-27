/**
 * Gemini Provider (@google/genai 신규 SDK 사용)
 * 모델 ID: GEMINI_MODEL 환경변수로 재정의 가능
 * 기본값: gemini-2.5-flash-lite-preview-06-17
 *
 * Plan A: 오디오 inline data → 전사+요약 1-shot
 * Plan B: 실패 시 전사 → 요약 2단계로 폴백
 */
import { GoogleGenAI } from "@google/genai";
import type { MeetingNotesProvider, ProcessResult, SummaryResult } from "./types";
import {
  SYSTEM_INSTRUCTION,
  buildTranscribeSummarizePrompt,
  buildSummarizeOnlyPrompt,
} from "../prompts/summary_ko";

const DEFAULT_MODEL = "gemini-2.5-flash";

export class GeminiFlashLiteProvider implements MeetingNotesProvider {
  private ai: GoogleGenAI;
  private modelId: string;

  constructor(apiKey: string, modelId?: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelId = modelId ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async process(
    audioBuffer: Buffer,
    mimeType: string,
    durationSec: number
  ): Promise<ProcessResult> {
    try {
      return await this.processInOneShot(audioBuffer, mimeType, durationSec);
    } catch (err) {
      console.warn("[Gemini] One-shot failed, falling back to two-step:", err);
    }
    // TODO: chunk 업로드/부분 전사 병합 방식으로 확장 가능
    return await this.processTwoStep(audioBuffer, mimeType, durationSec);
  }

  /** Plan A: 오디오 → 전사+요약 1-shot */
  private async processInOneShot(
    audioBuffer: Buffer,
    mimeType: string,
    durationSec: number
  ): Promise<ProcessResult> {
    const safeMimeType = normalizeMimeType(mimeType);
    const base64Audio = audioBuffer.toString("base64");

    const response = await this.ai.models.generateContent({
      model: this.modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.0,
        maxOutputTokens: 2048,
      },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: safeMimeType, data: base64Audio } },
            { text: buildTranscribeSummarizePrompt(durationSec) },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";
    return parseOneShotResponse(text);
  }

  /** Plan B: 전사 → 요약 2단계 */
  private async processTwoStep(
    audioBuffer: Buffer,
    mimeType: string,
    durationSec: number
  ): Promise<ProcessResult> {
    const safeMimeType = normalizeMimeType(mimeType);
    const base64Audio = audioBuffer.toString("base64");

    // Step 1: 전사만 요청 (systemInstruction 없이 순수 전사)
    const transcribeRes = await this.ai.models.generateContent({
      model: this.modelId,
      config: {
        temperature: 0.0,
        maxOutputTokens: 4096,
      },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: safeMimeType, data: base64Audio } },
            {
              text: `첨부된 오디오를 한국어로 정확히 전사하세요. 발화 내용만 텍스트로 출력하고 다른 설명은 포함하지 마세요. 회의 길이는 약 ${Math.round(durationSec / 60)}분입니다.`,
            },
          ],
        },
      ],
    });
    const transcript = transcribeRes.text?.trim() ?? "";

    // Step 2: 전사 텍스트 → 회의록 구조화
    const summarizeRes = await this.ai.models.generateContent({
      model: this.modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.0,
        maxOutputTokens: 2048,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildSummarizeOnlyPrompt(transcript) }],
        },
      ],
    });
    const summaryText = summarizeRes.text?.trim() ?? "";
    const summary = parseSummaryJson(summaryText);

    return { transcript, summary };
  }
}

// ── 헬퍼 ────────────────────────────────────────────────────────────

function normalizeMimeType(raw: string): string {
  const base = raw.split(";")[0].trim().toLowerCase();
  const allowed = [
    "audio/wav", "audio/mp3", "audio/mpeg", "audio/aiff",
    "audio/aac", "audio/ogg", "audio/flac", "audio/webm",
  ];
  return allowed.includes(base) ? base : "audio/webm";
}

function parseOneShotResponse(text: string): ProcessResult {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.transcript !== "string" || !parsed.summary) {
    throw new Error("Invalid one-shot response structure");
  }
  return { transcript: parsed.transcript, summary: validateSummary(parsed.summary) };
}

function parseSummaryJson(text: string): SummaryResult {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return validateSummary(JSON.parse(cleaned));
}

function validateSummary(raw: Record<string, unknown>): SummaryResult {
  return {
    title: String(raw.title ?? "회의 요약"),
    bullets: toStringArray(raw.bullets),
    decisions: toStringArray(raw.decisions),
    actionItems: toStringArray(raw.actionItems),
    risks: toStringArray(raw.risks),
  };
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}
