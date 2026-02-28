import type { FeedbackPayload } from "./types";

export interface SubmitResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export async function submitFeedback(
  apiBaseUrl: string,
  payload: FeedbackPayload,
  token?: string
): Promise<SubmitResult> {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/feedback`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["X-DEVLOG-TOKEN"] = token;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error ?? "請求失敗",
        details: data.details ?? res.statusText,
      };
    }
    return {
      success: true,
      message: data.message ?? "回報成功",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "網路錯誤";
    return {
      success: false,
      error: "送出失敗",
      details: message,
    };
  }
}
