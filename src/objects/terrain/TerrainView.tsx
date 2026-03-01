import type { TerrainDef } from '../../core/types/entity';

interface TerrainViewProps {
  terrain: TerrainDef;
  /** 已用道具清除（僅 requiredItemId 地形）；清除後不渲染 */
  cleared?: boolean;
  /** 拖曳藥劑時游標在此地形上，可放置預覽 */
  highlightAsDropTarget?: boolean;
  /** 玩家在傷害地形範圍內（正在扣血），顯示 terrain-attack 色 */
  playerInRange?: boolean;
}

export function TerrainView({ terrain, cleared = false, highlightAsDropTarget = false, playerInRange = false }: TerrainViewProps) {
  if (terrain.requiredItemId && cleared) return null;

  const r = terrain.radius;
  const label = terrain.mapLabel ?? terrain.displayName ?? '地形';
  const isBlocking = terrain.passable === false;
  const title = isBlocking
    ? (terrain.displayName ?? '地形') + (terrain.requiredItemId ? '（需藥劑清除）' : '（不可經過）')
    : (terrain.displayName ?? '地形') + (terrain.damagePerTick != null ? '（進入範圍持續扣血）' : '');

  if (isBlocking) {
    const shapeClass = terrain.shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    const customColor = terrain.mapColor;
    return (
      <div
        {...(terrain.requiredItemId ? { 'data-terrain-drop': terrain.id } : {})}
        className={`absolute ${shapeClass} flex items-center justify-center text-xs font-bold border-2 ${
          highlightAsDropTarget
            ? 'bg-[var(--color-primary-25)] border-[var(--color-object-focus)]'
            : !customColor
              ? 'bg-[var(--color-terrain-blocked)]/20 border-[var(--color-terrain-blocked)]'
              : ''
        }`}
        style={{
          left: terrain.x - r,
          top: terrain.y - r,
          width: r * 2,
          height: r * 2,
          ...(!highlightAsDropTarget && customColor
            ? {
                backgroundColor: `color-mix(in srgb, ${customColor} 25%, transparent)`,
                borderColor: customColor,
              }
            : {}),
        }}
        title={title}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      className={`absolute rounded-full flex items-center justify-center text-xs font-bold border-2 ${
        playerInRange
          ? 'bg-[var(--color-terrain-attack)]/20 border-[var(--color-terrain-attack)] border-4'
          : 'bg-[var(--color-terrain-danger)]/20 border-[var(--color-terrain-danger)]'
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
