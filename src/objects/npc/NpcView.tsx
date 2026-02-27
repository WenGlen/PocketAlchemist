import type { NpcDef } from '../data/objectTable';

interface NpcViewProps {
  npc: NpcDef;
  /** 玩家在互動範圍內時顯示可互動標示 */
  inRange?: boolean;
}

export function NpcView({ npc, inRange }: NpcViewProps) {
  const r = npc.radius ?? 24;
  return (
    <div
      className={`absolute rounded-full flex items-center justify-center text-xs font-bold text-[var(--color-text-default)] transition-all ${
        inRange
          ? 'bg-[var(--color-secondary)] border-[3px] border-[var(--color-primary)] shadow-[0_0_12px_var(--color-primary-50)]'
          : 'bg-[var(--color-secondary-50)] border-2 border-[var(--color-border)] opacity-80'
      }`}
      style={{
        left: npc.x - r,
        top: npc.y - r,
        width: r * 2,
        height: r * 2,
      }}
      title={inRange ? `${npc.displayName}（可互動）` : npc.displayName}
    >
      NPC
    </div>
  );
}
