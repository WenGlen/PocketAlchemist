import { forwardRef, useImperativeHandle, useState } from 'react';
import type { QuestStep } from '../../../quests/data/questData';

type CompleteStep = Extract<QuestStep, { type: 'complete' }>;

export interface CompleteStepEditorHandle {
  getStep: () => CompleteStep;
}

interface Props {
  initialStep?: CompleteStep;
}

export const CompleteStepEditor = forwardRef<CompleteStepEditorHandle, Props>(
  function CompleteStepEditor({ initialStep }, ref) {
    const [completeMessage, setCompleteMessage] = useState(initialStep?.completeMessage ?? '');

    useImperativeHandle(ref, () => ({
      getStep: () => ({
        type: 'complete',
        ...(completeMessage && { completeMessage }),
      }),
    }));

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            任務完成台詞
            <span className="ml-1 font-normal text-gray-400 text-xs">completeMessage</span>
          </label>
          <textarea
            value={completeMessage}
            onChange={(e) => setCompleteMessage(e.target.value)}
            rows={3}
            placeholder="例：你的茶不太好喝啊...但還是謝謝你的茶。"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">{completeMessage.length} 字 ── 顯示於完成彈窗的 NPC 結語</p>
        </div>

        <div className="rounded-md border border-green-100 bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700 mb-2">此步驟完成後自動觸發：</p>
          <ul className="space-y-1 text-xs text-green-700">
            <li className="flex items-center gap-1.5"><span>✓</span> questPhase 變為 'completed'</li>
            <li className="flex items-center gap-1.5"><span>✓</span> 播放成功音效</li>
            <li className="flex items-center gap-1.5"><span>✓</span> 顯示任務完成彈窗</li>
            <li className="flex items-center gap-1.5"><span>✓</span> 記錄到 completedQuestIds（localStorage）</li>
          </ul>
        </div>

        <div className="rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-500">
          <strong>complete</strong>：任務的結束步驟，必須是 steps 的最後一個。
        </div>
      </div>
    );
  }
);
