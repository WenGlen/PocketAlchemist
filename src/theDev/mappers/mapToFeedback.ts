import type { FeedbackPayload } from "../core/types";

/**
 * 將表單／狀態轉成後端 POST /api/feedback 的 body。
 * 遊戲可替換此檔或自訂 mapper，再在送出前呼叫。
 */
export function mapToFeedback(params: {
  專案: string;
  回報類型: string;
  回報區塊: string;
  回報內容: string;
  開發版本號: string;
}): FeedbackPayload {
  return {
    專案: params.專案,
    回報類型: params.回報類型,
    回報區塊: params.回報區塊,
    回報內容: params.回報內容,
    開發版本號: params.開發版本號,
  };
}
