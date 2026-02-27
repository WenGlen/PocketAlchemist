export const dialogueData: Record<string, string[]> = {
  npc_tea_vendor: ['歡迎來喝杯茶。', '改天再來啊。'],
};

export function getDialogueLines(key: string): string[] {
  return dialogueData[key] ?? ['……'];
}
