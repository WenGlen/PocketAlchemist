/**
 * 地圖物件定義：NPC、資源點、實驗室專用實體（地形／怪物／障礙）。
 * 取水／需道具互動的範圍由 config/interactionConfig.interactionRange 統一控制。
 */
import type { MapEntity, TerrainDef, MonsterDef } from '../../types/entity';

// =============================================================================
// NPC
// =============================================================================

export interface NpcDef extends MapEntity {
  type: 'npc';
  displayName: string;
  dialogueKey: string;
}

export const OBJ_NPC_001: NpcDef = {
  id: 'OBJ-npc-001',
  type: 'npc',
  x: 280,
  y: 220,
  radius: 24,
  interactive: true,
  displayName: '茶攤老闆',
  dialogueKey: 'npc_tea_vendor',
};

/** MVP-01 實驗室 NPC */
export const OBJ_NPC_002: NpcDef = {
  id: 'OBJ-npc-002',
  type: 'npc',
  x: 480,
  y: 260,
  radius: 24,
  interactive: true,
  displayName: '實驗員',
  dialogueKey: 'npc_lab_vendor',
};

export const OBJ_NPC_003: NpcDef = {
  id: 'OBJ-npc-003',
  type: 'npc',
  x: 180,
  y: 400,
  radius: 24,
  interactive: true,
  displayName: '園丁',
  dialogueKey: 'npc_lab_gardener',
};

export const objectTable: Record<string, NpcDef> = {
  [OBJ_NPC_001.id]: OBJ_NPC_001,
  [OBJ_NPC_002.id]: OBJ_NPC_002,
  [OBJ_NPC_003.id]: OBJ_NPC_003,
};

/** 依地圖篩選 NPC（單一整合地圖 MAP-field-001） */
export const npcsByMap: Record<string, NpcDef[]> = {
  'MAP-field-001': [OBJ_NPC_001, OBJ_NPC_002, OBJ_NPC_003],
};

export function getObject(id: string): NpcDef | undefined {
  return objectTable[id];
}

// =============================================================================
// 資源點（MVP-00.01：茶樹、湖；MVP-01：藥草）
// =============================================================================

export type ResourceKind = 'tea_tree' | 'lake' | 'herb';

/** 取得方式：點擊直接獲得 / 給予道具交換 / 使用工具（預留） */
export type ResourceAcquisitionType = 'tap' | 'exchange' | 'tool';

export interface ResourceNodeDef {
  id: string;
  type: 'resource_node';
  x: number;
  y: number;
  radius: number;
  interactive: boolean;
  kind: ResourceKind;
  displayName: string;
  /** 地圖上顯示的名稱（由物件表控管） */
  mapLabel: string;
  /** 地圖上圓點背景的 CSS 變數（如 var(--color-map-grass-mid)），未設則用預設 */
  mapColor?: string;
  /** 取得方式：tap=點擊獲得、exchange=拖曳道具交換、tool=使用工具（預留） */
  acquisitionType?: ResourceAcquisitionType;
  /** 點擊採集得到的 itemId（acquisitionType tap 時使用） */
  gatherItemId?: string;
  /** 交換時需要的道具 itemId（acquisitionType exchange，如玻璃瓶） */
  requireItemId?: string;
  /** 交換後得到的道具 itemId（如裝水的玻璃瓶） */
  resultItemId?: string;
  /** 可採集次數：依地圖綁定，key=mapId、value=該地圖上限；未列出的地圖為無限 */
  gatherLimitByMap?: Record<string, number>;
  /** 採集時特效編號（見 objects/resource/resourceEffectRegistry），如 'shake_float' */
  gatherEffectId?: string;
  /** 交換時特效編號，如 'ripple_float' */
  requireItemEffectId?: string;
  /** 採集成功時浮動文字（如「+1 茶葉」），未設則用「+1 {道具名}」 */
  gatherFloatText?: string;
  /** 交換成功時浮動文字（如「裝水成功」） */
  exchangeFloatText?: string;
  /** 靠近時泡泡說明（與可接任務泡泡同風格），如「可採集茶葉」「拖曳玻璃瓶至此裝水」 */
  proximityBubbleText?: string;
}

export const OBJ_RES_001: ResourceNodeDef = {
  id: 'OBJ-res-001',
  type: 'resource_node',
  x: 620,
  y: 300,
  radius: 28,
  interactive: true,
  kind: 'tea_tree',
  displayName: '茶樹',
  mapLabel: '茶樹',
  mapColor: 'var(--color-map-grass-mid)',
  acquisitionType: 'tap',
  gatherItemId: 'ITM-mat-0002',
  gatherLimitByMap: { 'MAP-field-001': 3 },
  gatherEffectId: 'shake_float',
  gatherFloatText: '+1 茶葉',
  proximityBubbleText: '可採集茶葉',
};

