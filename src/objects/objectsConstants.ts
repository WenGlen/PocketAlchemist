//════════════════════════════════════════════════════════════════
// 地圖物件開發用調試設定
//════════════════════════════════════════════════════════════════
// 顯示所有地圖物件的 Hitbox 邊界（黃色虛線）
// 以及資源點的採集互動範圍（綠色虛線圓）、怪物的攻擊判定範圍（紅色虛線圓）
// 
// 正式出版前應確保所有旗標為 false
//════════════════════════════════════════════════════════════════

export const debugConfig = {

  showHitbox: false,

};


//════════════════════════════════════════════════════════════════
// 物件視覺與動畫常數
//════════════════════════════════════════════════════════════════
// 集中管理等角視覺比例、透明度、UI 間距、動畫時序等數值

// ========== 等角視覺 (Isometric Visual) ==========

// 用於物件的 hitTest 判定與視覺呈現
export const ISO_VISUAL = {
  HIT_CENTER_Y_OFFSET: 0.25,  // hitTest 圓心 Y 偏移係數（相對於物件高度）
  HIT_RADIUS_SCALE: 0.75,  // hitTest 半徑縮放比例（相對於物件寬高最小值）
  RING_HEIGHT_RATIO: 0.3,  // 定位環高度比例（相對於物件寬度）
  RIPPLE_SIZE_RATIO: 0.5,  // 漣漪動畫尺寸比例（相對於物件寬度）
} as const;

// ========== 預設尺寸 ==========

export const DEFAULT_ENTITY_RADIUS = 24;  // 實體預設半徑（NPC、資源點無 radius 時的 fallback）
export const RING_BORDER_WIDTH = 2;  // 定位環預設邊框寬度（px）

// ========== Debug 視覺 ==========

export const DEBUG_VISUAL = {
  OUTLINE_WIDTH: 1.5,  // hitbox 外框虛線寬度（px）
  MARKER_SIZE: 6,  // 圓心標記尺寸（px）
} as const;

// ========== 透明度 (Opacity) ==========

// 物件狀態透明度，用於表示不同互動狀態下的視覺區分
export const OPACITY = {
  IN_RANGE: 1,  // 在互動範圍內
  OUT_OF_RANGE: 0.8,  // 超出互動範圍（略微淡化）
  DISABLED: 0.65,  // 已禁用／已採完
  STUNNED: 0.6,  // 暈眩狀態（怪物）
  DEBUG_HITBOX: 0.75,  // Debug hitbox 顯示
} as const;

// ========== UI 間距 ==========

// 泡泡提示 UI 間距
export const BUBBLE_SPACING = {
  marginTop: 12,  // 上邊距
  marginBottom: 4,  // 下邊距
} as const;

// 浮動文字偏移量
export const FLOAT_TEXT_OFFSET = {
  x: 28,  // X 軸偏移（向左）
  y: 50,  // Y 軸偏移（向上，相對於物件頂部）
} as const;

// ========== 動畫時序 ==========

// ── UI 回饋動畫 ──────────────────────────────────────────────────

export const PLACE_FEEDBACK_MS = 180;  // 放置道具回饋動畫時間（ms）
export const QUEST_CELEBRATION_MS = 2200;  // 任務完成彈窗顯示時間（ms）
export const CRAFT_CLEAR_DELAY_MS = 450;  // 合成完成後清空合成槽延遲（ms）

// ── 互動回饋清除 ─────────────────────────────────────────────────

export const FEEDBACK_CLEAR_MS = 700;  // 資源採集浮動文字清除延遲（ms）
export const STUN_FEEDBACK_CLEAR_MS = 700;  // 暈眩提示浮動文字清除延遲（ms）

// ── CSS 動畫時間 ─────────────────────────────────────────────────

export const MONSTER_STUN_RECOVER_DURATION = '0.5s';  // 怪物暈眩恢復動畫時間
