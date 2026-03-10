//════════════════════════════════════════════════════════════════
// 可選任務列表（選單用）
//════════════════════════════════════════════════════════════════

export interface QuestEntry {
  mapId: string;
  questId: string;
  name: string;
  chainOrder?: number;  // 串鏈排序：同地圖同鏈內的顯示順序，未設視為 0
}

export const questList: QuestEntry[] = [
  // ── MAP-field-001 ──────────────────────────────────────────────
  { mapId: 'MAP-field-001', questId: 'QST-main-001', name: '要喝茶', chainOrder: 1 },
  { mapId: 'MAP-field-001', questId: 'QST-main-002', name: '實驗室訂單', chainOrder: 2 },

  // ── MAP-field-002（幽林深處，三任務串鏈）──────────────────────
  { mapId: 'MAP-field-002', questId: 'QST-main-003', name: '商旅的委托', chainOrder: 1 },
  { mapId: 'MAP-field-002', questId: 'QST-main-004', name: '古茶樹的滋味', chainOrder: 2 },
  { mapId: 'MAP-field-002', questId: 'QST-main-005', name: '緊急藥水訂單', chainOrder: 3 },

  // ── MAP-shimmer-001（微光村斷崖，六任務串鏈）────────────────────
  // 任務線一：林間的鏽蝕迴聲（救援老漢克）
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-006', name: '意外的呻吟', chainOrder: 1 },
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-007', name: '求援的腳蹤', chainOrder: 2 },
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-008', name: '野派的應急處理', chainOrder: 3 },
  // 任務線二：完美的齒輪油（工具品質教學）
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-009', name: '湊合著用的下場', chainOrder: 4 },
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-010', name: '濾網的力量', chainOrder: 5 },
  { mapId: 'MAP-shimmer-001', questId: 'QST-main-011', name: '核心共鳴提取', chainOrder: 6 },
];

export function getQuestByMapId(mapId: string): QuestEntry | undefined {
  return questList.find((q) => q.mapId === mapId);
}
