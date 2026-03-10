import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuestStep } from '../../quests/data/questData';
import { STEP_TYPE_OPTIONS, getStepTypeStyle } from '../adminConstants';
import type { StepType } from '../adminConstants';
import { getNpcName, getItemName } from '../adminConstants';

// 新增步驟只允許中間類型
const MIDDLE_STEP_TYPES = STEP_TYPE_OPTIONS.filter(
  (o) => o.value !== 'start' && o.value !== 'complete',
);

function stepSummary(step: QuestStep): string {
  if (step.type === 'start') {
    const npc = getNpcName(step.entityId);
    return `${npc} — ${step.acceptText.slice(0, 40)}${step.acceptText.length > 40 ? '...' : ''}`;
  }
  if (step.type === 'complete') {
    return step.completeMessage
      ? step.completeMessage.slice(0, 50) + (step.completeMessage.length > 50 ? '...' : '')
      : '（無完成台詞）';
  }
  if ('itemId' in step && 'entityId' in step) {
    return `${getNpcName(step.entityId)} ／ ${getItemName(step.itemId)}`;
  }
  if ('entityId' in step) {
    return getNpcName(step.entityId);
  }
  return '';
}

interface Props {
  questId: string;
  initialSteps: QuestStep[];
}

export function StepsTabContent({ questId, initialSteps }: Props) {
  const [steps, setSteps] = useState<QuestStep[]>(initialSteps);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const startStep = steps[0]?.type === 'start' ? steps[0] : null;
  const completeStep = steps[steps.length - 1]?.type === 'complete' ? steps[steps.length - 1] : null;
  // 中間步驟：去掉頭尾鎖定的 start / complete
  const middleStart = startStep ? 1 : 0;
  const middleEnd = completeStep ? steps.length - 1 : steps.length;
  const middleCount = middleEnd - middleStart;

  // 只移動中間步驟
  const moveMiddle = (idx: number, dir: -1 | 1) => {
    const next = [...steps];
    const target = idx + dir;
    // 不能越過 start 或 complete 的位置
    if (target < middleStart || target >= middleEnd) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
  };

  const deleteStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
    setDeleteConfirm(null);
  };

  const addMiddleStep = (type: StepType) => {
    const newStep: QuestStep =
      type === 'receive_from'
        ? { type: 'receive_from', entityId: '', itemId: '' }
        : type === 'deliver_to'
          ? { type: 'deliver_to', entityId: '', itemId: '' }
          : { type: 'interact_with', entityId: '' };

    // 插入在 complete 之前（若有），否則插到最後
    const insertAt = completeStep ? steps.length - 1 : steps.length;
    const next = [...steps];
    next.splice(insertAt, 0, newStep);
    setSteps(next);
    setAddTypeOpen(false);
  };

  const isLocked = (idx: number) =>
    (idx === 0 && steps[0]?.type === 'start') ||
    (idx === steps.length - 1 && steps[idx]?.type === 'complete');

  return (
    <div className="space-y-3">
      {/* Meta */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          共 <span className="font-semibold text-gray-700">{steps.length}</span> 個步驟
          {middleCount > 0 && (
            <span className="ml-2 text-gray-400">（中間 {middleCount} 個可調整順序）</span>
          )}
        </p>
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const locked = isLocked(idx);
          const isMiddle = !locked;
          // ↑ 只有在不碰到 start 位置時可用
          const canMoveUp = isMiddle && idx > middleStart;
          // ↓ 只有在不碰到 complete 位置時可用
          const canMoveDown = isMiddle && idx < middleEnd - 1;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-lg border p-3.5 ${
                locked
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              {/* Index badge */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  locked ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {idx}
              </div>

              {/* Type badge + summary */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStepTypeStyle(step.type as StepType)}`}
                  >
                    {step.type}
                  </span>
                  {locked && (
                    <span className="text-xs text-gray-400" title="此步驟位置固定">🔒</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{stepSummary(step)}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {locked ? (
                  // 鎖定行：只有「編輯細節」按鈕
                  <Link
                    to={`/admin/quest/${questId}/step/${idx}`}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    編輯細節
                  </Link>
                ) : (
                  // 中間行：↑↓ + 編輯 + 刪除
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

                    <Link
                      to={`/admin/quest/${questId}/step/${idx}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      編輯細節
                    </Link>

                    {deleteConfirm === idx ? (
                      <div className="flex items-center gap-1">
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
                      </div>
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
              </div>
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
          {completeStep && (
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
