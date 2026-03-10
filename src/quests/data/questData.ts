//════════════════════════════════════════════════════════════════
// 任務定義表
//════════════════════════════════════════════════════════════════
// 全遊戲任務定義的單一來源
// 包含任務步驟、對話、泡泡顯示等

// ========== 型別定義 ==========

// idle: 在地圖上但沒有進行中任務（可自由探索、找 NPC 接任務）
// accepted: 任務進行中
// completed: 任務剛完成（用於顯示完成訊息，之後會切回 idle）
export type QuestPhase = 'idle' | 'accepted' | 'completed';

// 銜接對話：step 開始時的來回對話
// speaker: 'player' 表示主角，其他字串為 NPC 的 entityId
export interface IntroDialogueLine {
  speaker: 'player' | string;
  content: string;
}

// 步驟完成時的動作
export interface StepCompleteAction {
  /** 對話框行為：'close' 關閉（預設）, 'continue' 保持開啟顯示下一步 */
  dialogue?: 'close' | 'continue';
  /** 隱藏指定 NPC（單一或多個） */
  hideNpc?: string | string[];
  /** 顯示指定 NPC（單一或多個） */
  showNpc?: string | string[];
}

// 步驟共用欄位
interface StepBase {
  /**
   * 步驟完成後的行為控制
   * - 'close': 關閉對話框（預設）
   * - 'continue': 保持對話框開啟，直接顯示下一步
   * - StepCompleteAction: 詳細控制（對話框行為 + NPC 狀態變化）
   */
  onStepComplete?: 'close' | 'continue' | StepCompleteAction;
}

// 單一步驟型別
export type QuestStep =
  | (StepBase & {
      type: 'start';  // 開始／承接任務：只有此 entity 可承接
      entityId: string;
      acceptText: string;
    })
  | (StepBase & {
      type: 'receive_from';
      entityId: string;
      itemId: string;
      count?: number;
      message?: string;
      receiveMessage?: string;  // 對話窗內領取前顯示的句子
      receiveButtonText?: string;  // 領取按鈕文字
      dialogueByEntity?: Record<string, string[]>;  // 此步驟下，與其他 entity 對話時顯示的內容
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
      introDialogue?: IntroDialogueLine[];  // 進入此步驟時的來回對話
    })
  | (StepBase & {
      type: 'deliver_to';
      entityId: string;
      itemId: string;
      wrongItemMessage?: string;
      message?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
      introDialogue?: IntroDialogueLine[];  // 進入此步驟時的來回對話
    })
  | (StepBase & {
      type: 'interact_with';
      entityId: string;
      message?: string;
      completeMessage?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleLabel?: string;
      introDialogue?: IntroDialogueLine[];  // 進入此步驟時的來回對話
    })
  | (StepBase & {
      type: 'complete';  // 結束任務：獨立步驟，無實體互動，用於任務完成彈窗文案
      completeMessage?: string;
    });

// 任務承接方式
// manual: 手動承接（對話窗顯示「接受任務」按鈕）
// auto: 自動承接（開啟對話窗即承接，預設行為）
// forced: 強制承接（前一任務完成後直接進入 accepted，跳過 idle）
// chained: 連續承接（前一任務完成後，關閉彈窗時自動開啟 start 對話窗）
export type AcceptMode = 'manual' | 'auto' | 'forced' | 'chained';

// NPC 位置覆蓋：任務進行期間臨時移動 NPC
export interface NpcPositionOverride {
  x: number;
  y: number;
}

export interface QuestDef {
  id: string;
  name: string;
  description?: string;  // 供任務清單等使用
  prerequisiteQuestId?: string;  // 串鏈前置任務 ID；未設時代表隨時可接
  acceptMode?: AcceptMode;  // 任務承接方式，預設 'auto'
  steps: QuestStep[];  // 步驟陣列：第一項為 'start'（承接），最後可為 'complete'

  // ── NPC 臨時移動（任務進行期間覆蓋 NPC 位置）──
  npcPositionOverrides?: Record<string, NpcPositionOverride>;

