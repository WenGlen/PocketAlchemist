import { useMemo } from 'react';
import type { MonsterDef } from '../../core/types/entity';
import { ObjectView } from '../shared/ObjectView';
import { debugConfig } from '../debugForObjects';
import { ISO_VISUAL, OPACITY, MONSTER_STUN_RECOVER_DURATION } from '../objectsConstants';

interface MonsterViewProps {
  monster: MonsterDef;
  /** 即時位置（有巡邏時由 game state 提供）；未傳則用 monster.x, monster.y */
  position?: { x: number; y: number };
  stunned?: boolean;
  /** monsterStunUntil 時間戳：用於暈眩圈 key（每次重新暈眩即重置圈動畫） */
  monsterStunUntil?: number;
  /** 最後一次實際攻擊的時間戳（用於 shake wrapper key）；0 = 從未攻擊 */
  lastHitTime?: number;
  /** 冷卻圈起始時間戳（攻擊後 or 暈眩結束時更新）；0 = 初始靜止 */
  lastCooldownResetTime?: number;
}

export function MonsterView({
  monster,
  position,
  stunned = false,
  monsterStunUntil = 0,
  lastHitTime = 0,
  lastCooldownResetTime = 0,
}: MonsterViewProps) {
  const r = monster.radius;
  const w = monster.hitbox?.width ?? r * 2;
  const h = monster.hitbox?.height ?? w;
  const ringW = w;
  const ringH = w * ISO_VISUAL.RING_HEIGHT_RATIO;

  const x = position?.x ?? monster.x;
  const y = position?.y ?? monster.y;

  const hasAttacked = lastHitTime > 0;
  const hasCooldown = lastCooldownResetTime > 0;
  const isAttackCooldown = hasCooldown && lastCooldownResetTime === lastHitTime;

  // syncDelay 用 useMemo 穩定：防止 monsterPositions 每幀 re-render 造成動畫重啟
  const syncDelay = useMemo(() => {
    if (!hasCooldown) return '0ms';
    const elapsed = Date.now() - lastCooldownResetTime;
    return `-${elapsed % monster.attackIntervalMs}ms`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCooldownResetTime]);

  const ringAnimDelay = isAttackCooldown
    ? `${syncDelay}, ${syncDelay}, 0ms`
    : `${syncDelay}, ${syncDelay}`;

  const ringDuration = `${monster.attackIntervalMs}ms`;
  const ringAnimDuration = isAttackCooldown
    ? `${ringDuration}, ${ringDuration}, ${MONSTER_STUN_RECOVER_DURATION}`
    : `${ringDuration}, ${ringDuration}`;

  // ── 定位圈狀態 ──
  const ringBgColor = stunned
    ? 'var(--color-panel-muted)'
    : 'color-mix(in srgb, var(--color-monster-normal) 30%, transparent)';
  const ringBorderColor = stunned
    ? 'var(--color-monster-stunned)'
    : 'var(--color-monster-normal)';
  const ringOpacity = stunned ? OPACITY.STUNNED : OPACITY.IN_RANGE;

  // ── 額外環層（冷卻圈 / 暈眩圈），同定位圈尺寸橢圓 ──
  const extraGroundRings = (
    <>
      {stunned && monster.stunDurationMs && (
          <div
            key={`stun-${monsterStunUntil}`}
            className="absolute pointer-events-none animate-monster-stun-ring"
            style={{
              left: 0,
              bottom: -(ringH / 3),
              width: ringW,
              height: ringH,
              borderRadius: '50%',
              borderWidth: 2,
              borderStyle: 'solid',
              zIndex: 0,
              animationDuration: `${monster.stunDurationMs}ms`,
            }}
            aria-hidden
          />
        )}
        {!stunned && (
          hasCooldown ? (
            <div
              key={`ring-${lastCooldownResetTime}`}
              className={`absolute pointer-events-none ${
                isAttackCooldown ? 'animate-monster-ring-attack' : 'animate-monster-ring-cooldown'
              }`}
              style={{
                left: 0,
                bottom: -(ringH / 3),
                width: ringW,
                height: ringH,
                borderRadius: '50%',
                borderWidth: 2,
                borderStyle: 'solid',
                zIndex: 0,
                animationDuration: ringAnimDuration,
                animationDelay: ringAnimDelay,
              }}
              aria-hidden
            />
          ) : (
            <div
              className="absolute pointer-events-none"
              style={{
                left: 0,
                bottom: -(ringH / 3),
                width: ringW,
                height: ringH,
                borderRadius: '50%',
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: 'var(--color-monster-cooldown)',
                opacity: OPACITY.DEBUG_HITBOX,
                zIndex: 0,
              }}
              aria-hidden
            />
          )
        )}
    </>
  );

  // ── Debug：攻擊判定範圍圓（圓心下移、半徑縮放，與 hitTest 邏輯一致）
  const hitRadius = Math.min(w, h) * ISO_VISUAL.HIT_RADIUS_SCALE;
  const hitCX = x;
  const hitCY = y + h * ISO_VISUAL.HIT_CENTER_Y_OFFSET;

  return (
    <>
      {debugConfig.showHitbox && (
        <>
          {/* 攻擊判定範圍圓：攻擊色虛線 */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: hitCX - hitRadius,
              top: hitCY - hitRadius,
              width: hitRadius * 2,
              height: hitRadius * 2,
              borderRadius: '50%',
              border: '1.5px dashed var(--color-monster-attack)',
              zIndex: 19,
            }}
            aria-hidden
          />
          {/* 圓心標記：攻擊色小點 */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: hitCX - 3,
              top: hitCY - 3,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-monster-attack)',
              zIndex: 19,
            }}
            aria-hidden
          />
        </>
      )}
      <ObjectView
        x={x}
        y={y}
        width={w}
        height={h}
        cornerRadius={monster.hitbox?.cornerRadius}
        emoji={monster.emoji}
        displayName={monster.displayName}
        ringBgColor={ringBgColor}
        ringBorderColor={ringBorderColor}
        ringOpacity={ringOpacity}
        extraGroundRings={extraGroundRings}
        playShake={hasAttacked}
        shakeKey={lastHitTime}
        title={`${monster.displayName ?? '怪物'}（每隔一段時間攻擊，可點擊暈眩）`}
      />
    </>
  );
}
