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
  description: '裝了湖水的玻璃瓶',
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

export const itemTable: Record<string, ItemDef> = {
  [ITM_MAT_0001.id]: ITM_MAT_0001,
  [ITM_MAT_0002.id]: ITM_MAT_0002,
  [ITM_MAT_0003.id]: ITM_MAT_0003,
  [ITM_POT_0001.id]: ITM_POT_0001,
};

export function getItem(id: string): ItemDef | undefined {
  return itemTable[id];
}