  // ── 備註欄位（不影響邏輯，供開發者筆記與 AI 生成參考）──
  storyNote?: string;     // 劇情背景、角色動機、故事脈絡
  blockingNote?: string;  // 範圍阻擋備註（筆記應阻擋哪些區域/NPC）
  designNote?: string;    // 體驗重點、設計意圖
}

// ========== 工具函數 ==========

// 取得開始步驟（steps[0] 且 type 為 'start'）
export function getStartStep(quest: QuestDef | null | undefined): (QuestStep & { type: 'start' }) | undefined {
  const first = quest?.steps?.[0];
  return first?.type === 'start' ? first : undefined;
}

// 取得任務完成時顯示的訊息（來自最後一步 type 為 complete 或具 completeMessage 的步驟）
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
// 注意：phase === 'idle' 時，泡泡由 getAvailableQuestsForNpc 決定，此函數不處理
export function getBubbleDisplay(
  quest: QuestDef | null | undefined,
  phase: QuestPhase,
  _stepIndex: number,
  currentStep: QuestStep | undefined
): QuestBubbleDisplay | null {
  if (!quest?.steps?.length) return null;
  // idle 狀態：沒有進行中任務，泡泡由 NPC 可接任務邏輯處理
  if (phase === 'idle') {
    return null;
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

// 取得當前步驟（index 超出時為 undefined）
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

// ── MAP-field-001：野外初生地 ─────────────────────────────────────

// 任務二：實驗室訂單（承接 → 園丁領藥草 → 交付治療藥水即結束）
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
      introDialogue: [
        { speaker: 'player', content: '你好，我是來幫實驗員拿藥草的。' },
        { speaker: 'OBJ-npc-003', content: '喔！實驗員又需要藥草啦？' },
        { speaker: 'player', content: '是的，他需要做治療藥水。' },
        { speaker: 'OBJ-npc-003', content: '好的，我這邊準備好了。' },
      ],
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

// ── MAP-field-002：幽林深處 三任務串鏈 ────────────────────────────

// 任務三：商旅的委托（MAP-field-002 入口，無前置）
export const QST_MAIN_003: QuestDef = {
  id: 'QST-main-003',
  name: '商旅的委托',
  description: '旅行商人需要補給藥草。採集後交付即完成。',
  acceptMode: 'manual',  // 手動承接：需按「接受任務」按鈕
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

// 任務四：古茶樹的滋味（前置：QST-main-003）
export const QST_MAIN_004: QuestDef = {
  id: 'QST-main-004',
  name: '古茶樹的滋味',
  description: '茶攤老闆想念古茶樹的茶香。採茶葉、裝水、合成後交付。',
  prerequisiteQuestId: 'QST-main-003',
  acceptMode: 'forced',  // 強制承接：完成前一任務後直接進入 accepted
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

// 任務五：藥劑師的緊急訂單（前置：QST-main-004）
export const QST_MAIN_005: QuestDef = {
  id: 'QST-main-005',
  name: '緊急藥水訂單',
  description: '藥劑師急需治療藥水。向旅行商人領取藥草，裝水後合成交付。',
  prerequisiteQuestId: 'QST-main-004',
  acceptMode: 'chained',  // 連續承接：完成前一任務後自動開啟 start 對話窗
  // 任務期間將旅行商人移到藥師旁邊（藥師位於 350, 480）
  npcPositionOverrides: {
    'OBJ-npc-004': { x: 420, y: 480 },
  },
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

// ══════════════════════════════════════════════════════════════════
// MAP-shimmer-001：微光村斷崖
// ══════════════════════════════════════════════════════════════════

// ── 任務線：林間的鏽蝕迴聲（QST_MAIN_006 ~ 008）────────────────────

// 任務六：意外的呻吟（交付教學）
export const QST_MAIN_006: QuestDef = {
  id: 'QST-main-006',
  name: '意外的呻吟',
  description: '在斷崖邊發現受傷的老漢克，交付初級治療藥水急救。',
  acceptMode: 'auto',
  storyNote: '物物在前往採集的途中，於微光村郊外的斷崖邊聽到金屬摩擦聲與慘叫。老漢克被倒下的螢光木壓住，鏽蝕的機械義肢嚴重變形割傷了腿部。這場意外展現了煉金術師作為「急救者」的角色定位。',
  blockingNote: '任務進行中，小迪應隱藏或設為不可互動（等任務二才出現）。老漢克位置固定在斷崖邊（500, 200）。',
  designNote: '體驗重點：讓玩家感受「一瓶藥水的重量」，理解在資源匱乏的環境中，煉金術師的急救價值。簡單的交付任務作為教學引導。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-005',
      acceptText: '該死的……這廢墟撿來的關節竟然在這時候卡死……喂，物物，別在那看戲，你身上隨便什麼藥水都行，先幫我止血！',
      onStepComplete: 'continue',  // 承接後直接顯示交付提示
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-005',
      itemId: 'ITM-pot-0002',  // 治療藥水
      wrongItemMessage: '不是這個……我需要能止血的藥水！',
      message: '把治療藥水交給老漢克止血。',
      bubbleEntityId: 'OBJ-npc-005',
      bubbleItemId: 'ITM-pot-0002',
    },
    {
      type: 'complete',
      completeMessage: '呼……好多了。但我的腿被這該死的金屬夾住了，一個人搬不動這木頭……小迪應該在附近巡邏，去找他來幫忙！',
    },
  ],
};

// 任務七：求援的腳蹤（交談與連動）
export const QST_MAIN_007: QuestDef = {
  id: 'QST-main-007',
  name: '求援的腳蹤',
  description: '在斷崖附近找到躲在樹後的小迪，請他回村叫人來幫忙。',
  prerequisiteQuestId: 'QST-main-006',
  acceptMode: 'forced',  // 前一任務完成後直接承接
  storyNote: '藥水止住了血，但老漢克的腿被變形的金屬夾得死死的，單憑物物一人無法搬開重木。老漢克指示小迪就在附近巡邏——這個膽小但熱血的年輕學徒，對魔物氣息過於敏感。',
  blockingNote: '小迪此時應出現在地圖上（800, 350），任務完成後小迪「飛奔離去」（可設為隱藏或移出地圖）。',
  designNote: '體驗重點：透過尋找 NPC 的過程，讓玩家熟悉地圖探索。小迪的對話展現「務實鄰里關係」的人情味——雖然嚇得跳起來，但立刻答應幫忙。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-005',
      acceptText: '小迪就在附近的樹林裡巡邏，去找他！快點，我撐不了太久……',
    },
    {
      type: 'interact_with',
      entityId: 'OBJ-npc-006',
      message: '在斷崖附近找到小迪。',
      bubbleEntityId: 'OBJ-npc-006',
      bubbleLabel: '找小迪',
      introDialogue: [
        { speaker: 'OBJ-npc-006', content: '哇啊！是魔物嗎？……呼，是物物哥啊。' },
        { speaker: 'player', content: '小迪！漢克大叔受傷了，被倒下的螢光木壓住！' },
        { speaker: 'OBJ-npc-006', content: '什麼？漢克大叔受傷了？我、我這就回村子叫醫生和搬運組過來！' },
      ],
      onStepComplete: { dialogue: 'continue', hideNpc: 'OBJ-npc-006' },  // 對話繼續 + 小迪離開
    },
    {
      type: 'complete',
      completeMessage: '小迪飛奔離去了。回去照顧老漢克吧，等待救援的同時還得處理他的傷口……',
    },
  ],
};

// 任務八：野派的應急處理（採集與加工）
export const QST_MAIN_008: QuestDef = {
  id: 'QST-main-008',
  name: '野派的應急處理',
  description: '採集清淤草，加工成藥碎後敷在老漢克的傷口上。',
  prerequisiteQuestId: 'QST-main-007',
  acceptMode: 'forced',
  storyNote: '等待救援時，老漢克的傷口因為金屬鏽蝕開始發黑。這種狀況光靠藥水不夠，需要當地的「清淤草」來吸除毒素。這是「野派煉金」的核心——隨採隨用，因地制宜。',
  blockingNote: '清淤草資源點應在地圖上可見（350, 150 附近）。此任務展示採集 → 加工 → 交付的完整流程。',
  designNote: '體驗重點：學習「野派煉金」隨採隨用的便利性。透過老漢克的評價「雖然看起來像爛泥，但涼涼的……感覺好多了」，傳達煉金術雖不華麗但實用的價值。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-005',
      acceptText: '該死……傷口因為這舊時代的鐵鏽開始發黑了。光靠藥水不夠，你得去找「清淤草」——就是那種發出淡淡紫光的長葉草，把它搗碎敷在傷口上！',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-005',
      itemId: 'ITM-mat-0011',  // 清淤草藥碎（加工後）
      wrongItemMessage: '這不對……你得先把清淤草搗碎成藥碎才能用！',
      message: '採集清淤草，加工成藥碎後交給老漢克。',
      bubbleEntityId: 'OBJ-npc-005',
      bubbleItemId: 'ITM-mat-0011',
      dialogueByEntity: {
        'OBJ-npc-006': ['（小迪已經跑回村子叫人了）'],
      },
    },
    {
      type: 'complete',
      completeMessage: '這就是你們那套「野派」做法？雖然看起來像爛泥，但涼涼的……感覺好多了。謝了，物物。',
    },
  ],
};

