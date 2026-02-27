import type { ResourceNodeDef } from '../data/resourceNodes';

interface ResourceNodeViewProps {
  node: ResourceNodeDef;
  inRange?: boolean;
  disabled?: boolean;
  /** 拖曳道具時游標在此資源上，可放置預覽 */
  highlightAsDropTarget?: boolean;
  /** 剛採集完成，播晃動 */
  playShake?: boolean;
  /** 遞增時強制重播晃動（用於連點連續觸發） */
  shakeKey?: number;
  /** 剛裝水完成，播漣漪 */
  playRipple?: boolean;
}

export function ResourceNodeView({
  node,
  inRange,
  disabled,
  highlightAsDropTarget = false,
  playShake = false,
  shakeKey = 0,
  playRipple = false,
}: ResourceNodeViewProps) {
  const r = node.radius;
  const label = node.kind === 'tea_tree' ? '茶樹' : '湖';
  const canInteract = inRange && !disabled;
  return (
    <div className="absolute" style={{ left: node.x - r, top: node.y - r }}>
      {playRipple && (
        <div
          className="absolute rounded-full border-2 border-[var(--color-secondary)] animate-ripple-expand origin-center"
          style={{
            left: 0,
            top: 0,
            width: r * 2,
            height: r * 2,
            boxShadow: '0 0 12px var(--color-secondary-50)',
          }}
          aria-hidden
        />
      )}
      <div
        key={playShake ? shakeKey : 0}
        data-resource-drop={node.id}
        className={`rounded-full flex items-center justify-center text-xs font-medium transition-all ${
          disabled
            ? 'opacity-50 border-2 border-[var(--color-text-muted)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)] cursor-not-allowed'
            : highlightAsDropTarget
              ? 'border-[3px] border-[var(--color-primary)] shadow-[0_0_16px var(--color-primary-75)] bg-[var(--color-primary-25)] text-[var(--color-text-default)]'
              : canInteract
                ? 'border-[3px] border-[var(--color-primary)] shadow-[0_0_12px var(--color-primary-50)] text-[var(--color-text-default)]'
                : 'border-2 border-[var(--color-border)] opacity-80 text-[var(--color-text-default)]'
        } ${playShake ? 'animate-resource-shake' : ''}`}
        style={{
          width: r * 2,
          height: r * 2,
          backgroundColor:
            node.kind === 'tea_tree'
              ? disabled
                ? 'var(--color-panel-muted)'
                : 'var(--color-map-grass-mid)'
              : 'var(--color-secondary-50)',
        }}
        title={
          disabled
            ? '已採完'
            : node.kind === 'lake'
              ? inRange
                ? '拖曳玻璃瓶到此裝水'
                : '靠近後可拖曳玻璃瓶裝水'
              : inRange
                ? '可採集'
                : '靠近後可採集'
        }
      >
        {label}
      </div>
    </div>
  );
}
