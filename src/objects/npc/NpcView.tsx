import type { NpcDef } from '../data/objectsTable';
import { getItem } from '../../items/data/itemTable';

interface NpcViewProps {
  npc: NpcDef;
  inRange?: boolean;
  /** 任務泡泡顯示道具（顯示道具名稱） */
  demandItemId?: string | null;
  /** 任務泡泡顯示文字（優先於 demandItemId） */
  demandLabel?: string | null;
  onBubbleClick?: () => void;
}

export function NpcView({ npc, inRange, demandItemId, demandLabel, onBubbleClick }: NpcViewProps) {
  const r = npc.radius ?? 24;
  const bubbleText = demandLabel ?? (demandItemId ? getItem(demandItemId)?.name : null);
  return (
    <div className="absolute flex flex-col items-center" style={{ left: npc.x - r, top: npc.y - r }}>
      {inRange && bubbleText && (
        <button
          type="button"
          className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-full rounded px-2 py-1 bg-[var(--color-panel)] border border-[var(--color-primary)] text-[10px] text-[var(--color-text-default)] whitespace-nowrap z-10 hover:bg-[var(--color-panel-muted)] active:scale-[0.98] cursor-pointer transition-all"
          title={`${bubbleText}（點擊互動）`}
          onClick={(e) => {
            e.stopPropagation();
            onBubbleClick?.();
          }}
        >
          📦 {bubbleText}
        </button>
      )}
      <div
        className={`rounded-full flex items-center justify-center text-xs font-bold text-[var(--color-text-default)] transition-all ${
          inRange
            ? 'bg-[var(--color-secondary)] border-[3px] border-[var(--color-object-focus)] shadow-[0_0_12px_var(--color-primary-50)]'
            : 'bg-[var(--color-secondary-50)] border-2 border-[var(--color-npc-normal)] opacity-80'
        }`}
        style={{ width: r * 2, height: r * 2 }}
        title={inRange ? `${npc.displayName}（可互動）` : npc.displayName}
      >
        NPC
      </div>
      <span
        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] font-medium text-[var(--color-text-default)] whitespace-nowrap"
        style={{ filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9))' }}
      >
        {npc.displayName}
      </span>
    </div>
  );
}
