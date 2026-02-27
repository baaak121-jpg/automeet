/**
 * 회의록 전사/요약 프롬프트
 * systemInstruction과 user 프롬프트를 분리해서 관리
 */

/** Gemini systemInstruction — 역할 정의 및 작성 규칙 */
export const SYSTEM_INSTRUCTION = `당신은 회의 내용을 있는 그대로 기록하고 정리하는 전문 서기입니다. 제공되는 음성 전사 데이터(Transcript)를 바탕으로 아래 지침을 엄격히 준수하여 회의록을 작성하세요.

작성 규칙:
- 객관성 유지: AI의 자의적인 해석, 비유, 판단, 혹은 텍스트에 없는 내용을 절대 추가하지 마세요. 모든 내용은 대화 내용에 근거해야 합니다.
- 사실 중심: 화자의 감정이나 의도를 추측하지 말고, 언급된 사실과 데이터, 결정된 사항만 기록하세요.
- 존댓말 사용: 결과물은 정중한 문어체로 작성하세요.
- 출력은 반드시 지정된 JSON 형식만 사용하세요. 코드블록(\`\`\`json)은 사용하지 마세요.`;

/**
 * 오디오 → 전사 + 구조화 요약 1-shot 프롬프트
 */
export function buildTranscribeSummarizePrompt(durationSec: number): string {
  const durationHint = durationSec > 0
    ? `회의 길이는 약 ${Math.round(durationSec / 60)}분입니다.`
    : "";

  return `${durationHint}

첨부된 오디오를 듣고 다음 두 가지 작업을 수행하세요.

## 작업 1: 전사
오디오의 발화 내용을 한국어로 정확하게 전사하세요.
- 발화자 구분이 불가능한 경우 연속 텍스트로 작성
- 불분명한 발화는 [불명확] 표시
- 배경 소음이나 비언어적 요소는 포함하지 않음

## 작업 2: 회의록 작성 (JSON)
전사 내용을 바탕으로 아래 JSON 형식으로 출력하세요.
JSON 외 다른 텍스트나 마크다운은 절대 포함하지 마세요.

{
  "transcript": "(전사 원문 전체)",
  "summary": {
    "title": "(회의제목: 전체 맥락을 바탕으로 한 제목)",
    "bullets": [
      "[아젠다 1]: 관련 논의 내용",
      "[아젠다 2]: 관련 논의 내용"
    ],
    "decisions": [
      "(결론/결정사항: 회의 중 최종 합의된 사항)"
    ],
    "actionItems": [
      "(향후 todo: 누가, 무엇을, 언제까지 — 형식 엄수)"
    ],
    "risks": []
  }
}`;
}

/**
 * 텍스트 전사 → 요약 전용 프롬프트 (Plan B 2단계)
 */
export function buildSummarizeOnlyPrompt(transcript: string): string {
  return `아래 회의 전사록을 바탕으로 회의록을 작성하세요.
JSON 외 다른 텍스트나 마크다운은 절대 포함하지 마세요.

[전사록]
${transcript}

[출력 JSON]
{
  "title": "(회의제목: 전체 맥락을 바탕으로 한 제목)",
  "bullets": [
    "[아젠다 1]: 관련 논의 내용",
    "[아젠다 2]: 관련 논의 내용"
  ],
  "decisions": [
    "(결론/결정사항: 최종 합의된 사항)"
  ],
  "actionItems": [
    "(향후 todo: 누가, 무엇을, 언제까지)"
  ],
  "risks": []
}`;
}
