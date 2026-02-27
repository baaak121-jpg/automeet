/**
 * 프론트엔드 → Netlify Function 호출 클라이언트
 *
 * - multipart/form-data로 오디오 Blob 전송
 * - 성공: { transcript, summary } 반환
 * - 실패: ApiError throw
 *
 * 향후 백엔드 변경 시 이 파일만 수정하면 된다.
 */
import type { SummaryResult } from "@/lib/providers/types";

const FUNCTION_URL = "/.netlify/functions/meeting-notes";

export interface MeetingNotesRequest {
  audioBlob: Blob;
  durationSec: number;
  mimeType: string;
}

export interface MeetingNotesResponse {
  transcript: string;
  summary: SummaryResult;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestMeetingNotes(
  req: MeetingNotesRequest
): Promise<MeetingNotesResponse> {
  const { audioBlob, durationSec, mimeType } = req;

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("meta", JSON.stringify({ durationSec, mimeType }));

  let res: Response;
  try {
    res = await fetch(FUNCTION_URL, {
      method: "POST",
      body: formData,
      // Content-Type은 브라우저가 boundary 포함해서 자동 설정
    });
  } catch {
    throw new ApiError(
      "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.",
      "NETWORK_ERROR",
      0
    );
  }

  if (!res.ok) {
    let code = "SERVER_ERROR";
    let message = `서버 오류 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new ApiError(message, code, res.status);
  }

  const data = await res.json();
  return data as MeetingNotesResponse;
}
