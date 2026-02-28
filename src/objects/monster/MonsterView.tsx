import { useMemo } from 'react';
import type { MonsterDef } from '../../types/entity';

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
  const x = position?.x ?? monster.x;
  const y = position?.y ?? monster.y;
  const label = monster.mapLabel ?? monster.displayName ?? '怪物';

  const hasAttacked = lastHitTime > 0;
  const hasCooldown = lastCooldownResetTime > 0;
  // 攻擊觸發（閃紅）vs 暈眩結束後（不閃紅）
  const isAttackCooldown = hasCooldown && lastCooldownResetTime === lastHitTime;

  // syncDelay 用 useMemo 穩定：只在 lastCooldownResetTime 改變時重新計算。
  // 若在每次 re-render（含每幀 setMonsterPositions）都重算 Date.now()，
  // animationDelay 會不斷變化 → CSS 動畫不斷重啟 → 視覺抖動/延遲。
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
    ? `${ringDuration}, ${ringDuration}, 0.5s`
    : `${ringDuration}, ${ringDuration}`;

  return (
    <div
      className="absolute"
      style={{ left: x - r, top: y - r, width: r * 2, height: r * 2 }}
    >
      {/* shake wrapper：以 key=lastHitTime 控制，只在實際攻擊時 remount → shake 觸發。
          暈眩結束時 lastHitTime 不變 → 不 remount → 不觸發 shake。
          class 只在 hasAttacked 且 !stunned 時套用（初次 remount 即播放一次）。 */}
      <div
        key={`shake-${lastHitTime}`}
        className={`absolute inset-0${hasAttacked ? ' animate-monster-attack-shake' : ''}`}
      >
        {/* 怪物本體：stunned 使用 stunned 色邊框 + 降透明；正常使用 normal 色 */}
        <div
          className={`absolute inset-0 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
            stunned
              ? 'bg-[var(--color-panel-muted)] border-[var(--color-monster-stunned)] opacity-60'
              : 'bg-[var(--color-monster-normal)]/30 border-[var(--color-monster-normal)]'
          }`}
          title={`${monster.displayName ?? '怪物'}（每隔一段時間攻擊，可點擊暈眩）`}
        >
          {label}
        </div>

        {/* 暈眩倒數圈：stunned 時顯示，0.5x→1.0x，顏色 normal；
            key=monsterStunUntil 確保每次重新暈眩動畫從頭播 */}
        {stunned && monster.stunDurationMs && (
          <div
            key={`stun-${monsterStunUntil}`}
            className="absolute inset-0 rounded-full border-2 pointer-events-none animate-monster-stun-ring"
            style={{ animationDuration: `${monster.stunDurationMs}ms` }}
            aria-hidden
          />
        )}

        {/* 攻擊冷卻圈：非 stunned 時顯示，1.5x→1.0x；
            key=lastCooldownResetTime（攻擊或暈眩結束時更新）確保動畫從頭播。
            duration/delay 由 inline 設定，避免 CSS var() 在 animation shorthand 的解析問題。
            syncDelay 經 useMemo 穩定，防止 setMonsterPositions 每幀 re-render 造成動畫重啟。 */}
        {!stunned && (
          hasCooldown ? (
            <div
              key={`ring-${lastCooldownResetTime}`}
              className={`absolute inset-0 rounded-full border-2 pointer-events-none ${
                isAttackCooldown ? 'animate-monster-ring-attack' : 'animate-monster-ring-cooldown'
              }`}
              style={{
                animationDuration: ringAnimDuration,
                animationDelay: ringAnimDelay,
              }}
              aria-hidden
            />
          ) : (
            /* 從未冷卻過 = 初始靜止 → 靜態顯示滿圈 */
            <div
              className="absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: 'var(--color-monster-cooldown)', opacity: 0.75 }}
              aria-hidden
            />
          )
        )}
      </div>
    </div>
  );
}
