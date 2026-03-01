import type { StatValue } from './statsConfig';

/**
 * 頂部選單與地圖之間的數值區：顯示 HP 等能力數值。
 * 顯示內容由 config/statsConfig + game state 決定，本元件只負責呈現。
 */
interface StatsBarProps {
  /** 要顯示的數值列表（由 getDisplayStats 產生）；空則不渲染區塊 */
  stats: StatValue[];
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats.length) return null;

  return (
    <div className="flex-shrink-0 px-3 py-1.5 flex flex-col gap-2 bg-[var(--color-panel)] border-b border-[var(--color-border)]">
      {stats.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)] w-8">{s.label}</span>
          <div className="flex-1 h-3 rounded-full bg-[var(--color-panel-muted)] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{
                width: `${s.max > 0 ? (s.current / s.max) * 100 : 0}%`,
                backgroundColor: s.barColor ?? 'var(--color-text-error)',
              }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--color-text-default)] tabular-nums">
            {s.current}/{s.max}
          </span>
        </div>
      ))}
    </div>
  );
}
