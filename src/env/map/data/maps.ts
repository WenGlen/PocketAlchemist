export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  walkable?: boolean;
}

export const MAP_FIELD_001: MapData = {
  id: 'MAP-field-001',
  name: '野外初生地',
  width: 1600,
  height: 1200,
  walkable: true,
};

export const mapsById: Record<string, MapData> = {
  [MAP_FIELD_001.id]: MAP_FIELD_001,
};

export function getMap(id: string): MapData | undefined {
  return mapsById[id];
}
