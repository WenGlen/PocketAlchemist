import type { MonsterDef } from '../../types/entity';

interface MonsterViewProps {
  monster: MonsterDef;
  /** 即時位置（有巡邏時由 game state 提供）；未傳則用 monster.x, monster.y */
  position?: { x: number; y: number };
  stunned?: boolean;
}

export function MonsterView({ monster, position, stunned = false }: MonsterViewProps) {
  const r = monster.radius;
  const x = position?.x ?? monster.x;
  const y = position?.y ?? monster.y;
  const label = monster.mapLabel ?? monster.displayName ?? '怪物';
  return (
    <div
      className={`absolute rounded-full flex items-center justify-center text-xs font-bold border-2 ${
        stunned
          ? 'bg-[var(--color-panel-muted)] border-[var(--color-text-muted)] opacity-60'
          : 'bg-[var(--color-primary)]/80 border-[var(--color-primary)]'
      }`}
      style={{
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
      }}
      title={`${monster.displayName ?? '怪物'}（每隔一段時間攻擊，可點擊暈眩）`}
    >
      {label}
    </div>
  );
}
