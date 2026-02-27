import type { MapEntity } from '../../types/entity';

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

export const objectTable: Record<string, NpcDef> = {
  [OBJ_NPC_001.id]: OBJ_NPC_001,
};

export function getObject(id: string): NpcDef | undefined {
  return objectTable[id];
}