// ── 任務線：完美的齒輪油（QST_MAIN_009 ~ 011）────────────────────

// 任務九：湊合著用的下場（基礎合成教學）
export const QST_MAIN_009: QuestDef = {
  id: 'QST-main-009',
  name: '湊合著用的下場',
  description: '用螢茸豬油和石晶粉合成潤滑油，但品質不佳被退回。',
  prerequisiteQuestId: 'QST-main-008',
  acceptMode: 'chained',  // 前一任務完成後自動開啟對話
  storyNote: '維修工羅根的升降梯傳動軸卡住了，急需潤滑油。他給了物物一些「螢茸豬油」與「磨細的石晶粉」，但物物隨手搓出的混濁潤滑油雜質太多，被羅根打臉退回。',
  blockingNote: '羅根應位於地圖上（300, 400）。此任務需要玩家已持有或被給予螢茸豬油和石晶粉。',
  designNote: '體驗重點：挫折感。讓玩家體會「工具品質影響產出價值」的核心邏輯。被 NPC 打臉的經驗會加深對後續工具升級的渴望。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-007',
      acceptText: '升降梯的傳動軸卡住了！這是螢茸豬油和石晶粉，幫我合成潤滑油，快！',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-007',
      itemId: 'ITM-pot-0004',  // 混濁潤滑油
      wrongItemMessage: '我需要的是潤滑油！用螢茸豬油和石晶粉合成。',
      message: '把螢茸豬油和石晶粉合成潤滑油交給羅根。',
      bubbleEntityId: 'OBJ-npc-007',
      bubbleItemId: 'ITM-pot-0004',
    },
    {
      type: 'complete',
      completeMessage: '這……這真的能用嗎？（抹上去後發出刺耳尖叫聲）可惡！這雜質太多了，會毀掉引擎的！拿回去，這不行！去找村裡的托托老頭，看他有沒有辦法。',
    },
  ],
};

