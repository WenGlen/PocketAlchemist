export function TopBar() {
  return (
    <header className="flex-shrink-0 h-12 px-3 flex items-center justify-between bg-[var(--color-panel)] border-b border-[var(--color-border)]">
      <span className="text-sm font-semibold text-[var(--color-text-default)]">通勤鍊金術師</span>
      <span className="text-sm font-semibold text-muted">MVP-0.1.06</span>
      <button
        type="button"
        className="px-3 py-1 rounded bg-[var(--color-btn)] text-[var(--color-btn-text)] text-sm"
        aria-label="選單"
      >
        選單
      </button>
    </header>
  );
}
