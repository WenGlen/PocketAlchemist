//════════════════════════════════════════════════════════════════
// 技能按鈕
//════════════════════════════════════════════════════════════════
// 右側兩個垂直按鈕，對應左側裝備欄，展開 / 收合對應功能面板

export interface SkillButtonConfig {
  panelId: string;
  label: string;
}

interface SkillButtonsProps {
  configs: (SkillButtonConfig | null)[];
  activePanelId: string | null;
  onToggle: (panelId: string) => void;
}

export function SkillButtons({ configs, activePanelId, onToggle }: SkillButtonsProps) {
  return (
    <div className="flex flex-col gap-2 py-2">
      {configs.map((config, i) => {
        const isActive = !!config && activePanelId === config.panelId;
        const isDisabled = !config;
        return (
          <div key={i} className="w-16 h-16 flex items-center justify-center">
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => config && onToggle(config.panelId)}
              className={`w-full h-full rounded-lg border-[1pt] border-solid text-[11px] font-medium transition-[border-color,background,box-shadow] duration-150 leading-tight px-1 ${
                isDisabled
                  ? 'border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'
                  : isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] text-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary-50)]'
                    : 'border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-default)] hover:border-[var(--color-primary)]'
              }`}
            >
              <span className="block">{config ? config.label : '─'}</span>
              {!isDisabled && (
                <span className="block text-[9px] opacity-60">
                  {isActive ? '▼' : '▲'}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