// 任務十：濾網的力量（工具加工）
export const QST_MAIN_010: QuestDef = {
  id: 'QST-main-010',
  name: '濾網的力量',
  description: '向托托借用濾網，過濾豬油後再合成精製潤滑油。',
  prerequisiteQuestId: 'QST-main-009',
  acceptMode: 'forced',
  storyNote: '物物帶著被退回的油去找托托。托托笑著拿出一副「細密金屬濾網」，教導物物：沒經過濾的油就像帶著沙子的飯。這展示了「初階工具加工」的概念——改變素材物理性質，進而提升成品品質。',
  blockingNote: '托托應位於地圖上（650, 500）。此任務需引導玩家使用濾網工具。',
  designNote: '體驗重點：進步感。從「被打臉」到「獲得認可」的轉折。視覺上從「渾濁的油」進化到「精製潤滑油」，強化品質差異的反饋。',
  npcPositionOverrides: {
    'OBJ-npc-008': { x: 400, y: 350 },  // 托托移動到中間位置方便找
  },
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-008',
      acceptText: '喔？被那個傲慢的城裡人嫌棄了？哈哈，小傢伙，沒經過濾的油就像帶著沙子的飯。試試這濾網，把那些雜質弄掉再混粉末。工具是有靈魂的！',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-007',
      itemId: 'ITM-pot-0005',  // 精製潤滑油
      wrongItemMessage: '這還是不對……你有用濾網過濾豬油嗎？',
      message: '用濾網過濾豬油後合成精製潤滑油，交給羅根。',
      bubbleEntityId: 'OBJ-npc-007',
      bubbleItemId: 'ITM-pot-0005',
      dialogueByEntity: {
        'OBJ-npc-008': ['去吧，讓那城裡人看看鄉下的手藝！'],
      },
    },
    {
      type: 'complete',
      completeMessage: '好多了，但齒輪運轉還是有點發熱……如果你能弄到大都市水準的「穩定劑」就好了。或許托托那堆古董裡有什麼寶貝？',
    },
  ],
};

