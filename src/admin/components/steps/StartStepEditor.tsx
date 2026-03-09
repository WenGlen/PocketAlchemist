import { useState } from 'react';
import { EntitySelect } from '../EntitySelect';
import { StepCompleteEditor } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';

const DEFAULT_COMPLETE: StepCompleteState = { mode: 'close', dialogue: 'close', hideNpc: [], showNpc: [] };

export function StartStepEditor() {
  const [entityId, setEntityId] = useState('');
  const [acceptText, setAcceptText] = useState('');
  const [onComplete, setOnComplete] = useState<StepCompleteState>(DEFAULT_COMPLETE);

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <strong>start</strong>：任務的起始步驟。玩家點擊指定 NPC 時承接任務。必須是 steps[0]。
      </div>

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
          <span className="ml-1 font-normal text-gray-400 text-xs">acceptText — 承接任務後對話框顯示的 NPC 台詞</span>
        </label>
        <textarea
          value={acceptText}
          onChange={(e) => setAcceptText(e.target.value)}
          rows={3}
          placeholder="例：幫我弄一杯茶吧。去採茶葉、湖邊用玻璃瓶裝水，合成成茶再拿來。"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">{acceptText.length} 字</p>
      </div>

      <StepCompleteEditor value={onComplete} onChange={setOnComplete} showAdvanced />
    </div>
  );
}
