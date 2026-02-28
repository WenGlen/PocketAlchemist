/**
 * 全遊戲道具定義與性質的單一來源。
 * 堆疊（stackable / maxStack）、名稱、圖示等皆以此表為準；
 * 任務、合成表、資源點僅引用 itemId，勿在別處重複定義性質。
 */
export type ItemSubCategory = 'pot' | 'mat' | 'eqp' | 'qst';

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  subCategory: ItemSubCategory;
  /** 是否可堆疊（與 maxStack 並用：未設 maxStack 時視為 99） */
  stackable: boolean;
  /** 單格最大堆疊數，未設時可堆疊物為 99、不可堆疊為 1 */
  maxStack?: number;
}

export const ITM_MAT_0001: ItemDef = {
  id: 'ITM-mat-0001',
  name: '玻璃瓶',
  icon: '/placeholder-icon.svg',
  description: '可裝水的空瓶',
  subCategory: 'mat',
  stackable: false,
  maxStack: 1,
};

export const ITM_MAT_0002: ItemDef = {
  id: 'ITM-mat-0002',
  name: '茶葉',
  icon: '/placeholder-icon.svg',
  description: '從茶樹採的葉子',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

export const ITM_MAT_0003: ItemDef = {
  id: 'ITM-mat-0003',
  name: '裝水的玻璃瓶',
  icon: '/placeholder-icon.svg',
  description: '在湖邊裝水後的玻璃瓶',
  subCategory: 'mat',
  stackable: false,
  maxStack: 1,
};

export const ITM_POT_0001: ItemDef = {
  id: 'ITM-pot-0001',
  name: '不好喝的茶',
  icon: '/placeholder-icon.svg',
  description: '茶葉與湖水合成的茶',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

/** MVP-01 測試場景用 */
export const ITM_MAT_0004: ItemDef = {
  id: 'ITM-mat-0004',
  name: '藥草',
  icon: '/placeholder-icon.svg',
  description: '採集用素材',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

export const ITM_MAT_0006: ItemDef = {
  id: 'ITM-mat-0006',
  name: '火粉',
  icon: '/placeholder-icon.svg',
  description: '可燃粉末',
  subCategory: 'mat',
  stackable: true,
  maxStack: 99,
};

export const ITM_POT_0002: ItemDef = {
  id: 'ITM-pot-0002',
  name: '治療藥水',
  icon: '/placeholder-icon.svg',
  description: '藥草與裝水的玻璃瓶合成',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

export const ITM_POT_0003: ItemDef = {
  id: 'ITM-pot-0003',
  name: '爆裂藥水',
  icon: '/placeholder-icon.svg',
  description: '火粉與裝水的玻璃瓶合成',
  subCategory: 'pot',
  stackable: false,
  maxStack: 1,
};

export const itemTable: Record<string, ItemDef> = {
  [ITM_MAT_0001.id]: ITM_MAT_0001,
  [ITM_MAT_0002.id]: ITM_MAT_0002,
  [ITM_MAT_0003.id]: ITM_MAT_0003,
  [ITM_POT_0001.id]: ITM_POT_0001,
  [ITM_MAT_0004.id]: ITM_MAT_0004,
  [ITM_MAT_0006.id]: ITM_MAT_0006,
  [ITM_POT_0002.id]: ITM_POT_0002,
  [ITM_POT_0003.id]: ITM_POT_0003,
};

export function getItem(id: string): ItemDef | undefined {
  return itemTable[id];
}