// 任務十一：核心共鳴提取（高階工具）
export const QST_MAIN_011: QuestDef = {
  id: 'QST-main-011',
  name: '核心共鳴提取',
  description: '使用古文明共鳴燒瓶，合成出超越大都市水準的極致潤滑劑。',
  prerequisiteQuestId: 'QST-main-010',
  acceptMode: 'forced',
  storyNote: '托托從床底翻出一個發光的「古文明共鳴燒瓶」。如果能在合成時加入「共鳴震盪」，石晶粉能徹底融入油中，產出甚至超越大都市工坊水準的「極致藍光潤滑劑」。',
  blockingNote: '此任務需引導玩家裝備並使用古文明共鳴燒瓶。完成後可解鎖新地圖或劇情。',
  designNote: '體驗重點：成就感的高峰。羅根的驚訝反應（「這甚至比都市工坊做的還純淨！」）是對玩家成長的最佳肯定。視覺上「瓶中流動的藍光」強化高品質產出的滿足感。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-008',
      acceptText: '不服氣？哈哈，好！看看這個——這是我收藏的「古文明共鳴燒瓶」。如果能讓石晶粉在共鳴中徹底融入……嘿嘿，那可不是普通的油了。',
    },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-007',
      itemId: 'ITM-pot-0006',  // 極致藍光潤滑劑
      wrongItemMessage: '這不夠好……用那個發光的燒瓶試試？',
      message: '使用古文明共鳴燒瓶合成極致藍光潤滑劑，交給羅根。',
      bubbleEntityId: 'OBJ-npc-007',
      bubbleItemId: 'ITM-pot-0006',
      dialogueByEntity: {
        'OBJ-npc-008': ['讓他見識見識古文明的力量！'],
      },
      introDialogue: [
        { speaker: 'player', content: '這次用了托托爺爺的燒瓶……' },
        { speaker: 'OBJ-npc-007', content: '又來了？這次又是什麼土法煉金……等等，這瓶子在發光？' },
      ],
    },
    {
      type: 'complete',
      completeMessage: '這……這甚至比都市工坊做的還純淨！你到底是怎麼辦到的？這下升降梯不但能動，連噪音都沒了！拿著，這是給你的報酬——還有這枚「大都市通行幣」，歡迎來歐姆尼亞！',
    },
  ],
};

// ========== 任務表與查詢 ==========

export const questTable: Record<string, QuestDef> = {
  [QST_MAIN_001.id]: QST_MAIN_001,
  [QST_MAIN_002.id]: QST_MAIN_002,
  [QST_MAIN_003.id]: QST_MAIN_003,
  [QST_MAIN_004.id]: QST_MAIN_004,
  [QST_MAIN_005.id]: QST_MAIN_005,
  [QST_MAIN_006.id]: QST_MAIN_006,
  [QST_MAIN_007.id]: QST_MAIN_007,
  [QST_MAIN_008.id]: QST_MAIN_008,
  [QST_MAIN_009.id]: QST_MAIN_009,
  [QST_MAIN_010.id]: QST_MAIN_010,
  [QST_MAIN_011.id]: QST_MAIN_011,
};

export function getQuest(id: string): QuestDef | undefined {
  return questTable[id];
}

