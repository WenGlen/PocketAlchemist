import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { QuestStep } from '../../quests/data/questData';
import { STEP_TYPE_OPTIONS, getStepTypeStyle, getNpcName, getItemName } from '../adminConstants';
import type { StepType } from '../adminConstants';
import { StartStepEditor } from './steps/StartStepEditor';
import type { StartStepEditorHandle } from './steps/StartStepEditor';
import { TalkToStepEditor } from './steps/TalkToStepEditor';
import type { TalkToStepEditorHandle } from './steps/TalkToStepEditor';
import { ReceiveFromStepEditor } from './steps/ReceiveFromStepEditor';
import type { ReceiveFromStepEditorHandle } from './steps/ReceiveFromStepEditor';
import { DeliverToStepEditor } from './steps/DeliverToStepEditor';
import type { DeliverToStepEditorHandle } from './steps/DeliverToStepEditor';
import { InteractWithStepEditor } from './steps/InteractWithStepEditor';
import type { InteractWithStepEditorHandle } from './steps/InteractWithStepEditor';
import { CompleteStepEditor } from './steps/CompleteStepEditor';
import type { CompleteStepEditorHandle } from './steps/CompleteStepEditor';

type AnyEditorHandle = { getStep: () => QuestStep };


const MIDDLE_STEP_TYPES = STEP_TYPE_OPTIONS.filter(
  (o) => o.value !== 'start' && o.value !== 'complete',
);

function stepSummary(step: QuestStep): string {
  if (step.type === 'start') {
    const npc = getNpcName(step.entityId ?? '');
    const text = step.acceptText;
    return `${npc} — ${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`;
  }
  if (step.type === 'complete') {
    return step.completeMessage
      ? step.completeMessage.slice(0, 50) + (step.completeMessage.length > 50 ? '…' : '')
      : '（無完成台詞）';
  }
  if ('itemId' in step && 'entityId' in step) {
    return `${getNpcName(step.entityId ?? '')} ／ ${getItemName(step.itemId)}`;
  }
  if ('entityId' in step) return getNpcName((step as { entityId?: string }).entityId ?? '');
  return '';
}

export interface StepsTabContentHandle {
  getSteps: () => QuestStep[];
}

interface Props {
  initialSteps: QuestStep[];
}

