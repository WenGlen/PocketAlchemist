/**
 * 後端 API 基礎網址
 * 生產環境：改為實際後端網址（HTTPS，如 Zeabur 部署網址）
 * 開發時由 Vite proxy 轉發 /api 到 localhost:3000
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'https://your-backend.zeabur.app');

/**
 * 取得 Gemini Chat API 端點（供前端呼叫後端代理）
 */
export function getGeminiChatEndpoint(): string {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/gemini-chat`;
  }
  if (import.meta.env.DEV) {
    return '/api/gemini-chat';
  }
  return `${API_BASE_URL}/api/gemini-chat`;
}
