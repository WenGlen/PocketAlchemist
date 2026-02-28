export { TheDev } from "./core/TheDev";
export { TheDevProvider, useTheDev } from "./core/TheDevContext";
export { submitFeedback } from "./core/apiClient";
export { mapToFeedback } from "./mappers/mapToFeedback";
export { defaultSelfTestConfig } from "./configs/defaultSelfTest";
export { API_BASE_URL } from "./core/api";
export type { SelfTestConfig, SelfTestQuestion, SelfTestOption, FeedbackPayload, ReportMode } from "./core/types";
export { ISSUE_REPORT_TYPES } from "./core/types";