export const OBJ_RES_002: ResourceNodeDef = {
  id: 'OBJ-res-002',
  type: 'resource_node',
  x: 380,
  y: 540,
  radius: 52,
  interactive: true,
  kind: 'lake',
  displayName: '湖',
  mapLabel: '湖',
  mapColor: 'var(--color-secondary-50)',
  acquisitionType: 'exchange',
  requireItemId: 'ITM-mat-0001',
  resultItemId: 'ITM-mat-0003',
  requireItemEffectId: 'ripple_float',
  exchangeFloatText: '裝水成功',
  proximityBubbleText: '可用玻璃瓶裝水',
};

export const OBJ_RES_003: ResourceNodeDef = {
  id: 'OBJ-res-003',
  type: 'resource_node',
  x: 160,
  y: 300,
  radius: 24,
  interactive: true,
  kind: 'herb',
  displayName: '藥草',
  mapLabel: '藥草',
  mapColor: 'var(--color-map-grass-mid)',
  acquisitionType: 'tap',
  gatherItemId: 'ITM-mat-0004',
  gatherEffectId: 'shake_float',
  gatherFloatText: '+1 藥草',
  proximityBubbleText: '可採集藥草',
};

export const resourceNodes: ResourceNodeDef[] = [OBJ_RES_001, OBJ_RES_002, OBJ_RES_003];

/** 依地圖篩選資源點（單一整合地圖 MAP-field-001） */
export const resourceNodesByMap: Record<string, ResourceNodeDef[]> = {
  'MAP-field-001': [OBJ_RES_001, OBJ_RES_002, OBJ_RES_003],
};

export function getResourceNode(id: string): ResourceNodeDef | undefined {
  return resourceNodes.find((n) => n.id === id);
}

/** 取得節點在指定地圖的可採次數上限（undefined = 無限） */
export function getGatherLimitForNode(node: ResourceNodeDef, mapId: string): number | undefined {
  return node.gatherLimitByMap?.[mapId];
}

/** 取得某地圖資源點「剩餘可採次數」初始值（僅有 gatherLimitByMap 的節點），供遊戲狀態初始化 */
export function getInitialResourceRemainingForMap(mapId: string): Record<string, number> {
  const nodes = resourceNodesByMap[mapId] ?? [];
  const out: Record<string, number> = {};
  for (const node of nodes) {
    const limit = getGatherLimitForNode(node, mapId);
    if (limit != null) out[node.id] = limit;
  }
  return out;
}

/** 取得某地圖上「需要道具才能互動」的資源點（如湖邊、水源需玻璃瓶），供統一判斷高亮與範圍用 */
export function getResourceNodesRequiringItem(mapId: string): ResourceNodeDef[] {
  const nodes = resourceNodesByMap[mapId] ?? [];
  return nodes.filter((n): n is ResourceNodeDef & { requireItemId: string } => !!n.requireItemId);
}

// =============================================================================
// 地形、怪物、障礙物（同地圖 MAP-field-001）
// =============================================================================

/** 尖刺：可經過，進入範圍持續扣血 */
export const LAB_TERRAIN_001: TerrainDef = {
  id: 'OBJ-ter-001',
  type: 'terrain',
  x: 560,
  y: 560,
  radius: 70,
  interactive: false,
  passable: true,
  damagePerTick: 8,
  damageIntervalMs: 100,
  displayName: '尖刺',
  mapLabel: '尖刺',
};

/** 藤蔓：不可經過，需藥劑清除 */
export const LAB_TERRAIN_002: TerrainDef = {
  id: 'OBJ-ter-002',
  type: 'terrain',
  x: 240,
  y: 520,
  radius: 32,
  interactive: true,
  passable: false,
  requiredItemId: 'ITM-pot-0002',
  displayName: '藤蔓（需藥劑清除）',
  mapLabel: '藤蔓',
};

/** 護巢野豬：會左右巡邏 */
export const LAB_MONSTER_001: MonsterDef = {
  id: 'OBJ-mob-001',
  type: 'monster',
  x: 720,
  y: 280,
  radius: 36,
  interactive: true,
  attackIntervalMs: 2000,
  attackDamage: 15,
  displayName: '護巢野豬',
  mapLabel: '護巢野豬',
  patrol: { axis: 'x', range: 80, speed: 50 },
};

export const labTerrains: TerrainDef[] = [LAB_TERRAIN_001, LAB_TERRAIN_002];
export const labMonsters: MonsterDef[] = [LAB_MONSTER_001];

export function getLabTerrain(id: string): TerrainDef | undefined {
  return labTerrains.find((t) => t.id === id);
}

export function getLabMonster(id: string): MonsterDef | undefined {
  return labMonsters.find((m) => m.id === id);
}

/** 取得某地圖「會擋路」的地形位置（passable === false 且尚未清除），供移動碰撞用 */
export function getBlockingTerrainsForMap(
  mapId: string,
  terrainClearedIds: Record<string, boolean>
): { x: number; y: number; radius: number }[] {
  if (mapId !== 'MAP-field-001') return [];
  return labTerrains
    .filter((t) => t.passable === false && !terrainClearedIds[t.id])
    .map((t) => ({ x: t.x, y: t.y, radius: t.radius }));
}
