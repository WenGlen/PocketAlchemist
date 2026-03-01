//════════════════════════════════════════════════════════════════
// 能力／數值顯示配置（規格書 §7 能力範疇）
//════════════════════════════════════════════════════════════════
// 定義「有哪些數值」、「顯示名稱／樣式」、「哪些地圖顯示」
// 實際數值由 game state 或未來能力系統提供

export type StatId = 'hp';

export interface StatDisplayDef {
  id: StatId;
  label: string;
  barColor?: string;  // 進度條顏色，未設則用預設
}

// 所有數值定義（單一來源）
export const statDisplayDefs: Record<StatId, StatDisplayDef> = {
  hp: {
    id: 'hp',
    label: 'HP',
    barColor: 'var(--color-text-error)',
  },
};

// 各地圖要顯示的數值 ID 列表（空則不顯示該區塊）
export const statIdsByMap: Record<string, StatId[]> = {
  'MAP-field-001': ['hp'],
};

export interface StatValue {
  id: StatId;
  label: string;
  current: number;
  max: number;
  barColor?: string;
}

// 遊戲狀態提供的數值（僅 HP 時由 useGameState 提供）
export interface GameStateStatValues {
  hp: number;
  hpMax: number;
}

// 依地圖與當前遊戲狀態，回傳要顯示的數值列表（供 StatsBar 使用）
export function getDisplayStats(
  mapId: string,
  values: GameStateStatValues
): StatValue[] {
  const ids = statIdsByMap[mapId];
  if (!ids?.length) return [];
  return ids.map((id) => {
    const def = statDisplayDefs[id];
    const current = id === 'hp' ? values.hp : 0;
    const max = id === 'hp' ? values.hpMax : 1;
    return {
      id: def.id,
      label: def.label,
      current,
      max,
      barColor: def.barColor,
    };
  });
}
