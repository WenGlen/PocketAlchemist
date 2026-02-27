export type EntityType =
  | 'player'
  | 'material_node'
  | 'npc'
  | 'monster'
  | 'obstacle'
  | 'synthesis_panel'
  | 'exit_flag'
  | 'resource_node';

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
