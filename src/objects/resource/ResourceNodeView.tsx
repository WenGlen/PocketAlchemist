import type { ResourceNodeDef } from '../data/objectsTable';

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
  /** 靠近時泡泡說明（與可接任務泡泡同風格），由 objectsTable 設定 */
  proximityBubbleText?: string;
}

export function ResourceNodeView({
  node,
  inRange,
  disabled,
  highlightAsDropTarget = false,
  playShake = false,
  shakeKey = 0,
  playRipple = false,
  proximityBubbleText,
}: ResourceNodeViewProps) {
  const r = node.radius;
  const canInteract = inRange && !disabled;
  const backgroundColor = node.mapColor ?? 'var(--color-secondary-50)';
  const titleText = disabled
    ? '已採完'
    : proximityBubbleText ?? (node.requireItemId ? '拖曳道具至此交換' : '可採集');
  return (
    <div className="absolute flex flex-col items-center" style={{ left: node.x - r, top: node.y - r }}>
      {inRange && !disabled && proximityBubbleText && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-8 rounded px-2 py-1 bg-[var(--color-panel)] border border-[var(--color-primary)] text-[10px] text-[var(--color-text-default)] whitespace-nowrap z-10 pointer-events-none"
          aria-hidden
        >
          📦 {proximityBubbleText}
        </div>
      )}
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
        className={`rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${
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
          backgroundColor: disabled ? 'var(--color-panel-muted)' : backgroundColor,
        }}
        title={titleText}
      >
        {node.mapLabel}
      </div>
    </div>
  );
}
