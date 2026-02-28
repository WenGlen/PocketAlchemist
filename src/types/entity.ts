export type EntityType =
  | 'player'
  | 'material_node'
  | 'npc'
  | 'monster'
  | 'synthesis_panel'
  | 'exit_flag'
  | 'resource_node'
  | 'terrain';

export interface BaseEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  radius?: number;
  interactive?: boolean;
}

export interface MapEntity extends BaseEntity {
  displayName?: string;
  dialogueKey?: string;
}

/** 地形：可依屬性為可／不可經過、進入是否受傷、是否需道具清除等 */
export interface TerrainDef extends BaseEntity {
  type: 'terrain';
  /** 影響半徑（px） */
  radius: number;
  /** 是否可經過（false = 擋路，需用 requiredItemId 清除後才可過） */
  passable?: boolean;
  /** 進入範圍每 tick 扣血量；未設則不扣血 */
  damagePerTick?: number;
  /** 傷害間隔（ms），與 damagePerTick 搭配；未設則預設 100 */
  damageIntervalMs?: number;
  /** 需使用此道具（如藥劑）才能清除；清除後不再擋路且不再渲染 */
  requiredItemId?: string;
  /** 顯示名稱（如「尖刺」「藤蔓」），用於 title 等 */
  displayName?: string;
  /** 地圖上圓圈內顯示的短名稱（未設則用 displayName） */
  mapLabel?: string;
}

/** 怪物：每隔一段時間攻擊一次，可暈眩中斷；可選左右／上下巡邏 */
export interface MonsterDef extends BaseEntity {
  type: 'monster';
  /** 偵測／攻擊半徑（px） */
  radius: number;
  /** 攻擊間隔（ms） */
  attackIntervalMs: number;
  /** 單次攻擊傷害 */
  attackDamage: number;
  /** 顯示名稱（如「護巢野豬」），用於 title 等 */
  displayName?: string;
  /** 地圖上圓圈內顯示的名稱（未設則用 displayName） */
  mapLabel?: string;
  /** 巡邏：沿單軸左右或上下來回移動 */
  patrol?: {
    /** 移動軸 */
    axis: 'x' | 'y';
    /** 以定義座標為中心，單向移動距離（px） */
    range: number;
    /** 移動速度（px/s） */
    speed: number;
  };
}

/** MVP-01：終點旗標 */
export interface ExitFlagDef extends BaseEntity {
  type: 'exit_flag';
  radius: number;
}
