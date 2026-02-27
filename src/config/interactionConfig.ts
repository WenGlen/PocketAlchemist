/** NPC 與湖之間距離約 240，一半為互動範圍 */
const NPC_X = 280;
const NPC_Y = 220;
const LAKE_X = 350;
const LAKE_Y = 450;
const DIST_NPC_LAKE = Math.hypot(LAKE_X - NPC_X, LAKE_Y - NPC_Y);

export const interactionConfig = {
  tapMoveThreshold: 10,
  controlRingRadius: 80,
  /** 可互動距離：NPC 到湖水距離的一半 */
  interactionRange: Math.floor(DIST_NPC_LAKE / 2),
} as const;
