//════════════════════════════════════════════════════════════════
// 任務查詢函數與 Runtime 狀態
//════════════════════════════════════════════════════════════════
// 型別定義請見 questData.ts
// 任務資料請見 questData.ts

import type { QuestDef, QuestStep, QuestPhase, StepCompleteAction } from './questData';
import { localQuestTableData } from './questData';
import { questList as _localQuestList } from './questList';
import type { QuestEntry } from './questList';

// ========== 正規化 ==========

/**
 * 將任務步驟的 entityId 正規化：
 * 步驟未指定 entityId（undefined / 空字串）時，自動繼承 quest.defaultEntityId
 * 若 defaultEntityId 也未設，fallback 到 start 步驟的 entityId
 * 正規化在載入時執行一次，runtime 永遠拿到完整資料
 */
export function normalizeQuestEntityIds(quest: QuestDef): QuestDef {
  // 優先用 defaultEntityId；否則 fallback 到 start 步驟的 entityId（向後相容）
  const startStep = quest.steps.find((s) => s.type === 'start');
  const defaultId =
    quest.defaultEntityId ??
    (startStep?.type === 'start' ? startStep.entityId : undefined) ??
    '';
  if (!defaultId) return quest;
  return {
    ...quest,
    steps: quest.steps.map((step) => {
      if (step.type === 'complete') return step;    // complete 沒有 entityId
      if (step.entityId) return step;               // 已明確指定，保留
      return { ...step, entityId: defaultId };      // 繼承預設值
    }),
  };
}

// ========== 工具函數 ==========

// 取得開始步驟（steps[0] 且 type 為 'start'）
export function getStartStep(quest: QuestDef | null | undefined): (QuestStep & { type: 'start' }) | undefined {
  const first = quest?.steps?.[0];
  return first?.type === 'start' ? first : undefined;
}

// 取得任務完成時顯示的訊息（來自最後一步 type 為 complete）
export function getCompleteMessage(quest: QuestDef | null | undefined): string | undefined {
  if (!quest?.steps?.length) return undefined;
  const last = quest.steps[quest.steps.length - 1];
  return 'completeMessage' in last ? last.completeMessage : undefined;
}

// 取得步驟的 entityId（complete 類型沒有 entityId）
export function getStepEntityId(step: QuestStep | null | undefined): string | undefined {
  if (!step) return undefined;
  return 'entityId' in step ? step.entityId : undefined;
}

// 取得指定索引的步驟
export function getStepByIndex(quest: QuestDef | null | undefined, index: number): QuestStep | undefined {
  return quest?.steps?.[index];
}

/**
 * 解析步驟的 onStepComplete，回傳標準化的 StepCompleteAction
 * - 'close' / undefined → { dialogue: 'close' }
 * - 'continue' → { dialogue: 'continue' }
 * - StepCompleteAction → 直接回傳（補上預設 dialogue: 'close'）
 */
export function parseStepCompleteAction(step: QuestStep | null | undefined): StepCompleteAction {
  if (!step) return { dialogue: 'close' };
  const action = step.onStepComplete;
  if (!action || action === 'close') return { dialogue: 'close' };
  if (action === 'continue') return { dialogue: 'continue' };
  return { dialogue: action.dialogue ?? 'close', ...action };
}

// 泡泡顯示內容（誰顯示、顯示道具或文字）
export interface QuestBubbleDisplay {
  entityId: string;
  itemId?: string;
  label?: string;
}

// 依任務階段與當前步驟回傳「誰顯示任務泡泡」與內容；無泡泡時回傳 null
export function getBubbleDisplay(
  quest: QuestDef | null | undefined,
  phase: QuestPhase,
  _stepIndex: number,
  currentStep: QuestStep | undefined
): QuestBubbleDisplay | null {
  if (!quest?.steps?.length) return null;
  if (phase === 'idle') return null;
  if (phase === 'accepted' && currentStep && currentStep.type !== 'complete' && currentStep.type !== 'start') {
    const entityId = 'bubbleEntityId' in currentStep && currentStep.bubbleEntityId
      ? currentStep.bubbleEntityId
      : currentStep.entityId;
    const label = 'bubbleLabel' in currentStep ? currentStep.bubbleLabel : undefined;
    const itemId =
      'bubbleItemId' in currentStep && currentStep.bubbleItemId
        ? currentStep.bubbleItemId
        : currentStep.type === 'deliver_to' || currentStep.type === 'receive_from'
          ? currentStep.itemId
          : undefined;
    return { entityId: entityId ?? '', ...(label !== undefined && { label }), ...(itemId !== undefined && { itemId }) };
  }
  return null;
}

