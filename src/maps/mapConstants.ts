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

export const DEFAULT_MAP_ID = 'MAP-field-002';  // 預設初始地圖 ID（暫時跳過地圖一）
export const DEFAULT_QUEST_ID = 'QST-main-003';  // 預設初始任務 ID（地圖二起始任務）
