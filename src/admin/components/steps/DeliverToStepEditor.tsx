import { forwardRef, useImperativeHandle, useState } from 'react';
import type { QuestStep } from '../../../quests/data/questData';
import { EntitySelect } from '../EntitySelect';
import { ItemSelect } from '../ItemSelect';
import { BubbleEditor } from '../BubbleEditor';
import { DialogueByEntityEditor } from '../DialogueByEntityEditor';
import type { DialogueByEntity } from '../DialogueByEntityEditor';
import { IntroDialogueEditor } from '../IntroDialogueEditor';
import type { IntroLine } from '../IntroDialogueEditor';
import { StepCompleteEditor, DEFAULT_COMPLETE, parseOnStepComplete, buildOnStepComplete } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';
import { NpcOverrideEditor, recordToOverrideArray, arrayToOverrideRecord } from '../NpcOverrideEditor';
import type { NpcOverride } from '../NpcOverrideEditor';

type DeliverToStep = Extract<QuestStep, { type: 'deliver_to' }>;

export interface DeliverToStepEditorHandle {
  getStep: () => DeliverToStep;
}

interface Props {
  initialStep?: DeliverToStep;
}

const INPUT = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export const DeliverToStepEditor = forwardRef<DeliverToStepEditorHandle, Props>(
  function DeliverToStepEditor({ initialStep }, ref) {
    const [entityId, setEntityId] = useState(initialStep?.entityId ?? '');
    const [itemId, setItemId] = useState(initialStep?.itemId ?? '');
    const [wrongItemMessage, setWrongItemMessage] = useState(initialStep?.wrongItemMessage ?? '');
    const [message, setMessage] = useState(initialStep?.message ?? '');
    const [bubble, setBubble] = useState({
      bubbleEntityId: initialStep?.bubbleEntityId ?? '',
      bubbleItemId: initialStep?.bubbleItemId ?? '',
      bubbleLabel: initialStep?.bubbleLabel ?? '',
    });
    const [dialogueByEntity, setDialogueByEntity] = useState<DialogueByEntity>(
      initialStep?.dialogueByEntity ?? {}
    );
    const [introDialogue, setIntroDialogue] = useState<IntroLine[]>(
      (initialStep?.introDialogue as IntroLine[] | undefined) ?? []
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
          type: 'deliver_to',
          entityId,
          itemId,
          ...(wrongItemMessage && { wrongItemMessage }),
          ...(message && { message }),
          ...(bubble.bubbleEntityId && { bubbleEntityId: bubble.bubbleEntityId }),
          ...(bubble.bubbleItemId && { bubbleItemId: bubble.bubbleItemId }),
          ...(bubble.bubbleLabel && { bubbleLabel: bubble.bubbleLabel }),
          ...(Object.keys(dialogueByEntity).length > 0 && { dialogueByEntity }),
          ...(introDialogue.length > 0 && { introDialogue }),
          ...(stepComplete !== undefined && { onStepComplete: stepComplete }),
          ...(overrides && { npcPositionOverrides: overrides }),
        };
      },
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              收受道具 NPC <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400 text-xs">entityId</span>
            </label>
            <EntitySelect value={entityId} onChange={setEntityId} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              需交付的道具 <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400 text-xs">itemId</span>
            </label>
            <ItemSelect value={itemId} onChange={setItemId} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            錯誤道具提示
            <span className="ml-1 font-normal text-gray-400 text-xs">wrongItemMessage</span>
          </label>
          <input type="text" value={wrongItemMessage} onChange={(e) => setWrongItemMessage(e.target.value)} placeholder="例：不是這個，我要的是茶。" className={INPUT} />
          <p className="mt-1 text-xs text-gray-400">玩家拖放錯誤道具時顯示</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            任務追蹤提示
            <span className="ml-1 font-normal text-gray-400 text-xs">message</span>
          </label>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="例：請把茶交付給茶攤老闆。" className={INPUT} />
          <p className="mt-1 text-xs text-gray-400">顯示於任務追蹤 UI</p>
        </div>

        <StepCompleteEditor value={onComplete} onChange={setOnComplete} />
        <BubbleEditor value={bubble} onChange={setBubble} entityIdDefault={entityId} />
        <DialogueByEntityEditor value={dialogueByEntity} onChange={setDialogueByEntity} />
        <IntroDialogueEditor value={introDialogue} onChange={setIntroDialogue} />

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

        <div className="rounded-md bg-orange-50 px-4 py-3 text-sm text-orange-600">
          <strong>deliver_to</strong>：玩家將指定道具拖曳給 NPC。
        </div>
      </div>
    );
  }
);

export { DEFAULT_COMPLETE };
