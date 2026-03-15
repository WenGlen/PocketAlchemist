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
  // ── MAP-field-003（微光村斷崖，任務線：林間的鏽蝕迴聲）──────
  { mapId: 'MAP-field-003', questId: 'QST-main-006', name: '意外的呻吟', chainOrder: 1 },
  { mapId: 'MAP-field-003', questId: 'QST-main-007', name: '求援的腳蹤', chainOrder: 2 },
  { mapId: 'MAP-field-003', questId: 'QST-main-008', name: '野派的應急處理', chainOrder: 3 },
];

export function getQuestByMapId(mapId: string): QuestEntry | undefined {
  return questList.find((q) => q.mapId === mapId);
}
