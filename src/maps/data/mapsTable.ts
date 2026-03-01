export interface MapTexture {
  /** 貼圖疊加層 URL（repeat 模式） */
  overlayUrl?: string;
  /** 疊加層整體透明度，預設 1 */
  overlayOpacity?: number;
  /** 背景漸層顏色（top / mid / bottom） */
  gradientColors?: {
    top: string;
    mid: string;
    bottom: string;
  };
}

/** 地圖特性：控制該地圖啟用哪些系統 */
export interface MapFeatures {
  /** 是否啟用怪物系統（巡邏、攻擊） */
  hasMonsters?: boolean;
  /** 是否啟用地形傷害（持續扣血地形） */
  hasTerrainDamage?: boolean;
  /** 該地圖顯示的數值列表（如 ['hp']） */
  showStats?: string[];
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  walkable?: boolean;
  texture?: MapTexture;
  /** 玩家出生點座標 */
  spawnPoint?: { x: number; y: number };
  /** 地圖特性 */
  features?: MapFeatures;
}

export const MAP_FIELD_001: MapData = {
  id: 'MAP-field-001',
  name: '野外初生地',
  width: 1600,
  height: 1200,
  walkable: true,
  texture: {
    overlayUrl: 'https://www.transparenttextures.com/patterns/fresh-snow.png',
    overlayOpacity: 0.25,
    gradientColors: {
      top: 'var(--color-map-grass-top)',
      mid: 'var(--color-map-grass-mid)',
      bottom: 'var(--color-map-grass-bottom)',
    },
  },
  spawnPoint: { x: 400, y: 300 },
  features: {
    hasMonsters: true,
    hasTerrainDamage: true,
    showStats: ['hp'],
  },
};

/** 第二張地圖：幽林深處。三任務串鏈，NPC 複用，無怪物 */
export const MAP_FIELD_002: MapData = {
  id: 'MAP-field-002',
  name: '幽林深處',
  width: 1400,
  height: 1000,
  walkable: true,
  texture: {
    gradientColors: {
      top: 'var(--color-map-grass-top)',
      mid: 'var(--color-map-grass-mid)',
      bottom: 'var(--color-map-grass-bottom)',
    },
  },
  spawnPoint: { x: 400, y: 300 },
  features: {
    hasMonsters: false,
    hasTerrainDamage: false,
    showStats: [],
  },
};

export const mapsById: Record<string, MapData> = {
  [MAP_FIELD_001.id]: MAP_FIELD_001,
  [MAP_FIELD_002.id]: MAP_FIELD_002,
};

export function getMap(id: string): MapData | undefined {
  return mapsById[id];
}
