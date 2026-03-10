import { ISO_VISUAL, BUBBLE_SPACING } from '../objectsConstants';
import { debugConfig } from '../../devVersion';

//════════════════════════════════════════════════════════════════
// ObjectView — 地圖非地形物件的統一視覺層。
//════════════════════════════════════════════════════════════════
// 渲染層次（由下到上）：
//   z-0   定位圈（ground ring）橢圓 — 承載顏色、邊框、陰影、動態
//   z-0.5 extraGroundRings（怪物冷卻/暈眩環，橢圓，疊在定位圈上）
//   z-1   漣漪圓（ripple）— 物件寬 × 0.5，置中
//   z-2   名稱標籤 — 容器下方 top-full mt-1
//   z-3   （預留主角用）
//   z-4   emoji — 物件寬為字體大小，xy 絕對置中
//   z-10  互動泡泡 — top-full -translate-y-full（壓到圈底、名稱上方）
//════════════════════════════════════════════════════════════════

interface ObjectViewProps {
  x: number;  // 物件中心 x（世界座標）
  y: number;  // 物件中心 y（世界座標）
  width: number;  // 物件寬度（px），預設 radius * 2
  height: number;  // 物件高度（px），預設 = width
  cornerRadius?: number;  // 圓角（px），預設 = width（全圓）
  emoji?: string;  // 顯示於物件正中心的 emoji
  subEmoji?: string;  // 顯示於物件正中心、主 emoji 上方的次要 emoji（如 NPC 的職業小圖示）
  displayName?: string;  // 顯示於物件下方的名稱

  // ── 定位圈視覺狀態 ──────────────────────────────────────────────
  ringBgColor?: string;
  ringBorderColor?: string;
  ringBorderWidth?: number;
  ringShadow?: string;
  ringOpacity?: number;
  ringClassName?: string;  // 動畫 class（如 animate-resource-shake）
  ringStyle?: React.CSSProperties;  // 動畫 timing 等 inline style
  extraGroundRings?: React.ReactNode;  // 怪物用：疊在定位圈上的額外環層（冷卻圈、暈眩圈等）

  playShake?: boolean;  // true → emoji wrapper 套用 animate-resource-shake
  shakeKey?: number;  // key 控制 remount 以重播晃動
  playRipple?: boolean;  // true → 渲染漣漪圓（z-1，emoji 下方）

  // ── 互動泡泡 ────────────────────────────────────────────────────
  bubbleText?: string | null;
  bubbleClickable?: boolean;  // true → <button>（NPC 任務泡泡、資源點 tap 泡泡）；false → <div aria-hidden>
  onBubbleClick?: () => void;

  // ── 資源點互動 ──────────────────────────────────────────────────
  dataResourceDrop?: string;  // 資源點 ID
  opacity?: number;  // 整體物件透明度（0–1），用於 disabled 等狀態
  containerZIndex?: number;  // 容器 div 的 z-index（建立 stacking context）。主角傳入 3 可確保顯示在名稱文字（z-2）之上、其他物件 emoji（z-3）之下。
  title?: string;
}

