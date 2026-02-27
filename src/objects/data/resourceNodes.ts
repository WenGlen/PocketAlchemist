/**
 * 資源點定義（MVP-00.01：茶樹、湖邊）
 */
export type ResourceKind = 'tea_tree' | 'lake';

export interface ResourceNodeDef {
  id: string;
  type: 'resource_node';
  x: number;
  y: number;
  radius: number;
  interactive: boolean;
  kind: ResourceKind;
  displayName: string;
  /** 採集獲得的 itemId（茶樹=茶葉） */
  gatherItemId?: string;
  /** 湖邊：需要此 itemId 才能採集（玻璃瓶），採集後得到 裝水的玻璃瓶 */
  requireItemId?: string;
  resultItemId?: string;
}

export const OBJ_RES_001: ResourceNodeDef = {
  id: 'OBJ-res-001',
  type: 'resource_node',
  x: 500,
  y: 280,
  radius: 28,
  interactive: true,
  kind: 'tea_tree',
  displayName: '茶樹',
  gatherItemId: 'ITM-mat-0002',
};

export const OBJ_RES_002: ResourceNodeDef = {
  id: 'OBJ-res-002',
  type: 'resource_node',
  x: 350,
  y: 450,
  radius: 32,
  interactive: true,
  kind: 'lake',
  displayName: '湖邊',
  requireItemId: 'ITM-mat-0001',
  resultItemId: 'ITM-mat-0003',
};

export const resourceNodes: ResourceNodeDef[] = [OBJ_RES_001, OBJ_RES_002];

export function getResourceNode(id: string): ResourceNodeDef | undefined {
  return resourceNodes.find((n) => n.id === id);
}
