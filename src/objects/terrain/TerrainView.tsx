import type { TerrainDef } from '../../types/entity';

interface TerrainViewProps {
  terrain: TerrainDef;
  /** 已用道具清除（僅 requiredItemId 地形）；清除後不渲染 */
  cleared?: boolean;
  /** 拖曳藥劑時游標在此地形上，可放置預覽 */
  highlightAsDropTarget?: boolean;
}

export function TerrainView({ terrain, cleared = false, highlightAsDropTarget = false }: TerrainViewProps) {
  if (terrain.requiredItemId && cleared) return null;

  const r = terrain.radius;
  const label = terrain.mapLabel ?? terrain.displayName ?? '地形';
  const isBlocking = terrain.passable === false;
  const title = isBlocking
    ? (terrain.displayName ?? '地形') + (terrain.requiredItemId ? '（需藥劑清除）' : '（不可經過）')
    : (terrain.displayName ?? '地形') + (terrain.damagePerTick != null ? '（進入範圍持續扣血）' : '');

  if (isBlocking) {
    return (
      <div
        data-terrain-drop={terrain.id}
        className={`absolute rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
          highlightAsDropTarget
            ? 'bg-[var(--color-primary-25)] border-[var(--color-primary)]'
            : 'bg-[var(--color-panel)] border-[var(--color-border)]'
        }`}
        style={{
          left: terrain.x - r,
          top: terrain.y - r,
          width: r * 2,
          height: r * 2,
        }}
        title={title}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      className="absolute rounded-full flex items-center justify-center text-xs font-bold border-2 bg-[var(--color-text-muted)]/70 border-[var(--color-text-default)]/80"
      style={{
        left: terrain.x - r,
        top: terrain.y - r,
        width: r * 2,
        height: r * 2,
      }}
      title={title}
    >
      {label}
    </div>
  );
}
