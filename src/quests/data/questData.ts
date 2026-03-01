export type QuestPhase = 'none' | 'accepted' | 'completed';

/** 單一步驟型別 */
export type QuestStep =
  | {
      /** 開始／承接任務：只有此 entity 可承接，對話窗顯示 acceptText 與承接按鈕 */
      type: 'start';
      entityId: string;
      acceptText: string;
    }
  | {
      type: 'receive_from';
      entityId: string;
      itemId: string;
      count?: number;
      message?: string;
      /** 對話窗內領取前顯示的句子（與誰對話、現在步驟有關） */
      receiveMessage?: string;
      /** 領取按鈕文字 */
      receiveButtonText?: string;
      /** 此步驟下，與其他 entity 對話時顯示的內容（一個步驟可控制複數 NPC 對話） */
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
    }
  | {
      type: 'deliver_to';
      entityId: string;
      itemId: string;
      wrongItemMessage?: string;
      message?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
    }
  | {
      type: 'interact_with';
      entityId: string;
      message?: string;
      completeMessage?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleLabel?: string;
    }
  | {
      /** 結束任務：獨立步驟，無實體互動，用於任務完成彈窗文案 */
      type: 'complete';
      completeMessage?: string;
    };

export interface QuestDef {
  id: string;
  name: string;
  /** 供任務清單等使用，最外層只保留基本編號與描述 */
  description?: string;
  /**
   * 串鏈前置任務 ID：只有在指定任務已完成後，此任務才對玩家開放。
   * 未設時代表隨時可接。isQuestUnlocked() 會依 completedQuestIds 判斷。
   */
  prerequisiteQuestId?: string;
  /** 步驟陣列：第一項為 type 'start'（承接），其後為任務步驟，最後可為 type 'complete' */
  steps: QuestStep[];
}

/** 取得開始步驟（steps[0] 且 type 為 'start'） */
export function getStartStep(quest: QuestDef | null | undefined): (QuestStep & { type: 'start' }) | undefined {
  const first = quest?.steps?.[0];
  return first?.type === 'start' ? first : undefined;
}

/** 取得任務完成時顯示的訊息（來自最後一步 type 為 complete 或具 completeMessage 的步驟） */
export function getCompleteMessage(quest: QuestDef | null | undefined): string | undefined {
  if (!quest?.steps?.length) return undefined;
  const last = quest.steps[quest.steps.length - 1];
  return 'completeMessage' in last ? last.completeMessage : undefined;
}

/** 泡泡顯示內容（誰顯示、顯示道具或文字） */
export interface QuestBubbleDisplay {
  entityId: string;
  itemId?: string;
  label?: string;
}

/** 依任務階段與當前步驟回傳「誰顯示任務泡泡」與內容；無泡泡時回傳 null */
export function getBubbleDisplay(
  quest: QuestDef | null | undefined,
  phase: QuestPhase,
  _stepIndex: number,
  currentStep: QuestStep | undefined
): QuestBubbleDisplay | null {
  if (!quest?.steps?.length) return null;
  if (phase === 'none') {
    const start = getStartStep(quest);
    if (!start) return null;
    return { entityId: start.entityId, label: quest.name };
  }
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
    return { entityId, ...(label !== undefined && { label }), ...(itemId !== undefined && { itemId }) };
  }
  return null;
}

/** 取得當前步驟（index 超出時為 undefined） */
export function getCurrentStep(
  quest: QuestDef | null | undefined,
  stepIndex: number
): QuestStep | undefined {
  if (!quest?.steps?.length || stepIndex < 0 || stepIndex >= quest.steps.length) return undefined;
  return quest.steps[stepIndex];
}

export const QST_MAIN_001: QuestDef = {
  id: 'QST-main-001',
  name: '要喝茶',
  description: '茶攤老闆想喝茶。採茶葉、用玻璃瓶裝湖水、合成後交付。',
  steps: [
    { type: 'start', entityId: 'OBJ-npc-001', acceptText: '幫我弄一杯茶吧。去採茶葉、湖邊用玻璃瓶裝水，合成成茶再拿來。' },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-001',
      itemId: 'ITM-pot-0001',
      wrongItemMessage: '不是這個，我要的是茶。',
      message: '請把茶交付給茶攤老闆。',
    },
    { type: 'complete', completeMessage: '你的茶不太好喝啊...但還是謝謝你的茶。' },
  ],
};

/** 任務二：實驗室訂單（承接 → 園丁領藥草 → 交付治療藥水即結束） */
export const QST_MAIN_002: QuestDef = {
  id: 'QST-main-002',
  name: '實驗室訂單',
  description: '向實驗員承接後，向園丁拿藥草，合成治療藥水交付即完成。',
  steps: [
    { type: 'start', entityId: 'OBJ-npc-002', acceptText: '請先去找園丁拿藥草，合成治療藥水後拿回來給我。' },
    {
      type: 'receive_from',
      entityId: 'OBJ-npc-003',
      itemId: 'ITM-mat-0004',
      count: 1,
      message: '請跟園丁拿藥草。',
      receiveMessage: '實驗員要你來拿草藥喔，給你吧。',
      receiveButtonText: '領取藥草',
      dialogueByEntity: { 'OBJ-npc-002': ['去找園丁拿藥草吧。'] },
      bubbleEntityId: 'OBJ-npc-003',
      bubbleLabel: '領取藥草',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-002',
      itemId: 'ITM-pot-0002',
      wrongItemMessage: '不是這個。',
      message: '請把治療藥水交付給實驗員。',
      dialogueByEntity: { 'OBJ-npc-003': ['快去幫實驗員做治療藥水吧。'] },
      bubbleEntityId: 'OBJ-npc-002',
      bubbleItemId: 'ITM-pot-0002',
    },
    { type: 'complete', completeMessage: '任務完成！謝謝你的治療藥水。' },
  ],
};

