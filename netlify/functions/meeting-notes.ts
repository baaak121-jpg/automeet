/**
 * Netlify Function: POST /.netlify/functions/meeting-notes
 *
 * 오디오 Blob을 multipart/form-data로 수신하여 전사+요약 결과를 반환한다.
 * 오디오 버퍼는 처리 후 즉시 폐기(파일 시스템/스토리지 저장 금지).
 *
 * Request fields:
 *   audio  (File)   - 오디오 Blob
 *   meta   (string) - JSON: { durationSec: number; mimeType: string }
 *
 * Response:
 *   200 { transcript: string; summary: SummaryResult }
 *   4xx/5xx { error: { message: string; code: string } }
 */
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import Busboy from "busboy";
import { providerFactory } from "../../lib/providers/index";
import type { SummaryResult } from "../../lib/providers/types";

// Netlify 동기 함수 바디 최대 크기: 6MB
// MVP 지원 범위: 약 2~3분 이하 (WebM Opus ~32kbps 기준)
// TODO: 더 긴 녹음 지원 시 Netlify Background Functions + chunk 업로드/병합 방식으로 전환

interface Meta {
  durationSec: number;
  mimeType: string;
}

interface SuccessResponse {
  transcript: string;
  summary: SummaryResult;
}

interface ErrorResponse {
  error: { message: string; code: string };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

// OPTIONS preflight 처리
function handleOptions() {
  return { statusCode: 204, headers: CORS_HEADERS, body: "" };
}

function errorResponse(
  status: number,
  message: string,
  code: string
): { statusCode: number; headers: typeof CORS_HEADERS; body: string } {
  const body: ErrorResponse = { error: { message, code } };
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function successResponse(data: SuccessResponse) {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };
}

/** multipart/form-data 파싱 (busboy, in-memory) */
function parseMultipart(
  event: HandlerEvent
): Promise<{ audioBuffer: Buffer; meta: Meta }> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers["content-type"] ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return reject(new Error("Content-Type must be multipart/form-data"));
    }

    const busboy = Busboy({ headers: { "content-type": contentType } });

    let audioBuffer: Buffer | null = null;
    let meta: Meta = { durationSec: 0, mimeType: "audio/webm" };
    const audioChunks: Buffer[] = [];

    busboy.on("file", (fieldname, file) => {
      if (fieldname !== "audio") {
        file.resume(); // 다른 필드는 스킵
        return;
      }
      file.on("data", (chunk: Buffer) => audioChunks.push(chunk));
      file.on("end", () => {
        audioBuffer = Buffer.concat(audioChunks);
      });
    });

    busboy.on("field", (fieldname, value) => {
      if (fieldname === "meta") {
        try {
          meta = { ...meta, ...JSON.parse(value) };
        } catch {
          // meta 파싱 실패 시 기본값 유지
        }
      }
    });

    busboy.on("finish", () => {
      if (!audioBuffer || audioBuffer.length === 0) {
        return reject(new Error("audio 필드가 없거나 비어 있습니다."));
      }
      resolve({ audioBuffer, meta });
    });

    busboy.on("error", reject);

    // Netlify는 binary body를 base64로 인코딩해 전달
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64")
      : Buffer.from(event.body ?? "");

    busboy.write(rawBody);
    busboy.end();
  });
}

const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();

  if (event.httpMethod !== "POST") {
    return errorResponse(405, "POST 메서드만 허용됩니다.", "METHOD_NOT_ALLOWED");
  }

  // --- 파싱 ---
  let audioBuffer: Buffer;
  let meta: Meta;

  try {
    ({ audioBuffer, meta } = await parseMultipart(event));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "요청 파싱 실패";
    return errorResponse(400, msg, "PARSE_ERROR");
  }

  // --- 크기 체크 (Netlify 6MB 실질 한도 안전 마진) ---
  const MAX_BYTES = 5.5 * 1024 * 1024;
  if (audioBuffer.length > MAX_BYTES) {
    // 참조를 즉시 해제
    (audioBuffer as unknown as null) = null;
    return errorResponse(
      413,
      `오디오가 너무 큽니다 (최대 ~5.5MB, 약 2~3분). 긴 회의는 분할 기능이 필요합니다.`,
      "AUDIO_TOO_LARGE"
    );
  }

  // --- Provider 선택 및 처리 ---
  let provider;
  try {
    provider = providerFactory();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Provider 초기화 실패";
    return errorResponse(500, msg, "PROVIDER_INIT_ERROR");
  }

  let result: SuccessResponse;
  try {
    result = await provider.process(
      audioBuffer,
      meta.mimeType,
      meta.durationSec
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "전사/요약 처리 실패";
    console.error("[meeting-notes] provider.process error:", err);
    return errorResponse(500, msg, "PROCESS_ERROR");
  } finally {
    // 오디오 버퍼 즉시 폐기 (GC 힌트)
    audioBuffer.fill(0);
    (audioBuffer as unknown as null) = null;
  }

  return successResponse(result);
};

export { handler };
