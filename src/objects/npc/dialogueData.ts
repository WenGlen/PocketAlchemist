//════════════════════════════════════════════════════════════════
// NPC 對話資料
//════════════════════════════════════════════════════════════════
// 非任務相關的 NPC 預設對話

export const dialogueData: Record<string, string[]> = {
  npc_tea_vendor: ['聽說你也泡茶嗎？'],
  npc_lab_vendor: ['幫我帶一瓶治療藥水來吧。'],
  npc_lab_gardener: ['我這邊有多的水，需要就拿去吧。', '……'],
};

export function getDialogueLines(key: string): string[] {
  return dialogueData[key] ?? ['……'];
}
