import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questTable } from '../../quests/data/questData';
import type { QuestStep } from '../../quests/data/questData';
import { STEP_TYPE_OPTIONS, getStepTypeStyle } from '../adminConstants';
import type { StepType } from '../adminConstants';

function stepSummary(step: QuestStep): string {
  if (step.type === 'start') return `NPC: ${step.entityId} — ${step.acceptText.slice(0, 30)}...`;
  if (step.type === 'complete') return step.completeMessage ? step.completeMessage.slice(0, 40) + '...' : '（無完成台詞）';
  if ('entityId' in step && 'itemId' in step) return `NPC: ${step.entityId}  道具: ${step.itemId}`;
  if ('entityId' in step) return `NPC: ${step.entityId}`;
  return '';
}

export function StepsPage() {
  const { questId } = useParams<{ questId: string }>();
  const quest = questId ? questTable[questId] : undefined;

  const [steps, setSteps] = useState<QuestStep[]>(quest?.steps ?? []);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-gray-500">找不到任務：{questId}</p>
        <Link to="/admin" className="mt-4 text-sm text-indigo-600 hover:underline">回到任務總覽</Link>
      </div>
    );
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    const next = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
  };

  const deleteStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
    setDeleteConfirm(null);
  };

  const addStep = (type: StepType) => {
    const newStep: QuestStep =
      type === 'start'
        ? { type: 'start', entityId: '', acceptText: '' }
        : type === 'receive_from'
          ? { type: 'receive_from', entityId: '', itemId: '' }
          : type === 'deliver_to'
            ? { type: 'deliver_to', entityId: '', itemId: '' }
            : type === 'interact_with'
              ? { type: 'interact_with', entityId: '' }
              : { type: 'complete' };
    setSteps([...steps, newStep]);
    setAddTypeOpen(false);
  };

  const hasWarnings = (): string[] => {
    const warnings: string[] = [];
    if (steps.length === 0) return ['步驟陣列為空'];
    if (steps[0].type !== 'start') warnings.push('steps[0] 應為 start 類型');
    if (steps[steps.length - 1].type !== 'complete') warnings.push('steps 最後一項建議為 complete 類型');
    const midStarts = steps.slice(1).filter((s) => s.type === 'start');
    if (midStarts.length) warnings.push('中間出現了 start 類型步驟（應只在 index 0）');
    const midCompletes = steps.slice(0, -1).filter((s) => s.type === 'complete');
    if (midCompletes.length) warnings.push('中間出現了 complete 類型步驟（應只在最後）');
    return warnings;
  };

  const warnings = hasWarnings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/admin" className="hover:text-gray-600">任務總覽</Link>
          <span>/</span>
          <Link to={`/admin/quest/${quest.id}`} className="hover:text-gray-600">{quest.id}</Link>
          <span>/</span>
          <span className="text-gray-600">步驟管理</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">步驟管理</h1>
            <p className="mt-1 text-sm text-gray-500">{quest.name} — 共 {steps.length} 個步驟</p>
          </div>
          <button
            type="button"
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {saved ? '✓ 已儲存' : '儲存'}
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700 mb-1">步驟結構警告</p>
          <ul className="space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-red-600">⚠ {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm ${
              step.type === 'start'
                ? 'border-blue-200'
                : step.type === 'complete'
                  ? 'border-gray-200'
                  : 'border-gray-200'
            }`}
          >
            {/* Index */}
            <div className="flex w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 py-1 text-sm font-bold text-gray-500">
              {idx}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStepTypeStyle(step.type as StepType)}`}
                >
                  {step.type}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">{stepSummary(step)}</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => moveStep(idx, -1)}
                disabled={idx === 0}
                title="上移"
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveStep(idx, 1)}
                disabled={idx === steps.length - 1}
                title="下移"
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              >
                ↓
              </button>
              <Link
                to={`/admin/quest/${quest.id}/step/${idx}`}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                編輯
              </Link>
              {deleteConfirm === idx ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => deleteStep(idx)}
                    className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                  >
                    確認刪除
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
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
            </div>
          </div>
        ))}

        {steps.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            尚無步驟，點擊下方按鈕新增
          </div>
        )}
      </div>

      {/* Add step */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setAddTypeOpen((o) => !o)}
          className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          + 新增步驟
        </button>

        {addTypeOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <p className="mb-2 px-2 text-xs font-medium text-gray-500">選擇步驟類型</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {STEP_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => addStep(opt.value as StepType)}
                  className="flex flex-col items-start rounded-md border border-gray-100 p-2.5 text-left hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>
                    {opt.label}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
