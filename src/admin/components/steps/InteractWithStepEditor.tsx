import { forwardRef, useImperativeHandle, useState } from 'react';
import type { QuestStep } from '../../../quests/data/questData';
import { EntitySelect } from '../EntitySelect';
import { BubbleEditor } from '../BubbleEditor';
import { DialogueByEntityEditor } from '../DialogueByEntityEditor';
import type { DialogueByEntity } from '../DialogueByEntityEditor';
import { StepCompleteEditor, DEFAULT_COMPLETE, parseOnStepComplete, buildOnStepComplete } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';
import { NpcOverrideEditor, recordToOverrideArray, arrayToOverrideRecord } from '../NpcOverrideEditor';
import type { NpcOverride } from '../NpcOverrideEditor';

type InteractWithStep = Extract<QuestStep, { type: 'interact_with' }>;

export interface InteractWithStepEditorHandle {
  getStep: () => InteractWithStep;
}

interface Props {
  initialStep?: InteractWithStep;
}

const INPUT = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export const InteractWithStepEditor = forwardRef<InteractWithStepEditorHandle, Props>(
  function InteractWithStepEditor({ initialStep }, ref) {
    const [entityId, setEntityId] = useState(initialStep?.entityId ?? '');
    const [message, setMessage] = useState(initialStep?.message ?? '');
    const [npcMessage, setNpcMessage] = useState(initialStep?.npcMessage ?? '');
    const [confirmButtonText, setConfirmButtonText] = useState(initialStep?.confirmButtonText ?? '');
    const [bubble, setBubble] = useState({
      bubbleEntityId: initialStep?.bubbleEntityId ?? '',
      bubbleItemId: '',
      bubbleLabel: initialStep?.bubbleLabel ?? '',
    });
    const [dialogueByEntity, setDialogueByEntity] = useState<DialogueByEntity>(
      initialStep?.dialogueByEntity ?? {}
    );
    const [onComplete, setOnComplete] = useState<StepCompleteState>(() =>
      parseOnStepComplete(initialStep?.onStepComplete)
    );
    const [npcOverrides, setNpcOverrides] = useState<NpcOverride[]>(() =>
      recordToOverrideArray(initialStep?.npcPositionOverrides)
    );
    const [npcOverrideOpen, setNpcOverrideOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      getStep: () => {
        const stepComplete = buildOnStepComplete(onComplete);
        const overrides = arrayToOverrideRecord(npcOverrides);
        return {
          type: 'interact_with',
          entityId,
          ...(message && { message }),
          ...(npcMessage && { npcMessage }),
          ...(confirmButtonText && { confirmButtonText }),
          ...(bubble.bubbleEntityId && { bubbleEntityId: bubble.bubbleEntityId }),
          ...(bubble.bubbleLabel && { bubbleLabel: bubble.bubbleLabel }),
          ...(Object.keys(dialogueByEntity).length > 0 && { dialogueByEntity }),
          ...(stepComplete !== undefined && { onStepComplete: stepComplete }),
          ...(overrides && { npcPositionOverrides: overrides }),
        };
      },
    }));

    return (
      <div className="space-y-4">
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
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="例：在斷崖附近找到小迪。" className={INPUT} />
          <p className="mt-1 text-xs text-gray-400">顯示於任務追蹤 UI</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            NPC 說的話（確認按鈕前）
            <span className="ml-1 font-normal text-gray-400 text-xs">npcMessage</span>
          </label>
          <textarea value={npcMessage} onChange={(e) => setNpcMessage(e.target.value)} rows={2} placeholder="例：辛苦了，任務完成了嗎？" className={INPUT} />
        </div>

        <div className="w-48">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            確認按鈕文字
            <span className="ml-1 font-normal text-gray-400 text-xs">confirmButtonText</span>
          </label>
          <input type="text" value={confirmButtonText} onChange={(e) => setConfirmButtonText(e.target.value)} placeholder="確認" className={INPUT} />
          <p className="mt-1 text-xs text-gray-400">預設「確認」</p>
        </div>

        <StepCompleteEditor value={onComplete} onChange={setOnComplete} showAdvanced />
        <BubbleEditor value={bubble} onChange={setBubble} entityIdDefault={entityId} />
        <DialogueByEntityEditor value={dialogueByEntity} onChange={setDialogueByEntity} />

        <div className="rounded-md border border-gray-200 bg-gray-50">
          <button type="button" onClick={() => setNpcOverrideOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100">
            <span>
              此步驟 NPC 位置覆蓋（npcPositionOverrides）
              {npcOverrides.length > 0 && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">{npcOverrides.length}</span>}
            </span>
            <span className="text-gray-400">{npcOverrideOpen ? '▲' : '▼'}</span>
          </button>
          {npcOverrideOpen && <div className="border-t border-gray-200 px-4 pb-4 pt-3"><NpcOverrideEditor value={npcOverrides} onChange={setNpcOverrides} /></div>}
        </div>

        <div className="rounded-md bg-purple-50 px-4 py-3 text-sm text-purple-600">
          <strong>interact_with</strong>：玩家與指定 NPC 互動，需主動點確認按鈕才完成步驟（適合回報、確認等場景）。
        </div>
      </div>
    );
  }
);

export { DEFAULT_COMPLETE };
