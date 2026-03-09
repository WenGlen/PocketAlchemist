import { useState } from 'react';
import { EntitySelect } from '../EntitySelect';
import { BubbleEditor } from '../BubbleEditor';
import { DialogueByEntityEditor } from '../DialogueByEntityEditor';
import type { DialogueByEntity } from '../DialogueByEntityEditor';
import { IntroDialogueEditor } from '../IntroDialogueEditor';
import type { IntroLine } from '../IntroDialogueEditor';
import { StepCompleteEditor } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';

const DEFAULT_BUBBLE = { bubbleEntityId: '', bubbleItemId: '', bubbleLabel: '' };
const DEFAULT_COMPLETE: StepCompleteState = { mode: 'close', dialogue: 'close', hideNpc: [], showNpc: [] };

export function InteractWithStepEditor() {
  const [entityId, setEntityId] = useState('');
  const [message, setMessage] = useState('');
  const [completeMessage, setCompleteMessage] = useState('');
  const [bubble, setBubble] = useState(DEFAULT_BUBBLE);
  const [dialogueByEntity, setDialogueByEntity] = useState<DialogueByEntity>({});
  const [introDialogue, setIntroDialogue] = useState<IntroLine[]>([]);
  const [onComplete, setOnComplete] = useState<StepCompleteState>(DEFAULT_COMPLETE);

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-purple-50 px-4 py-3 text-sm text-purple-700">
        <strong>interact_with</strong>：玩家與指定 NPC 或物件互動，不涉及道具交換（純對話或觸發劇情）。
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          互動目標 NPC / 物件 <span className="text-red-500">*</span>
          <span className="ml-1 font-normal text-gray-400 text-xs">entityId</span>
        </label>
        <EntitySelect value={entityId} onChange={setEntityId} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          任務追蹤提示
          <span className="ml-1 font-normal text-gray-400 text-xs">message</span>
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="例：在斷崖附近找到小迪。"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          互動完成後顯示訊息
          <span className="ml-1 font-normal text-gray-400 text-xs">completeMessage</span>
        </label>
        <textarea
          value={completeMessage}
          onChange={(e) => setCompleteMessage(e.target.value)}
          rows={2}
          placeholder="例：辛苦了，感謝你的幫助！"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <StepCompleteEditor value={onComplete} onChange={setOnComplete} showAdvanced />
      <BubbleEditor value={bubble} onChange={setBubble} entityIdDefault={entityId} />
      <DialogueByEntityEditor value={dialogueByEntity} onChange={setDialogueByEntity} />
      <IntroDialogueEditor value={introDialogue} onChange={setIntroDialogue} />
    </div>
  );
}
