//════════════════════════════════════════════════════════════════
// 資料來源切換
//════════════════════════════════════════════════════════════════
// 依 devVersion.debugConfig.useLocalData 決定任務資料的來源：
//   true  → 直接使用本地 questData.ts / questList.ts（預設）
//   false → 透過後端 API 從 Google Sheet 讀取

import { debugConfig } from '../../devVersion';
import { API_BASE_URL } from './api';
import { localQuestTableData as localQuestTable } from '../../quests/data/questData';
import { questList as localQuestList } from '../../quests/data/questList';
import type { QuestDef } from '../../quests/data/questData';
import type { QuestEntry } from '../../quests/data/questList';

// ========== 旗標（給遊戲其他模組直接讀取）==========

export const USE_LOCAL_DATA: boolean = debugConfig.useLocalData;

// ========== 從 API 讀取（useLocalData = false 時使用）==========

/** 從 API 取得所有任務定義，回傳格式與 questTable 一致 */
export async function fetchQuestTable(): Promise<Record<string, QuestDef>> {
  const res = await fetch(`${API_BASE_URL}/api/quests`);
  if (!res.ok) throw new Error(`fetchQuestTable 失敗：${res.status}`);
  const rows: QuestDef[] = await res.json();
  return Object.fromEntries(rows.map((q) => [q.id, q]));
}

/** 從 API 取得地圖任務綁定，回傳格式與 questList 一致 */
export async function fetchQuestList(): Promise<QuestEntry[]> {
  const res = await fetch(`${API_BASE_URL}/api/questList`);
  if (!res.ok) throw new Error(`fetchQuestList 失敗：${res.status}`);
  return res.json();
}

// ========== 統一入口（自動依旗標選擇來源）==========

/** 取得任務定義表（依 useLocalData 旗標自動選擇本地或遠端） */
export async function getQuestTable(): Promise<Record<string, QuestDef>> {
  if (USE_LOCAL_DATA) return localQuestTable;
  return fetchQuestTable();
}

/** 取得地圖任務綁定（依 useLocalData 旗標自動選擇本地或遠端） */
export async function getQuestList(): Promise<QuestEntry[]> {
  if (USE_LOCAL_DATA) return localQuestList;
  return fetchQuestList();
}
