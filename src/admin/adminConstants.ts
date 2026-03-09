// 後台用的靜態參考資料（從 objectsTable / itemsTable / mapsTable 提取）

export interface NpcOption {
  id: string;
  name: string;
  emoji: string;
}

export interface ItemOption {
  id: string;
  name: string;
  emoji: string;
}

export interface MapOption {
  id: string;
  name: string;
}

export const NPC_OPTIONS: NpcOption[] = [
  { id: 'OBJ-npc-001', name: '茶攤老闆', emoji: '👨‍💼' },
  { id: 'OBJ-npc-002', name: '藥師', emoji: '🧑‍⚕️' },
  { id: 'OBJ-npc-003', name: '園丁', emoji: '👨‍🌾' },
  { id: 'OBJ-npc-004', name: '旅行商人', emoji: '🧑‍💼' },
  { id: 'OBJ-npc-005', name: '老漢克', emoji: '👴🏻' },
  { id: 'OBJ-npc-006', name: '小迪', emoji: '👦🏻' },
  { id: 'OBJ-npc-007', name: '維修工羅根', emoji: '🧑‍🔧' },
  { id: 'OBJ-npc-008', name: '老木匠托托', emoji: '👨‍🦳' },
];

export const ITEM_OPTIONS: ItemOption[] = [
  { id: 'ITM-mat-0001', name: '玻璃瓶', emoji: '🫙' },
  { id: 'ITM-mat-0002', name: '茶葉', emoji: '🍃' },
  { id: 'ITM-mat-0003', name: '裝水的玻璃瓶', emoji: '💧' },
  { id: 'ITM-mat-0004', name: '藥草', emoji: '🌿' },
  { id: 'ITM-mat-0006', name: '火粉', emoji: '🔥' },
  { id: 'ITM-mat-0010', name: '清淤草', emoji: '🌱' },
  { id: 'ITM-mat-0011', name: '清淤草藥碎', emoji: '🟢' },
  { id: 'ITM-mat-0012', name: '螢茸豬油', emoji: '🧈' },
  { id: 'ITM-mat-0013', name: '磨細的石晶粉', emoji: '🪨' },
  { id: 'ITM-mat-0014', name: '澄清豬油', emoji: '✨' },
  { id: 'ITM-pot-0001', name: '不好喝的茶', emoji: '🍵' },
  { id: 'ITM-pot-0002', name: '治療藥水', emoji: '🧪' },
  { id: 'ITM-pot-0003', name: '爆裂藥水', emoji: '💣' },
  { id: 'ITM-pot-0004', name: '混濁潤滑油', emoji: '🟤' },
  { id: 'ITM-pot-0005', name: '精製潤滑油', emoji: '🛢️' },
  { id: 'ITM-pot-0006', name: '極致藍光潤滑劑', emoji: '💙' },
  { id: 'ITM-eqp-0001', name: '簡易加熱器', emoji: '🔥' },
  { id: 'ITM-eqp-0002', name: '手套', emoji: '🧤' },
];

export const MAP_OPTIONS: MapOption[] = [
  { id: 'MAP-field-001', name: '野外初生地' },
  { id: 'MAP-field-002', name: '幽林深處' },
  { id: 'MAP-shimmer-001', name: '微光村斷崖' },
];

export const ACCEPT_MODE_OPTIONS = [
  { value: 'auto', label: 'auto', desc: '開啟對話窗即自動承接（預設）', color: 'bg-green-100 text-green-800' },
  { value: 'manual', label: 'manual', desc: '對話窗顯示「接受任務」按鈕，需主動點擊', color: 'bg-blue-100 text-blue-800' },
  { value: 'forced', label: 'forced', desc: '前一任務完成後直接進入 accepted，跳過 idle', color: 'bg-orange-100 text-orange-800' },
  { value: 'chained', label: 'chained', desc: '前一任務完成後，關閉彈窗時自動開啟 start 對話窗', color: 'bg-purple-100 text-purple-800' },
] as const;

export const STEP_TYPE_OPTIONS = [
  { value: 'start', label: 'start', desc: '承接任務（發放 NPC 的對話）', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'receive_from', label: 'receive_from', desc: '向 NPC 領取道具', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'deliver_to', label: 'deliver_to', desc: '將道具交給 NPC', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'interact_with', label: 'interact_with', desc: '與 NPC 或物件互動（純對話）', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'complete', label: 'complete', desc: '任務結束（完成彈窗）', color: 'bg-gray-100 text-gray-600 border-gray-200' },
] as const;

export type StepType = 'start' | 'receive_from' | 'deliver_to' | 'interact_with' | 'complete';

export function getStepTypeStyle(type: StepType): string {
  return STEP_TYPE_OPTIONS.find((o) => o.value === type)?.color ?? 'bg-gray-100 text-gray-600';
}

export function getAcceptModeStyle(mode: string): string {
  return ACCEPT_MODE_OPTIONS.find((o) => o.value === mode)?.color ?? 'bg-gray-100 text-gray-600';
}

export function getNpcName(id: string): string {
  return NPC_OPTIONS.find((n) => n.id === id)?.name ?? id;
}

export function getItemName(id: string): string {
  return ITEM_OPTIONS.find((i) => i.id === id)?.name ?? id;
}

export function getItemEmoji(id: string): string {
  return ITEM_OPTIONS.find((i) => i.id === id)?.emoji ?? '📦';
}
