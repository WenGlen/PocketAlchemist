// ========== 回報模式 ==========
export type ReportMode = "selfTest" | "issue" | "snapshot";

// ========== 後端 API 對應（POST /api/feedback）==========
export interface FeedbackPayload {
  專案?: string; // 遊戲/專案識別，後端依此寫入同一份 Sheet 的對應分頁
  回報類型: string;
  回報區塊: string;
  回報內容: string;
  開發版本號: string;
}

// ========== 問題回報：回報類型選項 ==========
export const ISSUE_REPORT_TYPES = [
  { value: "功能bug", label: "功能bug" },
  { value: "UX優化", label: "UX優化" },
  { value: "建議", label: "建議" },
  { value: "純觀察", label: "純觀察" },
  { value: "其他", label: "其他" },
] as const;

// ========== 自測題 config ==========
export interface SelfTestOption {
  value: string;
  label: string;
}

export interface SelfTestQuestion {
  id: string;
  order: number;
  title: string;
  description?: string;
  options: SelfTestOption[];
}

export interface SelfTestConfig {
  questions: SelfTestQuestion[];
}

// ========== Provider 傳入 ==========
export interface TheDevContextValue {
  apiBaseUrl: string;
  project: string; // 專案/遊戲名稱，同一份 Sheet 內對應分頁名
  token?: string;
  appVersion: string;
  selfTestConfig: SelfTestConfig;
  snapshotPayload: Record<string, unknown>;
  setSnapshotPayload: (payload: Record<string, unknown>) => void;
}
