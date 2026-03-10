//════════════════════════════════════════════════════════════════
// 任務資料上傳到 Google Sheet 的工具函式
//════════════════════════════════════════════════════════════════
// questTable  → quests 分頁（任務定義）
// questList   → questList 分頁（地圖任務綁定）

import { API_BASE_URL } from '../../core/config/api';
import type { QuestDef } from '../../quests/data/questData';
import type { QuestEntry } from '../../quests/data/questList';

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
