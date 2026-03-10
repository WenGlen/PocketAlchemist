import { useState } from 'react';
import { EntitySelect } from './EntitySelect';
import { ItemSelect } from './ItemSelect';
import { getNpcName, getItemEmoji, getItemName } from '../adminConstants';

interface BubbleState {
  bubbleEntityId: string;
  bubbleItemId: string;
  bubbleLabel: string;
}

interface Props {
  value: BubbleState;
  onChange: (v: BubbleState) => void;
  entityIdDefault?: string; // 預設 entityId（用於顯示「空 = 用 entityId」提示）
}

export function BubbleEditor({ value, onChange, entityIdDefault }: Props) {
  const [open, setOpen] = useState(false);

  const preview = (() => {
    const entityLabel = value.bubbleEntityId
      ? getNpcName(value.bubbleEntityId)
      : entityIdDefault
        ? `${getNpcName(entityIdDefault)}（預設）`
        : '未設定';
    const content = value.bubbleLabel
      ? value.bubbleLabel
      : value.bubbleItemId
        ? `${getItemEmoji(value.bubbleItemId)} ${getItemName(value.bubbleItemId)}`
        : '（無顯示內容）';
    return `顯示於 ${entityLabel} → ${content}`;
  })();

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>
          泡泡設定（Bubble）
          {(value.bubbleLabel || value.bubbleItemId || value.bubbleEntityId) && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">已設定</span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">泡泡顯示 NPC</label>
            <EntitySelect
              value={value.bubbleEntityId}
              onChange={(v) => onChange({ ...value, bubbleEntityId: v })}
              placeholder="（沿用 entityId）"
            />
            <p className="mt-1 text-xs text-gray-400">空 = 沿用步驟的 entityId</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">泡泡道具圖示</label>
            <ItemSelect
              value={value.bubbleItemId}
              onChange={(v) => onChange({ ...value, bubbleItemId: v })}
              placeholder="（不顯示道具）"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">泡泡文字標籤</label>
            <input
              type="text"
              value={value.bubbleLabel}
              onChange={(e) => onChange({ ...value, bubbleLabel: e.target.value })}
              placeholder="例：領取藥草、交付茶"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="rounded bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            預覽：{preview}
          </div>
        </div>
      )}
    </div>
  );
}
