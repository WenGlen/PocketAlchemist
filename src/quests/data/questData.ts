//════════════════════════════════════════════════════════════════
// 任務定義表
//════════════════════════════════════════════════════════════════
// 純任務內容：型別定義 + 任務資料
// 查詢函數與 runtime 邏輯請見 questUtils.ts
//
// ID 命名規則：
// 主線任務：QST-main-
// 支線任務：QST-side-
// 事件：QST-event-
//════════════════════════════════════════════════════════════════
// ========== 型別定義 ==========

// idle: 無進行中任務（可自由探索、找 NPC 接任務）
// accepted: 任務進行中
// completed: 任務剛完成（用於顯示完成訊息，之後切回 idle）
export type QuestPhase = 'idle' | 'accepted' | 'completed';

// 對話行（talk_to 步驟使用）
export interface DialogueLine {
  speaker: 'player' | string;  // 'player' = 主角，其他為 NPC entityId
  content: string;
}

// 步驟完成時的副作用控制
// 注意：start / talk_to 步驟永遠自動繼續到下一步，dialogue 欄位對這兩種無效
// dialogue 僅對 receive_from / deliver_to / interact_with / complete 有意義
export interface StepCompleteAction {
  /** 'close' 關閉對話框（預設）, 'continue' 保持開啟顯示下一步 */
  dialogue?: 'close' | 'continue';
  /** 隱藏指定 NPC（單一或多個） */
  hideNpc?: string | string[];
  /** 顯示指定 NPC（單一或多個） */
  showNpc?: string | string[];
}

// 步驟共用欄位
interface StepBase {
  /**
   * 步驟完成後的副作用控制
   * - start / talk_to：此欄位只支援 hideNpc / showNpc（對話框永遠自動繼續）
   * - 其他步驟：可設 'close'（預設）、'continue' 或完整 StepCompleteAction
   */
  onStepComplete?: 'close' | 'continue' | StepCompleteAction;
  /** 步驟層級的 NPC 位置覆蓋，步驟結束後自動還原 */
  npcPositionOverrides?: Record<string, NpcPositionOverride>;
}

// 單一步驟型別
// entityId 選填：未設定時自動繼承 QuestDef.defaultEntityId
export type QuestStep =
  | (StepBase & {
      type: 'start';
      entityId?: string;
      acceptText: string;
    })
  | (StepBase & {
      type: 'talk_to';
      entityId?: string;
      lines: DialogueLine[];          // 對話行陣列，跑完後自動完成步驟
      message?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleLabel?: string;
    })
  | (StepBase & {
      type: 'receive_from';
      entityId?: string;
      itemId: string;
      count?: number;
      message?: string;
      npcMessage?: string;            // 對話窗內 NPC 說的話（出現在領取按鈕前）
      actionButtonText?: string;      // 領取按鈕文字，預設「領取」
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
    })
  | (StepBase & {
      type: 'deliver_to';
      entityId?: string;
      itemId: string;
      message?: string;
      npcMessage?: string;            // 對話窗內 NPC 說的話（出現在交付區域前）
      wrongItemMessage?: string;
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleItemId?: string;
      bubbleLabel?: string;
    })
  | (StepBase & {
      type: 'interact_with';
      entityId?: string;
      message?: string;
      npcMessage?: string;            // 對話窗內 NPC 說的話（出現在確認按鈕前）
      confirmButtonText?: string;     // 確認按鈕文字，預設「確認」
      dialogueByEntity?: Record<string, string[]>;
      bubbleEntityId?: string;
      bubbleLabel?: string;
    })
  | (StepBase & {
      type: 'complete';
      completeMessage?: string;
    });

// 任務承接方式
// auto:    開啟對話窗即自動承接（預設）
// manual:  對話窗顯示「接受任務」按鈕，需主動點擊
// forced:  前一任務完成後直接進入 accepted，跳過 idle
// chained: 前一任務完成後，關閉彈窗時自動開啟 start 對話窗
export type AcceptMode = 'manual' | 'auto' | 'forced' | 'chained';

// NPC 位置覆蓋：任務期間臨時移動 NPC
export interface NpcPositionOverride {
  x: number;
  y: number;
}

export interface QuestDef {
  id: string;
  name: string;
  description?: string;
  prerequisiteQuestId?: string;
  acceptMode?: AcceptMode;
  /**
   * 任務的主要 NPC entityId（預設值）
   * 步驟未指定 entityId 時自動繼承此值，避免每個步驟重複填寫
   */
  defaultEntityId?: string;
  steps: QuestStep[];
  npcPositionOverrides?: Record<string, NpcPositionOverride>;

  // ── 備註欄位（不影響邏輯）──
  storyNote?: string;
  blockingNote?: string;
  designNote?: string;
}

// ========== 任務資料 ==========

// ── MAP-field-003：微光村斷崖 ──────────────────────────────────────
// 任務線：林間的鏽蝕迴聲（QST_MAIN_006 ~ 008）

