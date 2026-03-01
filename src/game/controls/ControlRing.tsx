import { interactionConfig } from '../../core/config/interactionConfig';

interface ControlRingProps {
  visible: boolean;
  screenX: number;
  screenY: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  /** 目前移動向量，用於旋轉黃色 1/4 圓弧 */
  moveDir?: { x: number; y: number };
}

export function ControlRing({
  visible,
  screenX,
  screenY,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  moveDir,
}: ControlRingProps) {
  if (!visible) return null;

  const r = interactionConfig.controlRingRadius;
  const hasDir = moveDir && (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.y) > 0.01);
  // CSS border-arc 的 0 度起點在上方，與 atan2 的 0 度（+X 軸）差 90 度，另加 180 度讓弧線指向與移動向量相同方向
  const angleDeg = hasDir ? (Math.atan2(moveDir!.y, moveDir!.x) * 180) / Math.PI + 90 : 0;
  const speedFactor = hasDir ? Math.min(Math.hypot(moveDir!.x, moveDir!.y), 1) : 0;
  const borderWidth = 2 + 7 * speedFactor; // 2px ~ 9px，最大粗度為原本的約 1.5 倍

  return (
    <div
      className="absolute rounded-full border-2 border-[var(--color-border)] bg-[var(--color-panel-25)] pointer-events-auto touch-none animate-control-ring-appear animate-control-ring-breathe"
      style={{
        left: screenX - r,
        top: screenY - r,
        width: r * 2,
        height: r * 2,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* 黃色 1/4 圓弧（較粗），其餘為白色外圈 */}
      <div
        className="absolute inset-1 rounded-full border-solid border-[var(--color-primary)] border-l-transparent border-b-transparent border-r-transparent"
        style={{ transform: `rotate(${angleDeg}deg)`, borderWidth }}
        aria-hidden
      />
    </div>
  );
}