// =============================================================================
// MAP-field-002：幽林深處 三任務串鏈
// =============================================================================

/** 任務三：商旅的委托（MAP-field-002 入口，無前置） */
export const QST_MAIN_003: QuestDef = {
  id: 'QST-main-003',
  name: '商旅的委托',
  description: '旅行商人需要補給藥草。採集後交付即完成。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-004',
      acceptText: '我的商隊需要補充藥草，能幫我在附近採一些嗎？',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-004',
      itemId: 'ITM-mat-0004',
      wrongItemMessage: '這不是藥草，我需要的是藥草。',
      message: '採集藥草後交給旅行商人。',
      bubbleEntityId: 'OBJ-npc-004',
      bubbleItemId: 'ITM-mat-0004',
    },
    { type: 'complete', completeMessage: '謝謝！路上有需要可以再來找我，我常在這附近。' },
  ],
};

/** 任務四：古茶樹的滋味（前置：QST-main-003） */
export const QST_MAIN_004: QuestDef = {
  id: 'QST-main-004',
  name: '古茶樹的滋味',
  description: '茶攤老闆想念古茶樹的茶香。採茶葉、裝水、合成後交付。',
  prerequisiteQuestId: 'QST-main-003',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-001',
      acceptText: '你也來這片深林了！聽說這裡有棵古茶樹，幫我採茶葉、裝點山泉水，泡一杯好茶吧。',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-001',
      itemId: 'ITM-pot-0001',
      wrongItemMessage: '這不是茶，用茶葉和山泉水合成一杯茶再來。',
      message: '採茶葉、用玻璃瓶裝山泉水，合成茶後交給茶攤老闆。',
      bubbleEntityId: 'OBJ-npc-001',
      bubbleItemId: 'ITM-pot-0001',
    },
    { type: 'complete', completeMessage: '古茶樹的茶果然不一樣，清香四溢！謝謝你的用心。' },
  ],
};

/** 任務五：藥劑師的緊急訂單（前置：QST-main-004） */
export const QST_MAIN_005: QuestDef = {
  id: 'QST-main-005',
  name: '緊急藥水訂單',
  description: '藥劑師急需治療藥水。向旅行商人領取藥草，裝水後合成交付。',
  prerequisiteQuestId: 'QST-main-004',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-002',
      acceptText: '有位旅人受傷了，急需治療藥水！先去找旅行商人拿藥草，再用山泉水合成藥水帶回來。',
    },
    {
      type: 'receive_from',
      entityId: 'OBJ-npc-004',
      itemId: 'ITM-mat-0004',
      count: 1,
      message: '先去旅行商人那裡領取藥草。',
      receiveMessage: '藥劑師說要藥草是吧？我正好有存貨，給你。',
      receiveButtonText: '領取藥草',
      dialogueByEntity: {
        'OBJ-npc-002': ['快去旅行商人那裡拿藥草，再用山泉水合成治療藥水。'],
      },
      bubbleEntityId: 'OBJ-npc-004',
      bubbleLabel: '領取藥草',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-002',
      itemId: 'ITM-pot-0002',
      wrongItemMessage: '這不對，我需要治療藥水（藥草 + 裝水玻璃瓶合成）。',
      message: '用玻璃瓶裝山泉水，合成治療藥水後交給藥劑師。',
      dialogueByEntity: {
        'OBJ-npc-004': ['快去幫藥劑師合成治療藥水吧，別讓傷者等太久。'],
      },
      bubbleEntityId: 'OBJ-npc-002',
      bubbleItemId: 'ITM-pot-0002',
    },
    { type: 'complete', completeMessage: '謝謝你的迅速！旅人得救了，你是幽林的英雄！' },
  ],
};

export const questTable: Record<string, QuestDef> = {
  [QST_MAIN_001.id]: QST_MAIN_001,
  [QST_MAIN_002.id]: QST_MAIN_002,
  [QST_MAIN_003.id]: QST_MAIN_003,
  [QST_MAIN_004.id]: QST_MAIN_004,
  [QST_MAIN_005.id]: QST_MAIN_005,
};

export function getQuest(id: string): QuestDef | undefined {
  return questTable[id];
}

/**
 * 判斷任務是否已解鎖：無前置任務則永遠開放；有前置則需在 completedQuestIds 中。
 * 供 TopBar 任務選單顯示鎖定狀態，以及 GameScreen 完成彈窗的「繼續下一個任務」按鈕使用。
 */
export function isQuestUnlocked(quest: QuestDef, completedQuestIds: string[]): boolean {
  if (!quest.prerequisiteQuestId) return true;
  return completedQuestIds.includes(quest.prerequisiteQuestId);
}
