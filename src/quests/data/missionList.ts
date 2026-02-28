/**
 * 可選任務列表（選單用）
 */
export interface MissionEntry {
  mapId: string;
  questId: string;
  name: string;
}

export const missionList: MissionEntry[] = [
  { mapId: 'MAP-field-001', questId: 'QST-main-001', name: '要喝茶' },
  { mapId: 'MAP-field-001', questId: 'QST-main-002', name: '實驗室訂單' },
];

export function getMissionByMapId(mapId: string): MissionEntry | undefined {
  return missionList.find((m) => m.mapId === mapId);
}