// 任務六：意外的呻吟
export const QST_MAIN_006: QuestDef = {
  id: 'QST-main-006',
  name: '意外的呻吟',
  description: '在斷崖邊發現受傷的老漢克，交付初級治療藥水急救。',
  acceptMode: 'auto',
  defaultEntityId: 'OBJ-npc-005',   // 所有未指定 entityId 的步驟皆繼承此值
  storyNote: '物物在前往採集的途中，於微光村郊外的斷崖邊聽到金屬摩擦聲與慘叫。老漢克被倒下的螢光木壓住，鏽蝕的機械義肢嚴重變形割傷了腿部。這場意外展現了煉金術師作為「急救者」的角色定位。',
  blockingNote: '任務進行中，小迪應隱藏或設為不可互動（等任務二才出現）。老漢克位置固定在斷崖邊（500, 200）。',
  designNote: '體驗重點：讓玩家感受「一瓶藥水的重量」，理解在資源匱乏的環境中，煉金術師的急救價值。簡單的交付任務作為教學引導。',
  steps: [
    {
      type: 'start',
      // entityId 繼承 defaultEntityId
      acceptText: '該死的……物物，別在那看戲！快來幫幫忙！',
      // onStepComplete 不需設定，start 步驟永遠自動繼續
    },
    {
      type: 'talk_to',
      // entityId 繼承 defaultEntityId
      lines: [
        { speaker: 'player', content: '老漢克，你怎麼被樹壓著？\n哇！你還在流血！' },
        { speaker: 'OBJ-npc-005', content: '我哪知道這廢墟撿來的關節這麼廢，竟然在樹倒下的時候卡死……' },
      ],
    },
    {
      type: 'deliver_to',
      // entityId 繼承 defaultEntityId
      itemId: 'ITM-pot-0002',
      wrongItemMessage: '不是這個……我需要能止血的藥水！',
      npcMessage: '別閒聊了！你身上沒有什麼藥水嗎？',
      bubbleItemId: 'ITM-pot-0002',
    },
    {
      type: 'complete',
      completeMessage: '呼……雖然還是會痛，但還能忍。\n我們需要多幾個人才能搬動這木頭……小迪應該在附近巡邏，去找他來幫忙！',
    },
  ],
};

// 任務七：求援的腳蹤
export const QST_MAIN_007: QuestDef = {
  id: 'QST-main-007',
  name: '求援的腳蹤',
  description: '在斷崖附近找到躲在樹後的小迪，請他回村叫人來幫忙。',
  prerequisiteQuestId: 'QST-main-006',
  acceptMode: 'chained',
  storyNote: '藥水止住了血，但老漢克的腿被變形的金屬夾得死死的，單憑物物一人無法搬開重木。老漢克指示小迪就在附近巡邏——這個膽小但熱血的年輕學徒，對魔物氣息過於敏感。',
  blockingNote: '小迪此時出現在地圖（800, 350）。任務完成後小迪隱藏（飛奔回村）。',
  designNote: '體驗重點：透過尋找 NPC 的過程，讓玩家熟悉地圖探索。小迪的對話展現務實鄰里關係的人情味——雖然嚇得跳起來，但立刻答應幫忙。',
  steps: [
    {
      type: 'start',
      entityId: 'OBJ-npc-005',
      // chained 模式：006 完成後老漢克自動開口，告知玩家去找小迪
      acceptText: '小迪應該在東邊的樹林裡巡邏，快去找他！',
      // tap 後小迪現身、對話關閉（因為下一步要找不同 NPC）
      onStepComplete: { showNpc: 'OBJ-npc-006' },
    },
    {
      type: 'talk_to',
      entityId: 'OBJ-npc-006',
      lines: [
        { speaker: 'OBJ-npc-006', content: '哇啊！是魔物嗎？……呼，是物物哥啊。' },
        { speaker: 'player', content: '小迪！漢克大叔受傷了，被倒下的螢光木壓住！' },
        { speaker: 'OBJ-npc-006', content: '什麼？漢克大叔受傷了？我、我這就回村子叫醫生和搬運組過來！' },
      ],
      bubbleLabel: '找小迪',
    },
    {
      type: 'complete',
      completeMessage: '小迪飛奔離去了。回去照顧老漢克吧，等待救援的同時還得處理他的傷口……',
      // 對話關閉時隱藏小迪（他已飛奔回村）
      onStepComplete: { hideNpc: 'OBJ-npc-006' },
    },
  ],
};

// 任務八：野派的應急處理
export const QST_MAIN_008: QuestDef = {
  id: 'QST-main-008',
  name: '野派的應急處理',
  description: '採集清淤草，加工成藥碎後敷在老漢克的傷口上。',
  prerequisiteQuestId: 'QST-main-007',
  acceptMode: 'forced',
  defaultEntityId: 'OBJ-npc-005',
  storyNote: '等待救援時，老漢克的傷口因為金屬鏽蝕開始發黑。這種狀況光靠藥水不夠，需要當地的「清淤草」來吸除毒素。這是「野派煉金」的核心——隨採隨用，因地制宜。',
  blockingNote: '清淤草資源點在地圖（350, 150）。此任務展示採集 → 合成 → 交付的完整流程。',
  designNote: '體驗重點：學習「野派煉金」隨採隨用的便利性。透過老漢克的評價，傳達煉金術雖不華麗但實用的價值。',
  steps: [
    {
      type: 'start',
      // entityId 繼承 defaultEntityId
      acceptText: '該死……傷口因為這舊時代的鐵鏽開始發黑了。光靠藥水不夠，你得去找「清淤草」——就是那種發出淡淡紫光的長葉草，把它搗碎敷在傷口上！',
    },
    {
      type: 'deliver_to',
      // entityId 繼承 defaultEntityId
      itemId: 'ITM-mat-0011',
      wrongItemMessage: '這不對……你得先把清淤草搗碎成藥碎才能用！',
      npcMessage: '快點！傷口已經開始發黑了，找到清淤草就把它搗碎敷上來！',
      bubbleItemId: 'ITM-mat-0011',
    },
    {
      type: 'complete',
      completeMessage: '這就是你們那套「野派」做法？雖然看起來像爛泥，但涼涼的……感覺好多了。謝了，物物。',
    },
  ],
};

// ========== 任務表 ==========

export const localQuestTableData: Record<string, QuestDef> = {
  [QST_MAIN_006.id]: QST_MAIN_006,
  [QST_MAIN_007.id]: QST_MAIN_007,
  [QST_MAIN_008.id]: QST_MAIN_008,
};
