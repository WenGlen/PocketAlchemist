/**
 * 合成配方：素材 ID 陣列（順序不拘）→ 產物
 */
export interface Recipe {
  id: string;
  /** 素材 itemId 集合（每種數量） */
  ingredients: { itemId: string; count: number }[];
  result: { itemId: string; count: number };
}

export const recipes: Recipe[] = [
  {
    id: 'tea-bad',
    ingredients: [
      { itemId: 'ITM-mat-0002', count: 1 },
      { itemId: 'ITM-mat-0003', count: 1 },
    ],
    result: { itemId: 'ITM-pot-0001', count: 1 },
  },
];

/**
 * 檢查給定的素材欄位內容是否匹配某個配方（不考慮順序，只檢查種類與數量）
 */
export function matchRecipe(slotItems: { itemId: string; count: number }[]): Recipe | null {
  const have = new Map<string, number>();
  for (const s of slotItems) {
    if (!s.itemId) continue;
    have.set(s.itemId, (have.get(s.itemId) ?? 0) + s.count);
  }
  for (const recipe of recipes) {
    let ok = true;
    for (const ing of recipe.ingredients) {
      if ((have.get(ing.itemId) ?? 0) < ing.count) {
        ok = false;
        break;
      }
    }
    if (ok) return recipe;
  }
  return null;
}