export function ObjectView({
  x,
  y,
  width,
  height,
  cornerRadius,
  emoji,
  subEmoji,
  displayName,
  ringBgColor,
  ringBorderColor,
  ringBorderWidth = 2,
  ringShadow,
  ringOpacity = 1,
  ringClassName,
  ringStyle,
  extraGroundRings,
  playShake = false,
  shakeKey = 0,
  playRipple = false,
  bubbleText,
  bubbleClickable = false,
  onBubbleClick,
  dataResourceDrop,
  opacity,
  containerZIndex,
  title,
}: ObjectViewProps) {
  
  // 用於計算定位圈和漣漪圓的尺寸
  const ringH = width * ISO_VISUAL.RING_HEIGHT_RATIO;
  const rippleSize = width * ISO_VISUAL.RIPPLE_SIZE_RATIO;

  return (
    <div
      className="absolute"
      style={{
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        opacity,
        zIndex: containerZIndex,
        ...(debugConfig.showHitbox && {
          outline: '1.5px dashed var(--color-primary)',
          outlineOffset: '-1px',
          borderRadius: cornerRadius ?? width,
        }),
      }}
      data-resource-drop={dataResourceDrop}
      title={title}
    >
      {/* ── 定位圈（ground ring）真橢圓，底部往下移 1/3 圈高 ─── */}
      <div
        className={`absolute pointer-events-none${ringClassName ? ` ${ringClassName}` : ''}`}
        style={{
          left: 0,
          bottom: -(ringH / 3),
          width,
          height: ringH,
          borderRadius: '50%',
          backgroundColor: ringBgColor,
          borderWidth: ringBorderWidth,
          borderStyle: 'solid',
          borderColor: ringBorderColor ?? 'transparent',
          boxShadow: ringShadow,
          opacity: ringOpacity,
          zIndex: 0,
          ...ringStyle,
        }}
        aria-hidden
      />

      {/* ── 額外環層（怪物冷卻圈 / 暈眩圈）─── */}
      {extraGroundRings}

      {/* ── 漣漪圓（資源點 ripple）─── */}
      {playRipple && (
        <div
          className="absolute rounded-full border-2 border-[var(--color-secondary)] animate-ripple-expand origin-center pointer-events-none"
          style={{
            width: rippleSize,
            height: rippleSize,
            left: (width - rippleSize) / 2,
            top: (height - rippleSize) / 2,
            zIndex: 1,
          }}
          aria-hidden
        />
      )}

      {/* ── Emoji ─── */}
      {emoji && (
        <div
          key={playShake ? shakeKey : 0}
          className={`absolute flex items-center justify-center pointer-events-none select-none leading-none${playShake ? ' animate-resource-shake' : ''}`}
          style={{
            left: 0,
            top: 0,
            width,
            height,
            fontSize: width,
            zIndex: 4,
          }}
          aria-hidden
        >
          {emoji}
        </div>
      )}

      {/* ── SubEmoji（左下角，1/4 大小）─── */}
      {subEmoji && (
        <div
          className="absolute flex items-center justify-center pointer-events-none select-none leading-none"
          style={{
            left: 0,
            bottom: 0,
            width: width / 2,
            height: width / 4,
            fontSize: width / 2,
            zIndex: 5,
          }}
          aria-hidden
        >
          {subEmoji}
        </div>
      )}

      {/* ── 名稱標籤（往下移半個泡泡高度）─── */}
      {displayName && (
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[10px] font-medium text-[var(--color-text-default)] whitespace-nowrap pointer-events-none"
          style={{ top: '100%', marginTop: BUBBLE_SPACING.marginTop, filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9))', zIndex: 2 }}
        >
          {displayName}
        </span>
      )}

      {/* ── 互動泡泡（物件上方）─── */}
      {bubbleText && (
        bubbleClickable ? (
          <button
            type="button"
            className="absolute rounded px-2 py-1 bg-[var(--color-panel)] border border-[var(--color-primary)] text-[10px] text-[var(--color-text-default)] whitespace-nowrap cursor-pointer hover:bg-[var(--color-panel-muted)] active:scale-[0.98] transition-all"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: BUBBLE_SPACING.marginBottom, zIndex: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              onBubbleClick?.();
            }}
          >
            📦 {bubbleText}
          </button>
        ) : (
          <div
            className="absolute rounded px-2 py-1 bg-[var(--color-panel)] border border-[var(--color-primary)] text-[10px] text-[var(--color-text-default)] whitespace-nowrap pointer-events-none"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: BUBBLE_SPACING.marginBottom, zIndex: 10 }}
            aria-hidden
          >
            📦 {bubbleText}
          </div>
        )
      )}

    </div>
  );
}
