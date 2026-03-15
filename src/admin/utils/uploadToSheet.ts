//════════════════════════════════════════════════════════════════
// 任務資料上傳到 Google Sheet 的工具函式
//════════════════════════════════════════════════════════════════
// questTable  → quests 分頁（任務定義）
// questList   → questList 分頁（地圖任務綁定）
// mapsById    → maps 分頁（地圖定義）
// itemTable   → items 分頁（道具定義）
// objectTable → objects 分頁（地圖物件定義，各型別 JSON 化）

import { API_BASE_URL } from '../../core/config/api';
import type { QuestDef } from '../../quests/data/questData';
import type { QuestEntry } from '../../quests/data/questList';
import type { MapData } from '../../maps/data/mapsTable';
import type { ItemDef } from '../../items/data/itemsTable';

// ========== 欄位定義 ==========

export const QUEST_HEADERS = [
  'id',
  'name',
  'description',
  'prerequisiteQuestId',
  'acceptMode',
  'steps',
  'npcPositionOverrides',
  'storyNote',
  'blockingNote',
  'designNote',
];

export const QUEST_LIST_HEADERS = ['mapId', 'questId', 'name', 'chainOrder'];

// ========== 資料轉換 ==========

export const questToRow = (q: QuestDef): string[] => [
  q.id,
  q.name,
  q.description ?? '',
  q.prerequisiteQuestId ?? '',
  q.acceptMode ?? 'auto',
  JSON.stringify(q.steps),
  q.npcPositionOverrides ? JSON.stringify(q.npcPositionOverrides) : '',
  q.storyNote ?? '',
  q.blockingNote ?? '',
  q.designNote ?? '',
];

export const questEntryToRow = (q: QuestEntry): string[] => [
  q.mapId,
  q.questId,
  q.name,
  String(q.chainOrder ?? 0),
];

// ========== API 呼叫 ==========

export interface UploadResult {
  success: boolean;
  count?: number;
  message?: string;
  error?: string;
  details?: string;
}

const uploadToTab = async (
  tabPath: string,
  headers: string[],
  rows: string[][],
): Promise<UploadResult> => {
  const res = await fetch(`${API_BASE_URL}/api/${tabPath}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, rows }),
  });
  return res.json() as Promise<UploadResult>;
};

export const uploadQuests = (quests: QuestDef[]): Promise<UploadResult> =>
  uploadToTab('quests', QUEST_HEADERS, quests.map(questToRow));

export const uploadQuestList = (entries: QuestEntry[]): Promise<UploadResult> =>
  uploadToTab('questList', QUEST_LIST_HEADERS, entries.map(questEntryToRow));

// ========== 地圖定義 ==========

export const MAP_HEADERS = [
  'id',
  'name',
  'width',
  'height',
  'texture',
  'spawnPoint',
  'features',
];

export const mapToRow = (m: MapData): string[] => [
  m.id,
  m.name,
  String(m.width),
  String(m.height),
  m.texture ? JSON.stringify(m.texture) : '',
  m.spawnPoint ? JSON.stringify(m.spawnPoint) : '',
  m.features ? JSON.stringify(m.features) : '',
];

export const uploadMaps = (maps: MapData[]): Promise<UploadResult> =>
  uploadToTab('maps', MAP_HEADERS, maps.map(mapToRow));

// ========== 道具定義 ==========

export const ITEM_HEADERS = [
  'id', 'name', 'emoji', 'icon', 'description',
  'subCategory', 'part', 'skill', 'stackable', 'maxStack',
];

export const itemToRow = (item: ItemDef): string[] => [
  item.id,
  item.name,
  item.emoji,
  item.icon,
  item.description,
  item.subCategory,
  item.part ?? '',
  item.skill ?? '',
  String(item.stackable),
  String(item.maxStack ?? ''),
];

export const uploadItems = (items: ItemDef[]): Promise<UploadResult> =>
  uploadToTab('items', ITEM_HEADERS, items.map(itemToRow));

// ========== 地圖物件定義 ==========
// 各型別欄位差異大，以 id/type/data 三欄保留彈性

export type AnyObjectDef = { id: string; type: string; [key: string]: unknown };

export const OBJECT_HEADERS = ['id', 'type', 'data'];

export const objectToRow = ({ id, type, ...rest }: AnyObjectDef): string[] => [
  id,
  type,
  JSON.stringify(rest),
];

export const uploadObjects = (objects: AnyObjectDef[]): Promise<UploadResult> =>
  uploadToTab('objects', OBJECT_HEADERS, objects.map(objectToRow));
