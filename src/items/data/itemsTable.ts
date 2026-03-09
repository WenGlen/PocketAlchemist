//════════════════════════════════════════════════════════════════
// 道具定義表
//════════════════════════════════════════════════════════════════
// 全遊戲道具定義與性質的單一來源
// 堆疊、名稱、圖示等皆以此表為準
// 任務、合成表、資源點僅引用 itemId，勿在別處重複定義性質
//════════════════════════════════════════════════════════════════

export type ItemSubCategory = 'pot' | 'mat' | 'eqp' | 'qst';

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  description: string;
  subCategory: ItemSubCategory;
  part?: string;   // 裝備部位，如 'hand'
  skill?: string;  // 裝備技能面板 ID，如 'synthesis' | 'processing'
  stackable: boolean;  // 是否可堆疊（與 maxStack 並用：未設 maxStack 時視為 99）
  maxStack?: number;  // 單格最大堆疊數，未設時可堆疊物為 99、不可堆疊為 1
}

// ========== 素材 ==========

export const ITM_MAT_0001: ItemDef = {
  id: 'ITM-mat-0001',
  name: '玻璃瓶',
  emoji: '🫙',
  icon: '/placeholder-icon.svg',
  description: '可裝水的空瓶',
  subCategory: 'mat',
  stackable: false,
  maxStack: 1,
};

