/**
 * 可選任務列表（選單用）
 */
export interface MissionEntry {
  mapId: string;
  questId: string;
  name: string;
  /** 串鏈排序：同地圖同鏈內的顯示順序，未設視為 0 */
  chainOrder?: number;
}

export const missionList: MissionEntry[] = [
  // MAP-field-001
  { mapId: 'MAP-field-001', questId: 'QST-main-001', name: '要喝茶', chainOrder: 1 },
  { mapId: 'MAP-field-001', questId: 'QST-main-002', name: '實驗室訂單', chainOrder: 2 },
  // MAP-field-002（幽林深處，三任務串鏈）
  { mapId: 'MAP-field-002', questId: 'QST-main-003', name: '商旅的委托', chainOrder: 1 },
  { mapId: 'MAP-field-002', questId: 'QST-main-004', name: '古茶樹的滋味', chainOrder: 2 },
  { mapId: 'MAP-field-002', questId: 'QST-main-005', name: '緊急藥水訂單', chainOrder: 3 },
];

export function getMissionByMapId(mapId: string): MissionEntry | undefined {
  return missionList.find((m) => m.mapId === mapId);
}
