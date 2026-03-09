//════════════════════════════════════════════════════════════════
// 地圖定義表
//════════════════════════════════════════════════════════════════
// 全遊戲地圖定義的單一來源
// 包含尺寸、出生點、紋理、特性等
//════════════════════════════════════════════════════════════════

// ========== 型別定義 ==========

export interface MapTexture {
  overlayUrl?: string;  // 貼圖疊加層 URL（repeat 模式）
  overlayOpacity?: number;  // 疊加層整體透明度，預設 1
  gradientColors?: {
    top: string;
    mid: string;
    bottom: string;
  };
}

// 地圖特性：控制該地圖啟用哪些系統
export interface MapFeatures {
  walkable?: boolean;  // 是否允許玩家自由移動（預設 true）
  hasMonsters?: boolean;   // 是否啟用怪物系統（巡邏、攻擊）
  hasTerrainDamage?: boolean;   // 是否啟用地形傷害（持續扣血地形）
  showStats?: string[];  // 該地圖顯示的數值列表（如 ['hp']）
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  texture?: MapTexture;
  spawnPoint?: { x: number; y: number };  // 玩家出生點座標
  features?: MapFeatures;  // 地圖特性(定義在上方)
}

// ========== MAP-field-001 野外初生地 ==========

export const MAP_FIELD_001: MapData = {
  id: 'MAP-field-001',
  name: '野外初生地',
  width: 1600,
  height: 1200,
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
    walkable: true,
    hasMonsters: true,
    hasTerrainDamage: true,
    showStats: ['hp'],
  },
};

// ========== MAP-field-002 幽林深處 ==========
// 三任務串鏈，NPC 複用，無怪物

export const MAP_FIELD_002: MapData = {
  id: 'MAP-field-002',
  name: '幽林深處',
  width: 1400,
  height: 1000,
  texture: {
    gradientColors: {
      top: 'var(--color-map-grass-top)',
      mid: 'var(--color-map-grass-mid)',
      bottom: 'var(--color-map-grass-bottom)',
    },
  },
  spawnPoint: { x: 400, y: 300 },
  features: {
    walkable: true,
    hasMonsters: false,
    hasTerrainDamage: false,
    showStats: [],
  },
};

// ========== MAP-shimmer-001 微光村斷崖 ==========
// 【林間的鏽蝕迴聲】任務線場景
// 小型地圖，老漢克受困於此

export const MAP_SHIMMER_001: MapData = {
  id: 'MAP-shimmer-001',
  name: '微光村斷崖',
  width: 1000,
  height: 800,
  texture: {
    overlayUrl: 'https://www.transparenttextures.com/patterns/dust.png',
    overlayOpacity: 0.2,
    gradientColors: {
      top: '#4a5568',  // 岩石灰
      mid: '#68705c',  // 苔蘚綠灰
      bottom: '#3d4a3a',  // 深林暗綠
    },
  },
  spawnPoint: { x: 500, y: 600 },
  features: {
    walkable: true,
    hasMonsters: false,
    hasTerrainDamage: false,
    showStats: [],
  },
};

// ========== 地圖表與查詢 ==========

export const mapsById: Record<string, MapData> = {
  [MAP_FIELD_001.id]: MAP_FIELD_001,
  [MAP_FIELD_002.id]: MAP_FIELD_002,
  [MAP_SHIMMER_001.id]: MAP_SHIMMER_001,
};

export function getMap(id: string): MapData | undefined {
  return mapsById[id];
}
