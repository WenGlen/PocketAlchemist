//════════════════════════════════════════════════════════════════
// 事件定義表
//════════════════════════════════════════════════════════════════
// 事件（Event）：由特定條件觸發的一次性劇情演出，用於：
//   - 顯示過場敘述文字（如：場景轉換前的說明）
//   - 觸發地圖切換、NPC 隱藏/顯示等狀態變化
//   - 作為後續任務的前置條件（prerequisiteQuestId 可填入事件 ID）
//
// ID 命名規則：QST-event-{三位數編號}，例如 QST-event-001
// 目前觸發條件：triggerAfterQuestId（任務完成後自動觸發）

// ========== 型別定義 ==========

/** 事件完成後的副作用 */
export interface EventOnComplete {
  /** 切換至指定地圖 */
  switchMap?: string;
  /** 隱藏指定 NPC（單一或多個） */
  hideNpc?: string | string[];
  /** 顯示指定 NPC（單一或多個） */
  showNpc?: string | string[];
}

export interface EventDef {
  id: string;
  /** 完成指定任務後自動觸發此事件 */
  triggerAfterQuestId: string;
  /** 事件敘述文字（顯示於過場視窗） */
  message: string;
  /** 玩家確認後執行的副作用 */
  onComplete?: EventOnComplete;
}

// ========== 事件資料 ==========

// 事件一：老漢克送醫
// 觸發：完成 QST-008（野派的應急處理）後
export const QST_EVENT_001: EventDef = {
  id: 'QST-event-001',
  triggerAfterQuestId: 'QST-main-008',
  message:
    '小迪帶著村裡的幫手趕到了。\n眾人合力搬開壓在老漢克身上的螢光木，將他小心翼翼地抬上了擔架，一路護送往微光村的醫院。',
  onComplete: {
    switchMap: 'MAP-room-001',
  },
};

// ========== 事件列表與查詢 ==========

export const eventList: EventDef[] = [QST_EVENT_001];

/** 取得指定任務完成後應觸發的事件（若有） */
export function getEventByTrigger(questId: string): EventDef | undefined {
  return eventList.find((e) => e.triggerAfterQuestId === questId);
}
