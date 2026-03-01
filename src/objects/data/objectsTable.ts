/**
 * 地圖物件定義：玩家角色、NPC、資源點、實驗室專用實體（地形／怪物／障礙）。
 * 取水／需道具互動的範圍由 config/interactionConfig.interactionRange 統一控制。
 */
import type { Hitbox, MapEntity, TerrainDef, MonsterDef } from '../../core/types/entity';

// =============================================================================
// 玩家角色（Role）
// =============================================================================

export interface RoleDef extends MapEntity {
  type: 'role';
}

export const OBJ_ROLE_001: RoleDef = {
  id: 'OBJ-role-001',
  type: 'role',
  x: 0,
  y: 0,
  hitbox: { width: 48 },
  emoji: '🧙🏻‍♂️',
};

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
  emoji: '👨‍💼',
  positionByMap: {
    'MAP-field-002': { x: 700, y: 180 },
  },
};

/** MVP-01 實驗室 NPC */
export const OBJ_NPC_002: NpcDef = {
  id: 'OBJ-npc-002',
  type: 'npc',
  x: 480,
  y: 260,
  radius: 24,
  interactive: true,
  displayName: '藥劑師',
  dialogueKey: 'npc_lab_vendor',
  emoji: '🧑‍🔬',
  positionByMap: {
    'MAP-field-002': { x: 1050, y: 680 },
  },
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
  emoji: '👨‍🌾',
};

/** MVP-02 幽林深處 NPC：旅行商人 */
export const OBJ_NPC_004: NpcDef = {
  id: 'OBJ-npc-004',
  type: 'npc',
  x: 300,
  y: 220,
  radius: 24,
  interactive: true,
  displayName: '旅行商人',
  dialogueKey: 'npc_field2_merchant',
  emoji: '🧳',
};

export const objectTable: Record<string, NpcDef> = {
  [OBJ_NPC_001.id]: OBJ_NPC_001,
  [OBJ_NPC_002.id]: OBJ_NPC_002,
  [OBJ_NPC_003.id]: OBJ_NPC_003,
  [OBJ_NPC_004.id]: OBJ_NPC_004,
};

/** 依地圖篩選 NPC。NPC 若設有 positionByMap，渲染時以 mapId 對應座標覆蓋預設 x/y */
export const npcsByMap: Record<string, NpcDef[]> = {
  'MAP-field-001': [OBJ_NPC_001, OBJ_NPC_002, OBJ_NPC_003],
  'MAP-field-002': [OBJ_NPC_004, OBJ_NPC_001, OBJ_NPC_002],
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
  /** 碰撞與視覺邊界；未設則以 radius * 2 帶入預設尺寸 */
  hitbox?: Hitbox;
  /** 顯示於物件中心的 emoji */
  emoji?: string;
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
  /** 暫時隱藏此資源點（不渲染、不碰撞），物件本身保留供日後啟用 */
  hidden?: boolean;
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
  proximityBubbleText: '點擊可採集茶葉',
  emoji: '🌳',
};

export const OBJ_RES_002: ResourceNodeDef = {
  id: 'OBJ-res-002',
  type: 'resource_node',
  x: 380,
  y: 550,
  radius: 28,
  interactive: true,
  kind: 'lake',
  displayName: '取水點',
  mapLabel: '取水點',
  mapColor: 'var(--color-secondary-50)',
  acquisitionType: 'exchange',
  requireItemId: 'ITM-mat-0001',
  resultItemId: 'ITM-mat-0003',
  requireItemEffectId: 'ripple_float',
  exchangeFloatText: '裝水成功',
  proximityBubbleText: '可用玻璃瓶裝水',
  emoji: '💧',
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
  hidden: true,
  emoji: '🪴',
};

// =============================================================================
// 資源點：MAP-field-002（幽林深處）
// =============================================================================

/** 幽林藥草叢：點擊採集藥草 */
export const OBJ_RES_004: ResourceNodeDef = {
  id: 'OBJ-res-004',
  type: 'resource_node',
  x: 560,
  y: 460,
  radius: 24,
  interactive: true,
  kind: 'herb',
  displayName: '幽林藥草',
  mapLabel: '藥草',
  mapColor: 'var(--color-map-grass-mid)',
  acquisitionType: 'tap',
  gatherItemId: 'ITM-mat-0004',
  gatherLimitByMap: { 'MAP-field-002': 5 },
  gatherEffectId: 'shake_float',
  gatherFloatText: '+1 藥草',
  proximityBubbleText: '點擊可採集藥草',
  emoji: '🌿',
};

