//════════════════════════════════════════════════════════════════
// 互動設定
//════════════════════════════════════════════════════════════════
// MVP-01: 互動由 config 控制，事件順序 drag → tap → proximity

export type MaterialPickupMode = 'proximity' | 'tap';
export type MonsterTapEffect = 'none' | 'stun';
export type NpcDeliveryMode = 'drag';
export type ObstacleUseMode = 'tap' | 'drag';
export type SynthesisMode = 'auto' | 'manual';

export interface InteractionConfig {
  materialPickupMode: MaterialPickupMode;
  monsterTapEffect: MonsterTapEffect;
  npcDeliveryMode: NpcDeliveryMode;
  obstacleUseMode: ObstacleUseMode;
  synthesisMode: SynthesisMode;

  // ── 距離參數 ──────────────────────────────────────────────────
  proximityRadius: number;  // 靠近觸發半徑（px）
  dragSnapRadius: number;  // 拖曳放置吸附半徑（px）
  monsterStunMs: number;  // 怪物被 tap 暈眩時長（ms）

  // ── 操作參數 ──────────────────────────────────────────────────
  tapMoveThreshold: number;  // 點擊與拖曳判定閾值（px）
  controlRingRadius: number;  // 控制環半徑（px）
  interactionRange: number;  // 可互動距離（px）：NPC 對話、資源點採集等
}

export const interactionConfig: InteractionConfig = {
  materialPickupMode: 'proximity',
  monsterTapEffect: 'stun',
  npcDeliveryMode: 'drag',
  obstacleUseMode: 'drag',
  synthesisMode: 'manual',

  proximityRadius: 80,
  dragSnapRadius: 60,
  monsterStunMs: 1000,

  tapMoveThreshold: 10,
  controlRingRadius: 80,
  interactionRange: 80,
};
