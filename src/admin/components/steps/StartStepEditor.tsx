import { forwardRef, useImperativeHandle, useState } from 'react';
import type { QuestStep } from '../../../quests/data/questData';
import { EntitySelect } from '../EntitySelect';
import { StepCompleteEditor, DEFAULT_COMPLETE, parseOnStepComplete, buildOnStepComplete } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';
import { NpcOverrideEditor, recordToOverrideArray, arrayToOverrideRecord } from '../NpcOverrideEditor';
import type { NpcOverride } from '../NpcOverrideEditor';

type StartStep = Extract<QuestStep, { type: 'start' }>;

export interface StartStepEditorHandle {
  getStep: () => StartStep;
}

interface Props {
  initialStep?: StartStep;
}

export const StartStepEditor = forwardRef<StartStepEditorHandle, Props>(
  function StartStepEditor({ initialStep }, ref) {
    const [entityId, setEntityId] = useState(initialStep?.entityId ?? '');
    const [acceptText, setAcceptText] = useState(initialStep?.acceptText ?? '');
    const [onComplete, setOnComplete] = useState<StepCompleteState>(() =>
      parseOnStepComplete(initialStep?.onStepComplete)
    );
    const [npcOverrides, setNpcOverrides] = useState<NpcOverride[]>(() =>
      recordToOverrideArray(initialStep?.npcPositionOverrides)
    );

    useImperativeHandle(ref, () => ({
      getStep: () => {
        const stepComplete = buildOnStepComplete(onComplete);
        const overrides = arrayToOverrideRecord(npcOverrides);
        return {
          type: 'start',
          entityId,
          acceptText,
          ...(stepComplete !== undefined && { onStepComplete: stepComplete }),
          ...(overrides && { npcPositionOverrides: overrides }),
        };
      },
    }));

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            發放任務 NPC <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">entityId</span>
          </label>
          <EntitySelect value={entityId} onChange={setEntityId} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            承接台詞 <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">acceptText</span>
          </label>
          <textarea
            value={acceptText}
            onChange={(e) => setAcceptText(e.target.value)}
            rows={3}
            placeholder="例：幫我弄一杯茶吧。去採茶葉、湖邊用玻璃瓶裝水，合成成茶再拿來。"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">{acceptText.length} 字 ── 承接任務後對話框顯示的 NPC 台詞</p>
        </div>

        <StepCompleteEditor value={onComplete} onChange={setOnComplete} showAdvanced />

        <NpcOverrideCollapse value={npcOverrides} onChange={setNpcOverrides} />

        <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-600">
          <strong>start</strong>：任務的起始步驟。玩家點擊指定 NPC 時承接任務，必須是 steps[0]。
        </div>
      </div>
    );
  }
);

function NpcOverrideCollapse({ value, onChange }: { value: NpcOverride[]; onChange: (v: NpcOverride[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>
          此步驟 NPC 位置覆蓋（npcPositionOverrides）
          {value.length > 0 && (
            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">{value.length}</span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
          <NpcOverrideEditor value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export { DEFAULT_COMPLETE };
