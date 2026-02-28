/**
 * MVP-01: 互動由 config 控制，事件順序 drag → tap → proximity
 */
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

  /** 靠近觸發半徑（px），與 interactionRange 對齊供既有程式使用 */
  proximityRadius: number;
  /** 拖曳放置吸附半徑（px） */
  dragSnapRadius: number;
  /** 怪物被 tap 暈眩時長（ms） */
  monsterStunMs: number;

  /** 點擊與拖曳判定閾值（px） */
  tapMoveThreshold: number;
  /** 控制環半徑（px） */
  controlRingRadius: number;
  /** 可互動距離（px）：NPC 對話、資源點採集／取水（如湖邊玻璃瓶裝水）等皆用此範圍 */
  interactionRange: number;
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
