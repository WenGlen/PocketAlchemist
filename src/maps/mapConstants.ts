//════════════════════════════════════════════════════════════════
// 地圖相關常數
//════════════════════════════════════════════════════════════════
// 集中管理地圖邊界、視埠、初始設定等數值

// ========== 地圖預設值 ==========

export const DEFAULT_MAP_WIDTH = 1600;  // 地圖邊界預設寬度
export const DEFAULT_MAP_HEIGHT = 1200;  // 地圖邊界預設高度

// ========== 視埠 ==========

// 視埠初始尺寸（ResizeObserver 尚未取得實際尺寸前的 fallback）
export const DEFAULT_VIEWPORT_SIZE: { w: number; h: number } = {
  w: 400,
  h: 300,
};

// ========== 時間常數 ==========

export const PROXIMITY_TICK_MS = 100;  // Proximity 檢測節流間隔（ms）

// ========== 初始設定 ==========

export const DEFAULT_MAP_ID = 'MAP-field-003';  // 預設初始地圖 ID（微光村斷崖）
export const DEFAULT_QUEST_ID = 'QST-main-006';  // 預設初始任務 ID（地圖三起始任務）

/**
 * 各地圖進入時，預設隱藏的 NPC ID 列表
 * 這些 NPC 由任務邏輯（showNpc / hideNpc）控制出現時機
 */
export const MAP_INITIAL_HIDDEN_NPCS: Record<string, string[]> = {
  'MAP-field-003': ['OBJ-npc-006'],  // 小迪：QST-006 完成後才現身，QST-007 完成後離場
};
