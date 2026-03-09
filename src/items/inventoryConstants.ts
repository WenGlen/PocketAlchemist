//════════════════════════════════════════════════════════════════
// 背包與合成介面常數
//════════════════════════════════════════════════════════════════
// 集中管理道具欄位尺寸、拖曳閾值、容量等數值

// ========== 欄位尺寸 ==========

export const SLOT_OUTER_SIZE_PX = 64;  // 欄位外框尺寸（px）
export const SLOT_BORDER_PX = 2;  // 欄位邊框寬度（px）
export const ITEM_BOX_GAP_PX = 1;  // 道具小框與邊框間距（px）

// 道具小框尺寸（px），由外框尺寸扣除邊框與間距計算
export const ITEM_BOX_SIZE_PX =
  SLOT_OUTER_SIZE_PX - SLOT_BORDER_PX * 2 - ITEM_BOX_GAP_PX * 2;

// ========== 拖曳設定 ==========

export const DRAG_THRESHOLD_PX = 10;  // 拖曳判定閾值（px），移動超過此距離才視為拖曳
export const DRAG_GHOST_Z_INDEX = 2147483647;  // 拖曳幽靈 z-index（最高層級確保可見）

// ========== 容量設定 ==========

export const BACKPACK_CAPACITY = 8;  // 背包預設容量（格數）
export const SYNTHESIS_SLOTS = 2;  // 合成槽數量
export const PROCESSING_SLOTS = 1;  // 加工槽數量
