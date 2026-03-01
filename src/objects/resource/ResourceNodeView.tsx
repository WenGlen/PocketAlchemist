import type { ResourceNodeDef } from '../data/objectsTable';
import { ObjectView } from '../shared/ObjectView';
import { debugConfig } from '../debugForObjects';
import { ISO_VISUAL, OPACITY } from '../objectsConstants';

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
  /** 點擊泡泡時觸發（與點擊圓圈同效果） */
  onTap?: () => void;
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
  onTap,
}: ResourceNodeViewProps) {
  const r = node.radius;
  const w = node.hitbox?.width ?? r * 2;
  const h = node.hitbox?.height ?? w;
  const canInteract = inRange && !disabled;
  const baseColor = node.mapColor ?? 'var(--color-secondary-50)';

  // ── 定位圈視覺狀態 ──
  let ringBgColor: string;
  let ringBorderColor: string;
  let ringShadow: string | undefined;
  let ringOpacity: number;

  if (disabled) {
    ringBgColor = 'var(--color-panel-muted)';
    ringBorderColor = 'var(--color-resource-disabled)';
    ringShadow = undefined;
    ringOpacity = OPACITY.IN_RANGE;
  } else if (highlightAsDropTarget) {
    ringBgColor = 'var(--color-primary-25)';
    ringBorderColor = 'var(--color-object-focus)';
    ringShadow = '0 0 16px var(--color-primary-75)';
    ringOpacity = OPACITY.IN_RANGE;
  } else if (canInteract) {
    ringBgColor = baseColor;
    ringBorderColor = 'var(--color-object-focus)';
    ringShadow = '0 0 12px var(--color-primary-50)';
    ringOpacity = OPACITY.IN_RANGE;
  } else {
    ringBgColor = baseColor;
    ringBorderColor = 'var(--color-resource-normal)';
    ringShadow = undefined;
    ringOpacity = OPACITY.OUT_OF_RANGE;
  }

  const titleText = disabled
    ? '已採完'
    : proximityBubbleText ?? (node.requireItemId ? '拖曳道具至此交換' : '可採集');

  const showBubble = inRange && !disabled && !!proximityBubbleText;
  const bubbleClickable = node.acquisitionType === 'tap';

  // ── Debug：採集互動範圍圓（圓心下移、半徑 = min(w,h)，與 hitTest 邏輯一致）
  const hitRadius = Math.min(w, h);
  const hitCX = node.x;
  const hitCY = node.y + h * ISO_VISUAL.HIT_CENTER_Y_OFFSET;

  return (
    <>
      {debugConfig.showHitbox && (
        <>
          {/* 互動範圍圓：綠色虛線 */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: hitCX - hitRadius,
              top: hitCY - hitRadius,
              width: hitRadius * 2,
              height: hitRadius * 2,
              borderRadius: '50%',
              border: '1.5px dashed var(--color-resource-normal)',
              zIndex: 19,
            }}
            aria-hidden
          />
          {/* 圓心標記：綠色小點 */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: hitCX - 3,
              top: hitCY - 3,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-resource-normal)',
              zIndex: 19,
            }}
            aria-hidden
          />
        </>
      )}
      <ObjectView
        x={node.x}
        y={node.y}
        width={w}
        height={h}
        cornerRadius={node.hitbox?.cornerRadius}
        emoji={node.emoji}
        displayName={node.displayName}
        ringBgColor={ringBgColor}
        ringBorderColor={ringBorderColor}
        ringShadow={ringShadow}
        ringOpacity={ringOpacity}
        opacity={disabled ? OPACITY.DISABLED : undefined}
        playShake={playShake}
        shakeKey={shakeKey}
        playRipple={playRipple}
        bubbleText={showBubble ? proximityBubbleText : null}
        bubbleClickable={bubbleClickable}
        onBubbleClick={onTap}
        title={titleText}
      />
    </>
  );
}