export const ITM_MAT_0002: ItemDef = {
  id: 'ITM-mat-0002',
  name: '茶葉',
  emoji: '🌿',
  icon: '/placeholder-icon.svg',
  description: '從茶樹採的葉子',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

export const ITM_MAT_0003: ItemDef = {
  id: 'ITM-mat-0003',
  name: '裝水的玻璃瓶',
  emoji: '💧',
  icon: '/placeholder-icon.svg',
  description: '在湖邊裝水後的玻璃瓶',
  subCategory: 'mat',
  stackable: false,
  maxStack: 1,
};

export const ITM_MAT_0004: ItemDef = {
  id: 'ITM-mat-0004',
  name: '藥草',
  emoji: '🌱',
  icon: '/placeholder-icon.svg',
  description: '採集用素材',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

export const ITM_MAT_0006: ItemDef = {
  id: 'ITM-mat-0006',
  name: '火粉',
  emoji: '🔥',
  icon: '/placeholder-icon.svg',
  description: '可燃粉末',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// ========== 藥劑 ==========

export const ITM_POT_0001: ItemDef = {
  id: 'ITM-pot-0001',
  name: '不好喝的茶',
  emoji: '🍵',
  icon: '/placeholder-icon.svg',
  description: '茶葉與湖水合成的茶',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

export const ITM_POT_0002: ItemDef = {
  id: 'ITM-pot-0002',
  name: '治療藥水',
  emoji: '❤️‍🩹',
  icon: '/placeholder-icon.svg',
  description: '藥草與裝水的玻璃瓶合成',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

export const ITM_POT_0003: ItemDef = {
  id: 'ITM-pot-0003',
  name: '爆裂藥水',
  emoji: '💥',
  icon: '/placeholder-icon.svg',
  description: '火粉與裝水的玻璃瓶合成',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

// ========== 微光村斷崖任務道具 ==========

// 清淤草：發出淡淡紫光的長葉草
export const ITM_MAT_0010: ItemDef = {
  id: 'ITM-mat-0010',
  name: '清淤草',
  emoji: '🪻',
  icon: '/placeholder-icon.svg',
  description: '發出淡淡紫光的長葉草，可吸除鏽蝕毒素',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// 清淤草藥碎：搗碎後的清淤草
export const ITM_MAT_0011: ItemDef = {
  id: 'ITM-mat-0011',
  name: '清淤草藥碎',
  emoji: '🫚',
  icon: '/placeholder-icon.svg',
  description: '搗碎的清淤草，可直接敷在傷口上',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// 螢茸豬油：從螢茸豬身上取得的油脂
export const ITM_MAT_0012: ItemDef = {
  id: 'ITM-mat-0012',
  name: '螢茸豬油',
  emoji: '🐷',
  icon: '/placeholder-icon.svg',
  description: '螢光林野豬的油脂，可用於合成潤滑劑',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// 磨細的石晶粉：合成潤滑劑的添加劑
export const ITM_MAT_0013: ItemDef = {
  id: 'ITM-mat-0013',
  name: '磨細的石晶粉',
  emoji: '✨',
  icon: '/placeholder-icon.svg',
  description: '細密的晶體粉末，可增加潤滑效果',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// 澄清豬油：過濾後的豬油
export const ITM_MAT_0014: ItemDef = {
  id: 'ITM-mat-0014',
  name: '澄清豬油',
  emoji: '🫧',
  icon: '/placeholder-icon.svg',
  description: '經過濾網過濾後的純淨豬油',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

// 混濁潤滑油：品質差的潤滑油
export const ITM_POT_0004: ItemDef = {
  id: 'ITM-pot-0004',
  name: '混濁潤滑油',
  emoji: '🛢️',
  icon: '/placeholder-icon.svg',
  description: '雜質太多的潤滑油，品質不佳',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

// 精製潤滑油：品質良好的潤滑油
export const ITM_POT_0005: ItemDef = {
  id: 'ITM-pot-0005',
  name: '精製潤滑油',
  emoji: '⚗️',
  icon: '/placeholder-icon.svg',
  description: '經過濾後合成的潤滑油，品質良好',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

// 極致藍光潤滑劑：最高品質的潤滑劑
export const ITM_POT_0006: ItemDef = {
  id: 'ITM-pot-0006',
  name: '極致藍光潤滑劑',
  emoji: '💙',
  icon: '/placeholder-icon.svg',
  description: '以古文明共鳴燒瓶合成的頂級潤滑劑，散發藍光',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

// ========== 裝備 ==========

export const ITM_EQP_0001: ItemDef = {
  id: 'ITM-eqp-0001',
  name: '簡易加熱器',
  emoji: '🔧',
  icon: '/placeholder-icon.svg',
  description: '可進行基礎合成的手持工具',
  subCategory: 'eqp',
  part: 'hand',
  skill: 'synthesis',
  stackable: false,
  maxStack: 1,
};

export const ITM_EQP_0002: ItemDef = {
  id: 'ITM-eqp-0002',
  name: '手套',
  emoji: '🧤',
  icon: '/placeholder-icon.svg',
  description: '可進行材料加工的手套',
  subCategory: 'eqp',
  part: 'hand',
  skill: 'processing',
  stackable: false,
  maxStack: 1,
};

// ========== 道具表與查詢 ==========

export const itemTable: Record<string, ItemDef> = {
  [ITM_EQP_0001.id]: ITM_EQP_0001,
  [ITM_EQP_0002.id]: ITM_EQP_0002,
  [ITM_MAT_0001.id]: ITM_MAT_0001,
  [ITM_MAT_0002.id]: ITM_MAT_0002,
  [ITM_MAT_0003.id]: ITM_MAT_0003,
  [ITM_POT_0001.id]: ITM_POT_0001,
  [ITM_MAT_0004.id]: ITM_MAT_0004,
  [ITM_MAT_0006.id]: ITM_MAT_0006,
  [ITM_POT_0002.id]: ITM_POT_0002,
  [ITM_POT_0003.id]: ITM_POT_0003,
  // 微光村斷崖任務道具
  [ITM_MAT_0010.id]: ITM_MAT_0010,
  [ITM_MAT_0011.id]: ITM_MAT_0011,
  [ITM_MAT_0012.id]: ITM_MAT_0012,
  [ITM_MAT_0013.id]: ITM_MAT_0013,
  [ITM_MAT_0014.id]: ITM_MAT_0014,
  [ITM_POT_0004.id]: ITM_POT_0004,
  [ITM_POT_0005.id]: ITM_POT_0005,
  [ITM_POT_0006.id]: ITM_POT_0006,
};

export function getItem(id: string): ItemDef | undefined {
  return itemTable[id];
}
