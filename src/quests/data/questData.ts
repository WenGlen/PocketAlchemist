export type QuestPhase = 'none' | 'accepted' | 'need_deliver' | 'completed';

export interface QuestDef {
  id: string;
  name: string;
  description?: string;
  /** 承接時顯示的說明 */
  acceptText: string;
  /** 交付物 itemId（正確才完成） */
  deliverItemId: string;
}

export const QST_MAIN_001: QuestDef = {
  id: 'QST-main-001',
  name: '要喝茶',
  description: '茶攤老闆想喝茶。採茶葉、用玻璃瓶裝湖水、合成後交付。',
  acceptText: '幫我弄一杯茶吧。去採茶葉、湖邊用玻璃瓶裝水，合成成茶再拿來。',
  deliverItemId: 'ITM-pot-0001',
};

export const questTable: Record<string, QuestDef> = {
  [QST_MAIN_001.id]: QST_MAIN_001,
};

export function getQuest(id: string): QuestDef | undefined {
  return questTable[id];
}