// 判斷任務是否已解鎖：無前置任務則永遠開放；有前置則需在 completedQuestIds 中
// 供 TopBar 任務選單顯示鎖定狀態，以及完成彈窗的「繼續下一個任務」按鈕使用
export function isQuestUnlocked(quest: QuestDef, completedQuestIds: string[]): boolean {
  if (!quest.prerequisiteQuestId) return true;
  return completedQuestIds.includes(quest.prerequisiteQuestId);
}

// ========== 連續任務系統工具函數（MVP-02-4）==========

// 取得任務發放 NPC 的 entityId（來自 start 步驟）
export function getQuestGiverNpcId(quest: QuestDef): string | undefined {
  const startStep = getStartStep(quest);
  return startStep?.entityId;
}

// 取得指定 NPC 在指定地圖上可發放的任務列表
// 條件：1. 任務的 start.entityId === npcId
//       2. 任務對應的地圖 === mapId（透過 questList 查詢）
//       3. 任務尚未完成
//       4. 前置任務已完成（或無前置）
import { questList } from './questList';

export function getAvailableQuestsForNpc(
  npcId: string,
  mapId: string,
  completedQuestIds: string[]
): QuestDef[] {
  // 取得該地圖的所有任務 ID
  const questIdsInMap = questList
    .filter((q) => q.mapId === mapId)
    .map((q) => q.questId);

  const available: QuestDef[] = [];

  for (const questId of questIdsInMap) {
    const quest = questTable[questId];
    if (!quest) continue;

    // 檢查是否由此 NPC 發放
    const giverNpcId = getQuestGiverNpcId(quest);
    if (giverNpcId !== npcId) continue;

    // 檢查是否已完成
    if (completedQuestIds.includes(questId)) continue;

    // 檢查是否已解鎖（前置任務完成）
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;

    available.push(quest);
  }

  return available;
}

// 取得指定地圖上所有可接任務（不限 NPC）
export function getAvailableQuestsForMap(
  mapId: string,
  completedQuestIds: string[]
): QuestDef[] {
  const questIdsInMap = questList
    .filter((q) => q.mapId === mapId)
    .map((q) => q.questId);

  const available: QuestDef[] = [];

  for (const questId of questIdsInMap) {
    const quest = questTable[questId];
    if (!quest) continue;
    if (completedQuestIds.includes(questId)) continue;
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;
    available.push(quest);
  }

  return available;
}

// ========== 任務追蹤系統（MVP-02-4 簡化版）==========

// 取得指定地圖上「下一個應進行的任務」（按 chainOrder 排序，取第一個可接的）
export function getNextQuest(
  mapId: string,
  completedQuestIds: string[]
): QuestDef | null {
  // 取得該地圖的任務，按 chainOrder 排序
  const questsInMap = questList
    .filter((q) => q.mapId === mapId)
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

  for (const entry of questsInMap) {
    const quest = questTable[entry.questId];
    if (!quest) continue;
    // 已完成的跳過
    if (completedQuestIds.includes(entry.questId)) continue;
    // 前置任務未完成的跳過
    if (!isQuestUnlocked(quest, completedQuestIds)) continue;
    // 找到第一個可接的任務
    return quest;
  }

  return null;  // 該地圖所有任務都完成了
}

// 取得當前可互動的 NPC ID
// idle 狀態：返回下一個任務的發放 NPC
// accepted 狀態：返回當前步驟涉及的 NPC（entityId 或 bubbleEntityId）
export function getInteractableNpcId(
  quest: QuestDef | null,
  questPhase: QuestPhase,
  stepIndex: number
): string | null {
  if (!quest) return null;

  if (questPhase === 'idle') {
    // idle 狀態：返回任務發放 NPC
    return getQuestGiverNpcId(quest) ?? null;
  }

  if (questPhase === 'accepted') {
    // accepted 狀態：返回當前步驟的目標 NPC
    const step = getCurrentStep(quest, stepIndex);
    if (!step || step.type === 'start' || step.type === 'complete') return null;
    // 優先使用 bubbleEntityId，否則使用 entityId
    if ('bubbleEntityId' in step && step.bubbleEntityId) {
      return step.bubbleEntityId;
    }
    return step.entityId;
  }

  return null;
}