// 取得當前步驟（index 超出時為 undefined）
export function getCurrentStep(
  quest: QuestDef | null | undefined,
  stepIndex: number
): QuestStep | undefined {
  if (!quest?.steps?.length || stepIndex < 0 || stepIndex >= quest.steps.length) return undefined;
  return quest.steps[stepIndex];
}

// ========== Runtime 狀態 ==========

// runtime 可替換的資料存儲（載入時套用 entityId 正規化）
let _questTable: Record<string, QuestDef> = Object.fromEntries(
  Object.entries(localQuestTableData).map(([id, q]) => [id, normalizeQuestEntityIds(q)])
);

// 保持向後相容的靜態 export（admin 後台引用）
export const questTable: Record<string, QuestDef> = localQuestTableData;

export function getQuest(id: string): QuestDef | undefined {
  return _questTable[id];
}

// 判斷任務是否已解鎖：無前置任務則永遠開放；有前置則需在 completedQuestIds 中
export function isQuestUnlocked(quest: QuestDef, completedQuestIds: string[]): boolean {
  if (!quest.prerequisiteQuestId) return true;
  return completedQuestIds.includes(quest.prerequisiteQuestId);
}

// 取得任務發放 NPC 的 entityId（來自 start 步驟）
export function getQuestGiverNpcId(quest: QuestDef): string | undefined {
  const startStep = getStartStep(quest);
  return startStep?.entityId;
}

// runtime 可替換的任務綁定表
let _questList: QuestEntry[] = _localQuestList;

/**
 * 初始化 runtime 任務資料（通常在 App 啟動時由 dataSource.ts 呼叫）
 * 呼叫後所有查詢函數將使用傳入的資料，不再讀取本地靜態檔案
 */
export function initQuestRuntime(
  table: Record<string, QuestDef>,
  list: QuestEntry[]
): void {
  _questTable = Object.fromEntries(
    Object.entries(table).map(([id, q]) => [id, normalizeQuestEntityIds(q)])
  );
  _questList = list;
}

/** 取得當前 runtime questList */
export function getQuestListRuntime(): QuestEntry[] {
  return _questList;
}

// 取得指定 NPC 在指定地圖上可發放的任務列表
export function getAvailableQuestsForNpc(
  npcId: string,
  mapId: string,
  completedQuestIds: string[]
): QuestDef[] {
  const questIdsInMap = _questList
    .filter((q) => q.mapId === mapId)
    .map((q) => q.questId);

  const available: QuestDef[] = [];

  for (const questId of questIdsInMap) {
    const quest = _questTable[questId];
    if (!quest) continue;
    const giverNpcId = getQuestGiverNpcId(quest);
    if (giverNpcId !== npcId) continue;
    if (completedQuestIds.includes(questId)) continue;
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;
    available.push(quest);
  }

  return available;
}

// 取得指定地圖上所有可接任務
export function getAvailableQuestsForMap(
  mapId: string,
  completedQuestIds: string[]
): QuestDef[] {
  const questIdsInMap = _questList
    .filter((q) => q.mapId === mapId)
    .map((q) => q.questId);

  const available: QuestDef[] = [];

  for (const questId of questIdsInMap) {
    const quest = _questTable[questId];
    if (!quest) continue;
    if (completedQuestIds.includes(questId)) continue;
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;
    available.push(quest);
  }

  return available;
}

// 取得指定地圖上「下一個應進行的任務」（按 chainOrder 排序，取第一個可接的）
export function getNextQuest(
  mapId: string,
  completedQuestIds: string[]
): QuestDef | null {
  const questsInMap = _questList
    .filter((q) => q.mapId === mapId)
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

  for (const entry of questsInMap) {
    const quest = _questTable[entry.questId];
    if (!quest) continue;
    if (completedQuestIds.includes(entry.questId)) continue;
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;
    return quest;
  }

  return null;
}

// 取得當前可互動的 NPC ID
export function getInteractableNpcId(
  quest: QuestDef | null,
  questPhase: QuestPhase,
  stepIndex: number
): string | null {
  if (!quest) return null;

  if (questPhase === 'idle') {
    return getQuestGiverNpcId(quest) ?? null;
  }

  if (questPhase === 'accepted') {
    const step = getCurrentStep(quest, stepIndex);
    if (!step || step.type === 'start' || step.type === 'complete') return null;
    if ('bubbleEntityId' in step && step.bubbleEntityId) {
      return step.bubbleEntityId;
    }
    return step.entityId ?? null;
  }

  return null;
}
