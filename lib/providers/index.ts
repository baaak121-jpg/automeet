/**
 * Provider 팩토리
 * MEETING_PROVIDER 환경변수로 사용할 Provider를 선택한다.
 *
 * 지원 값:
 *   "mock"   - MockProvider (기본값, API 키 불필요)
 *   "gemini" - GeminiFlashLiteProvider (GEMINI_API_KEY 필요)
 *
 * 추후 확장 예시:
 *   "openai" - OpenAIProvider (OPENAI_API_KEY 필요)
 */
import type { MeetingNotesProvider } from "./types";
import { MockProvider } from "./mock";
import { GeminiFlashLiteProvider } from "./geminiFlashLite";
// @google/generative-ai는 더 이상 사용하지 않음 → @google/genai 로 교체 완료

export type ProviderName = "mock" | "gemini";

export function providerFactory(): MeetingNotesProvider {
  const name = (process.env.MEETING_PROVIDER ?? "mock") as ProviderName;

  switch (name) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "MEETING_PROVIDER=gemini 이지만 GEMINI_API_KEY가 설정되지 않았습니다."
        );
      }
      return new GeminiFlashLiteProvider(apiKey);
    }

    case "mock":
    default:
      return new MockProvider();
  }
}

export type { MeetingNotesProvider } from "./types";
export type { ProcessResult, SummaryResult } from "./types";
