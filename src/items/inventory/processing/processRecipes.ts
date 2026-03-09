//════════════════════════════════════════════════════════════════
// 加工配方
//════════════════════════════════════════════════════════════════
// 單一素材 → 加工後產物
// 所有 itemId 以 items/data/itemTable 為準，勿重複定義
//════════════════════════════════════════════════════════════════

// ========== 型別定義 ==========

export interface ProcessRecipe {
  id: string;
  input: { itemId: string; count: number };
  output: { itemId: string; count: number };
}

// ========== 配方清單 ==========

export const processRecipes: ProcessRecipe[] = [
  {
    id: 'weed-crush',
    input:  { itemId: 'ITM-mat-0010', count: 1 },  // 清淤草
    output: { itemId: 'ITM-mat-0011', count: 1 },  // 清淤草藥碎
  },
  {
    id: 'pig-oil-filter',
    input:  { itemId: 'ITM-mat-0012', count: 1 },  // 螢茸豬油
    output: { itemId: 'ITM-mat-0014', count: 1 },  // 澄清豬油
  },
];

// ========== 配方匹配 ==========

export function matchProcessRecipe(itemId: string): ProcessRecipe | null {
  return processRecipes.find((r) => r.input.itemId === itemId) ?? null;
}
