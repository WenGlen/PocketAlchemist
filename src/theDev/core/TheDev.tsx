import { useState, useCallback } from "react";
import { useTheDev } from "./TheDevContext";
import { submitFeedback } from "./apiClient";
import type { ReportMode } from "./types";
import { ISSUE_REPORT_TYPES } from "./types";
import { mapToFeedback } from "../mappers/mapToFeedback";
import "./theDev.scss";

export function TheDev() {
  const { apiBaseUrl, project, token, appVersion, selfTestConfig, snapshotPayload } = useTheDev();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReportMode>("issue");

  const [selfTestQuestionIndex, setSelfTestQuestionIndex] = useState(0);
  const [selfTestChecked, setSelfTestChecked] = useState<Record<string, boolean>>({});
  const [selfTestFreeText, setSelfTestFreeText] = useState("");

  const [issueType, setIssueType] = useState<string>(ISSUE_REPORT_TYPES[0].value);
  const [issueBlock, setIssueBlock] = useState("");
  const [issueContent, setIssueContent] = useState("");

  const [snapshotBlock, setSnapshotBlock] = useState("");
  const [snapshotContent, setSnapshotContent] = useState("");

  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const clearSubmitFeedback = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitStatus("loading");
    setSubmitMessage("");

    let 回報類型: string;
    let 回報區塊: string;
    let 回報內容: string;

    if (mode === "selfTest") {
      const question = selfTestConfig.questions[selfTestQuestionIndex];
      if (!question) {
        setSubmitStatus("error");
        setSubmitMessage("請選擇題目");
        return;
      }
      const keyPrefix = `${question.id}-`;
      const selected = question.options
        .filter((o) => selfTestChecked[keyPrefix + o.value])
        .map((o) => o.label)
        .join(", ");
      const contentPart = selected ? (selfTestFreeText ? `${selected} | ${selfTestFreeText}` : selected) : selfTestFreeText;
      if (!contentPart.trim()) {
        setSubmitStatus("error");
        setSubmitMessage("請至少勾選一項或填寫備註");
        return;
      }
      回報類型 = "自測題";
      回報區塊 = question.title;
      回報內容 = contentPart;
    } else if (mode === "issue") {
      if (!issueContent.trim()) {
        setSubmitStatus("error");
        setSubmitMessage("請填寫回報內容");
        return;
      }
      回報類型 = issueType;
      回報區塊 = issueBlock.trim() || "—";
      回報內容 = issueContent.trim();
    } else {
      const snapshotStr = Object.keys(snapshotPayload).length > 0
        ? JSON.stringify(snapshotPayload, null, 0)
        : "";
      回報類型 = "快照紀錄";
      回報區塊 = snapshotBlock.trim() || "—";
      回報內容 = snapshotContent.trim()
        ? (snapshotStr ? `${snapshotContent}\n${snapshotStr}` : snapshotContent)
        : snapshotStr || "—";
    }

    const payload = mapToFeedback({
      專案: project,
      回報類型,
      回報區塊,
      回報內容,
      開發版本號: appVersion,
    });
    const result = await submitFeedback(apiBaseUrl, payload, token);

    if (result.success) {
      setSubmitStatus("success");
      setSubmitMessage(result.message ?? "回報成功");
      if (mode === "selfTest") {
        setSelfTestChecked({});
        setSelfTestFreeText("");
      } else if (mode === "issue") {
        setIssueBlock("");
        setIssueContent("");
      } else {
        setSnapshotBlock("");
        setSnapshotContent("");
      }
    } else {
      setSubmitStatus("error");
      setSubmitMessage([result.error, result.details].filter(Boolean).join("：") || "送出失敗");
    }
  }, [
    mode,
    apiBaseUrl,
    project,
    token,
    appVersion,
    selfTestConfig,
    selfTestQuestionIndex,
    selfTestChecked,
    selfTestFreeText,
    issueType,
    issueBlock,
    issueContent,
    snapshotBlock,
    snapshotContent,
    snapshotPayload,
  ]);

  return (
    <>
      <button
        type="button"
        className="thedev-trigger"
        onClick={() => setOpen(true)}
        aria-label="開啟 dev 回報面板"
      >
        dev
      </button>

      {open && (
        <>
          <div
            className="thedev-overlay"
            role="presentation"
            onClick={() => {
              setOpen(false);
              clearSubmitFeedback();
            }}
            aria-hidden
          />
          <div
            className="thedev-panel-wrap"
            role="dialog"
            aria-label="回報面板"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <header className="thedev-panel-header">
              <span className="thedev-panel-title">theDev 回報</span>
              <button
                type="button"
                className="thedev-close"
                onClick={() => {
                  setOpen(false);
                  clearSubmitFeedback();
                }}
                aria-label="關閉"
              >
                關閉
              </button>
            </header>

            <div className="thedev-toolbar">
              <button
                type="button"
                className="thedev-footer-btn thedev-footer-btn-submit"
                onClick={handleSubmit}
                disabled={submitStatus === "loading"}
                aria-busy={submitStatus === "loading"}
              >
                送出
              </button>
              <button
                type="button"
                className={`thedev-footer-btn thedev-footer-btn-mode ${mode === "selfTest" ? "active" : ""}`}
                onClick={() => { setMode("selfTest"); clearSubmitFeedback(); }}
              >
                自測題
              </button>
              <button
                type="button"
                className={`thedev-footer-btn thedev-footer-btn-mode ${mode === "issue" ? "active" : ""}`}
                onClick={() => { setMode("issue"); clearSubmitFeedback(); }}
              >
                問題回報
              </button>
              <button
                type="button"
                className={`thedev-footer-btn thedev-footer-btn-mode ${mode === "snapshot" ? "active" : ""}`}
                onClick={() => { setMode("snapshot"); clearSubmitFeedback(); }}
              >
                快照紀錄
              </button>
            </div>

            <div className="thedev-panel-body">
              {mode === "selfTest" && (
                <SelfTestForm
                  config={selfTestConfig}
                  questionIndex={selfTestQuestionIndex}
                  onQuestionIndexChange={setSelfTestQuestionIndex}
                  checked={selfTestChecked}
                  onCheckedChange={setSelfTestChecked}
                  freeText={selfTestFreeText}
                  onFreeTextChange={setSelfTestFreeText}
                />
              )}
              {mode === "issue" && (
                <IssueForm
                  issueType={issueType}
                  onIssueTypeChange={setIssueType}
                  issueBlock={issueBlock}
                  onIssueBlockChange={setIssueBlock}
                  issueContent={issueContent}
                  onIssueContentChange={setIssueContent}
                />
              )}
              {mode === "snapshot" && (
                <SnapshotForm
                  block={snapshotBlock}
                  onBlockChange={setSnapshotBlock}
                  content={snapshotContent}
                  onContentChange={setSnapshotContent}
                  snapshotPayload={snapshotPayload}
                />
              )}

              {submitStatus === "success" && (
                <div className="thedev-feedback-msg success" role="status">
                  {submitMessage}
                </div>
              )}
              {submitStatus === "error" && (
                <div className="thedev-feedback-msg error" role="alert">
                  {submitMessage}
                </div>
              )}
              {submitStatus === "loading" && (
                <div className="thedev-feedback-msg" role="status">
                  送出中…
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SelfTestForm({
  config,
  questionIndex,
  onQuestionIndexChange,
  checked,
  onCheckedChange,
  freeText,
  onFreeTextChange,
}: {
  config: { questions: { id: string; title: string; options: { value: string; label: string }[] }[] };
  questionIndex: number;
  onQuestionIndexChange: (i: number) => void;
  checked: Record<string, boolean>;
  onCheckedChange: (c: Record<string, boolean>) => void;
  freeText: string;
  onFreeTextChange: (s: string) => void;
}) {
  const q = config.questions[questionIndex];
  return (
    <div className="thedev-form-self">
      <div className="thedev-field">
        <span className="thedev-label">選擇題目</span>
        <div className="thedev-question-tabs">
          {config.questions.map((question, i) => (
            <button
              key={question.id}
              type="button"
              className={`thedev-question-tab ${i === questionIndex ? "active" : ""}`}
              onClick={() => onQuestionIndexChange(i)}
            >
              {question.title}
            </button>
          ))}
        </div>
      </div>
      {q && (
        <>
          <div className="thedev-field">
            <span className="thedev-label">勾選選項（可複選）</span>
            <div className="thedev-checkbox-group">
              {q.options.map((opt) => {
                const key = `${q.id}-${opt.value}`;
                return (
                  <label key={opt.value} className="thedev-checkbox-item">
                    <input
                      type="checkbox"
                      checked={!!checked[key]}
                      onChange={(e) => {
                        onCheckedChange({ ...checked, [key]: e.target.checked });
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="thedev-field">
            <label className="thedev-label" htmlFor="thedev-selftest-free">
              補充備註
            </label>
            <textarea
              id="thedev-selftest-free"
              className="thedev-textarea"
              placeholder="可選填"
              value={freeText}
              onChange={(e) => onFreeTextChange(e.target.value)}
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

function IssueForm({
  issueType,
  onIssueTypeChange,
  issueBlock,
  onIssueBlockChange,
  issueContent,
  onIssueContentChange,
}: {
  issueType: string;
  onIssueTypeChange: (s: string) => void;
  issueBlock: string;
  onIssueBlockChange: (s: string) => void;
  issueContent: string;
  onIssueContentChange: (s: string) => void;
}) {
  return (
    <div className="thedev-form-issue">
      <div className="thedev-field">
        <label className="thedev-label" htmlFor="thedev-issue-type">
          回報類型
        </label>
        <select
          id="thedev-issue-type"
          className="thedev-select"
          value={issueType}
          onChange={(e) => onIssueTypeChange(e.target.value)}
        >
          {ISSUE_REPORT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="thedev-field">
        <label className="thedev-label" htmlFor="thedev-issue-block">
          回報區塊／題目
        </label>
        <input
          id="thedev-issue-block"
          type="text"
          className="thedev-input"
          placeholder="例如：戰鬥、設定頁"
          value={issueBlock}
          onChange={(e) => onIssueBlockChange(e.target.value)}
        />
      </div>
      <div className="thedev-field">
        <label className="thedev-label" htmlFor="thedev-issue-content">
          回報內容
        </label>
        <textarea
          id="thedev-issue-content"
          className="thedev-textarea"
          placeholder="請描述問題或建議…"
          value={issueContent}
          onChange={(e) => onIssueContentChange(e.target.value)}
          rows={5}
        />
      </div>
    </div>
  );
}

function SnapshotForm({
  block,
  onBlockChange,
  content,
  onContentChange,
  snapshotPayload,
}: {
  block: string;
  onBlockChange: (s: string) => void;
  content: string;
  onContentChange: (s: string) => void;
  snapshotPayload: Record<string, unknown>;
}) {
  const hasPayload = Object.keys(snapshotPayload).length > 0;
  return (
    <div className="thedev-form-snapshot">
      <div className="thedev-field">
        <label className="thedev-label" htmlFor="thedev-snapshot-block">
          回報區塊／題目
        </label>
        <input
          id="thedev-snapshot-block"
          type="text"
          className="thedev-input"
          placeholder="例如：關卡 3、設定頁快照"
          value={block}
          onChange={(e) => onBlockChange(e.target.value)}
        />
      </div>
      <div className="thedev-field">
        <label className="thedev-label" htmlFor="thedev-snapshot-content">
          備註（可選）
        </label>
        <textarea
          id="thedev-snapshot-content"
          className="thedev-textarea"
          placeholder="簡短說明此快照…"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={3}
        />
      </div>
      {hasPayload && (
        <div className="thedev-field">
          <span className="thedev-label">目前快照資料（由程式帶入）</span>
          <pre
            className="thedev-input"
            style={{ minHeight: "60px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
          >
            {JSON.stringify(snapshotPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
