/**
 * Provider 추상화 인터페이스
 * 새 Provider(OpenAI 등) 추가 시: 이 인터페이스를 구현하고 index.ts 팩토리에 등록
 */

export interface SummaryResult {
  title: string;
  bullets: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
}

export interface ProcessResult {
  transcript: string;
  summary: SummaryResult;
}

export interface MeetingNotesProvider {
  /**
   * 오디오 버퍼를 받아 전사 + 요약을 반환한다.
   * @param audioBuffer  - 오디오 raw bytes (Buffer)
   * @param mimeType     - 오디오 MIME 타입 (e.g. "audio/webm;codecs=opus")
   * @param durationSec  - 녹음 길이(초). 프롬프트 힌트용
   */
  process(
    audioBuffer: Buffer,
    mimeType: string,
    durationSec: number
  ): Promise<ProcessResult>;
}