export const StepsTabContent = forwardRef<StepsTabContentHandle, Props>(
  function StepsTabContent({ initialSteps }, ref) {
    const [steps, setSteps] = useState<QuestStep[]>(initialSteps);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [addTypeOpen, setAddTypeOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const editorRefs = useRef<(AnyEditorHandle | null)[]>([]);

    // 從 editor ref 讀取最新狀態並存回 steps
    const captureAndPersist = (idx: number) => {
      const editorRef = editorRefs.current[idx];
      if (!editorRef) return;
      const captured = editorRef.getStep();
      setSteps((prev) => prev.map((s, i) => (i === idx ? captured : s)));
    };

    const toggleExpand = (idx: number) => {
      if (expandedIdx === idx) {
        captureAndPersist(idx);
        setExpandedIdx(null);
      } else {
        if (expandedIdx !== null) captureAndPersist(expandedIdx);
        setExpandedIdx(idx);
      }
    };

    useImperativeHandle(ref, () => ({
      getSteps: () => {
        const result = [...steps];
        if (expandedIdx !== null) {
          const editorRef = editorRefs.current[expandedIdx];
          if (editorRef) result[expandedIdx] = editorRef.getStep();
        }
        return result;
      },
    }));

    const isLocked = (idx: number) =>
      (idx === 0 && steps[0]?.type === 'start') ||
      (idx === steps.length - 1 && steps[idx]?.type === 'complete');

    const middleStart = steps[0]?.type === 'start' ? 1 : 0;
    const middleEnd =
      steps[steps.length - 1]?.type === 'complete' ? steps.length - 1 : steps.length;

    const moveMiddle = (idx: number, dir: -1 | 1) => {
      // 移動前先 collapse 並 capture，避免 remount 後資料不一致
      if (expandedIdx !== null) {
        captureAndPersist(expandedIdx);
        setExpandedIdx(null);
      }
      const next = [...steps];
      const target = idx + dir;
      if (target < middleStart || target >= middleEnd) return;
      [next[idx], next[target]] = [next[target], next[idx]];
      setSteps(next);
    };

    const deleteStep = (idx: number) => {
      if (expandedIdx === idx) setExpandedIdx(null);
      else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
      setSteps(steps.filter((_, i) => i !== idx));
      setDeleteConfirm(null);
    };

    const addMiddleStep = (type: StepType) => {
      if (expandedIdx !== null) captureAndPersist(expandedIdx);
      const newStep: QuestStep =
        type === 'talk_to'
          ? { type: 'talk_to', entityId: '', lines: [] }
          : type === 'receive_from'
            ? { type: 'receive_from', entityId: '', itemId: '' }
            : type === 'deliver_to'
              ? { type: 'deliver_to', entityId: '', itemId: '' }
              : { type: 'interact_with', entityId: '' };
      const insertAt =
        steps[steps.length - 1]?.type === 'complete' ? steps.length - 1 : steps.length;
      const next = [...steps];
      next.splice(insertAt, 0, newStep);
      setSteps(next);
      setAddTypeOpen(false);
      setExpandedIdx(insertAt);
    };

    const makeEditorRef =
      (idx: number): React.RefCallback<AnyEditorHandle> =>
      (el) => {
        editorRefs.current[idx] = el;
      };

    const renderEditor = (step: QuestStep, idx: number) => {
      switch (step.type) {
        case 'start':
          return (
            <StartStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<StartStepEditorHandle>}
              initialStep={step}
            />
          );
        case 'talk_to':
          return (
            <TalkToStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<TalkToStepEditorHandle>}
              initialStep={step}
            />
          );
        case 'receive_from':
          return (
            <ReceiveFromStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<ReceiveFromStepEditorHandle>}
              initialStep={step}
            />
          );
        case 'deliver_to':
          return (
            <DeliverToStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<DeliverToStepEditorHandle>}
              initialStep={step}
            />
          );
        case 'interact_with':
          return (
            <InteractWithStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<InteractWithStepEditorHandle>}
              initialStep={step}
            />
          );
        case 'complete':
          return (
            <CompleteStepEditor
              key={idx}
              ref={makeEditorRef(idx) as React.Ref<CompleteStepEditorHandle>}
              initialStep={step}
            />
          );
      }
    };

    return (
      <div className="space-y-3">
        {/* Meta */}
        <p className="text-sm text-gray-500">
          共 <span className="font-semibold text-gray-700">{steps.length}</span> 個步驟
        </p>

        {/* Accordion steps */}
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const locked = isLocked(idx);
            const isMiddle = !locked;
            const canMoveUp = isMiddle && idx > middleStart;
            const canMoveDown = isMiddle && idx < middleEnd - 1;
            const expanded = expandedIdx === idx;

            return (
              <div
                key={idx}
                className={`rounded-lg border transition-colors ${
                  expanded
                    ? 'border-indigo-200 bg-white shadow-sm'
                    : locked
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-white'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 px-3.5 py-3">
                  {/* Index badge */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      locked ? 'bg-gray-200 text-gray-400' : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {idx}
                  </div>

                  {/* Type + summary */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStepTypeStyle(step.type as StepType)}`}
                      >
                        {step.type}
                      </span>
                      {locked && (
                        <span className="text-xs text-gray-400" title="位置固定">🔒</span>
                      )}
                    </div>
                    {!expanded && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{stepSummary(step)}</p>
                    )}
                  </div>

                  {/* Right controls */}
                  <div className="flex shrink-0 items-center gap-1">
                    {isMiddle && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveMiddle(idx, -1)}
                          disabled={!canMoveUp}
                          title="上移"
                          className="rounded p-1.5 text-sm text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-25"
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => moveMiddle(idx, 1)}
                          disabled={!canMoveDown}
                          title="下移"
                          className="rounded p-1.5 text-sm text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-25"
                        >↓</button>

                        {deleteConfirm === idx ? (
                          <>
                            <button
                              type="button"
                              onClick={() => deleteStep(idx)}
                              className="rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                            >
                              確認刪除
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(idx)}
                            title="刪除步驟"
                            className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            🗑
                          </button>
                        )}
                      </>
                    )}

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        expanded
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {expanded ? '▲ 收起' : '▼ 展開'}
                    </button>
                  </div>
                </div>

                {/* Inline editor */}
                {expanded && (
                  <div className="border-t border-indigo-100 px-4 pb-5 pt-4">
                    {renderEditor(step, idx)}
                  </div>
                )}
              </div>
            );
          })}

          {steps.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              尚無步驟
            </div>
          )}
        </div>

        {/* Add middle step */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddTypeOpen((o) => !o)}
            className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + 新增中間步驟
            {steps[steps.length - 1]?.type === 'complete' && (
              <span className="ml-1.5 text-xs text-gray-400">（插入於 complete 前）</span>
            )}
          </button>

          {addTypeOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              <p className="mb-2 px-2 text-xs font-medium text-gray-500">選擇步驟類型</p>
              <div className="grid grid-cols-3 gap-1.5">
                {MIDDLE_STEP_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => addMiddleStep(opt.value as StepType)}
                    className="flex flex-col items-start rounded-md border border-gray-100 p-2.5 text-left hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>
                      {opt.label}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 px-2 text-xs text-gray-400">
                start 固定在第 0 位，complete 固定在最後，不可手動新增。
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