/** 古茶樹：點擊採集茶葉 */
export const OBJ_RES_005: ResourceNodeDef = {
  id: 'OBJ-res-005',
  type: 'resource_node',
  x: 920,
  y: 340,
  radius: 28,
  interactive: true,
  kind: 'tea_tree',
  displayName: '古茶樹',
  mapLabel: '古茶樹',
  mapColor: 'var(--color-map-grass-mid)',
  acquisitionType: 'tap',
  gatherItemId: 'ITM-mat-0002',
  gatherLimitByMap: { 'MAP-field-002': 4 },
  gatherEffectId: 'shake_float',
  gatherFloatText: '+1 茶葉',
  proximityBubbleText: '點擊可採集茶葉',
  emoji: '🌳',
};

/** 山泉：拖曳玻璃瓶裝水 */
export const OBJ_RES_006: ResourceNodeDef = {
  id: 'OBJ-res-006',
  type: 'resource_node',
  x: 200,
  y: 620,
  radius: 28,
  interactive: true,
  kind: 'lake',
  displayName: '山泉',
  mapLabel: '山泉',
  mapColor: 'var(--color-secondary-50)',
  acquisitionType: 'exchange',
  requireItemId: 'ITM-mat-0001',
  resultItemId: 'ITM-mat-0003',
  requireItemEffectId: 'ripple_float',
  exchangeFloatText: '裝水成功',
  proximityBubbleText: '可用玻璃瓶裝山泉水',
  emoji: '🌊',
};

export const resourceNodes: ResourceNodeDef[] = [
  OBJ_RES_001, OBJ_RES_002, OBJ_RES_003,
  OBJ_RES_004, OBJ_RES_005, OBJ_RES_006,
];

/** 依地圖篩選資源點 */
export const resourceNodesByMap: Record<string, ResourceNodeDef[]> = {
  'MAP-field-001': [OBJ_RES_001, OBJ_RES_002, OBJ_RES_003],
  'MAP-field-002': [OBJ_RES_004, OBJ_RES_005, OBJ_RES_006],
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
export const OBJ_TER_001: TerrainDef = {
  id: 'OBJ-ter-001',
  type: 'terrain',
  x: 560,
  y: 600,
  radius: 70,
  interactive: false,
  passable: true,
  damagePerTick: 1,
  damageIntervalMs: 100,
  displayName: '毒沼澤',
  mapLabel: '毒沼澤',
};

/** 藤蔓：不可經過，需藥劑清除 */
export const OBJ_TER_002: TerrainDef = {
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

/**
 * 湖：不可穿越的大型地形，圓形，位於取水點（OBJ-res-002, x=380, y=540, r=28）正下方。
 * 上邊緣 = 取水點下邊緣（540+28=568）→ y = 568 + 120 = 688
 */
export const OBJ_TER_003: TerrainDef = {
  id: 'OBJ-ter-003',
  type: 'terrain',
  x: 380,
  y: 688,
  radius: 120,
  interactive: false,
  passable: false,
  shape: 'circle',
  mapColor: 'var(--color-secondary)',
  displayName: '湖',
  mapLabel: '湖',
};

// =============================================================================
// 怪物
// =============================================================================

/** 護巢野豬：會左右巡邏 */
export const OBJ_MOB_001: MonsterDef = {
  id: 'OBJ-mob-001',
  type: 'monster',
  x: 680,
  y: 320,
  radius: 36,
  interactive: true,
  attackIntervalMs: 2000,
  attackDamage: 1,
  stunDurationMs: 3000,
  displayName: '護巢野豬',
  mapLabel: '護巢野豬',
  patrol: { axis: 'x', range: 80, speed: 50 },
  emoji: '🐗',
};

export const objTerrains: TerrainDef[] = [OBJ_TER_001, OBJ_TER_002, OBJ_TER_003];
export const objMonsters: MonsterDef[] = [OBJ_MOB_001];

export function getLabTerrain(id: string): TerrainDef | undefined {
  return objTerrains.find((t) => t.id === id);
}

export function getLabMonster(id: string): MonsterDef | undefined {
  return objMonsters.find((m) => m.id === id);
}

/** 取得某地圖「會擋路」的地形位置（passable === false 且尚未清除），供移動碰撞用 */
export function getBlockingTerrainsForMap(
  mapId: string,
  terrainClearedIds: Record<string, boolean>
): { x: number; y: number; radius: number }[] {
  if (mapId !== 'MAP-field-001') return [];
  return objTerrains
    .filter((t) => t.passable === false && !terrainClearedIds[t.id])
    .map((t) => ({ x: t.x, y: t.y, radius: t.radius }));
}
