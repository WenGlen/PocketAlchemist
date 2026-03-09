import { useState } from 'react';
import { EntitySelect } from '../EntitySelect';
import { ItemSelect } from '../ItemSelect';
import { BubbleEditor } from '../BubbleEditor';
import { DialogueByEntityEditor } from '../DialogueByEntityEditor';
import type { DialogueByEntity } from '../DialogueByEntityEditor';
import { IntroDialogueEditor } from '../IntroDialogueEditor';
import type { IntroLine } from '../IntroDialogueEditor';
import { StepCompleteEditor } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';

const DEFAULT_BUBBLE = { bubbleEntityId: '', bubbleItemId: '', bubbleLabel: '' };
const DEFAULT_COMPLETE: StepCompleteState = { mode: 'close', dialogue: 'close', hideNpc: [], showNpc: [] };

export function ReceiveFromStepEditor() {
  const [entityId, setEntityId] = useState('');
  const [itemId, setItemId] = useState('');
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState('');
  const [receiveMessage, setReceiveMessage] = useState('');
  const [receiveButtonText, setReceiveButtonText] = useState('');
  const [bubble, setBubble] = useState(DEFAULT_BUBBLE);
  const [dialogueByEntity, setDialogueByEntity] = useState<DialogueByEntity>({});
  const [introDialogue, setIntroDialogue] = useState<IntroLine[]>([]);
  const [onComplete, setOnComplete] = useState<StepCompleteState>(DEFAULT_COMPLETE);

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
        <strong>receive_from</strong>：玩家前往指定 NPC 處領取道具。
      </div>

      {/* 必填 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            發放道具 NPC <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">entityId</span>
          </label>
          <EntitySelect value={entityId} onChange={setEntityId} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            道具 <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">itemId</span>
          </label>
          <ItemSelect value={itemId} onChange={setItemId} />
        </div>
      </div>

      <div className="w-32">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          數量
          <span className="ml-1 font-normal text-gray-400 text-xs">count（預設 1）</span>
        </label>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* 文案 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          任務追蹤提示
          <span className="ml-1 font-normal text-gray-400 text-xs">message — 顯示於任務追蹤 UI</span>
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="例：請跟園丁拿藥草。"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          NPC 說的話（領取前）
          <span className="ml-1 font-normal text-gray-400 text-xs">receiveMessage — 對話窗內領取按鈕前顯示的句子</span>
        </label>
        <textarea
          value={receiveMessage}
          onChange={(e) => setReceiveMessage(e.target.value)}
          rows={2}
          placeholder="例：實驗員要你來拿草藥喔，給你吧。"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="w-48">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          領取按鈕文字
          <span className="ml-1 font-normal text-gray-400 text-xs">receiveButtonText（預設「領取」）</span>
        </label>
        <input
          type="text"
          value={receiveButtonText}
          onChange={(e) => setReceiveButtonText(e.target.value)}
          placeholder="領取"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* 子元件 */}
      <StepCompleteEditor value={onComplete} onChange={setOnComplete} />
      <BubbleEditor value={bubble} onChange={setBubble} entityIdDefault={entityId} />
      <DialogueByEntityEditor value={dialogueByEntity} onChange={setDialogueByEntity} />
      <IntroDialogueEditor value={introDialogue} onChange={setIntroDialogue} />
    </div>
  );
}
