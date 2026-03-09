import { Link, useParams } from 'react-router-dom';
import { questTable } from '../../quests/data/questData';
import { getStepTypeStyle } from '../adminConstants';
import type { StepType } from '../adminConstants';
import { StartStepEditor } from '../components/steps/StartStepEditor';
import { ReceiveFromStepEditor } from '../components/steps/ReceiveFromStepEditor';
import { DeliverToStepEditor } from '../components/steps/DeliverToStepEditor';
import { InteractWithStepEditor } from '../components/steps/InteractWithStepEditor';
import { CompleteStepEditor } from '../components/steps/CompleteStepEditor';

export function StepEditorPage() {
  const { questId, idx } = useParams<{ questId: string; idx: string }>();
  const quest = questId ? questTable[questId] : undefined;
  const stepIndex = idx !== undefined ? Number(idx) : -1;
  const step = quest?.steps?.[stepIndex];

  if (!quest || !step || stepIndex < 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-gray-500">找不到步驟</p>
        {questId && (
          <Link to={`/admin/quest/${questId}/steps`} className="mt-4 text-sm text-indigo-600 hover:underline">
            回到步驟管理
          </Link>
        )}
      </div>
    );
  }

  const stepType = step.type as StepType;

  const prevIdx = stepIndex > 0 ? stepIndex - 1 : null;
  const nextIdx = stepIndex < quest.steps.length - 1 ? stepIndex + 1 : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link to="/admin" className="hover:text-gray-600">任務總覽</Link>
          <span>/</span>
          <Link to={`/admin/quest/${quest.id}`} className="hover:text-gray-600">{quest.id}</Link>
          <span>/</span>
          <Link to={`/admin/quest/${quest.id}/steps`} className="hover:text-gray-600">步驟管理</Link>
          <span>/</span>
          <span className="text-gray-600">步驟 #{stepIndex}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">步驟 #{stepIndex}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStepTypeStyle(stepType)}`}>
                {stepType}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{quest.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {prevIdx !== null && (
              <Link
                to={`/admin/quest/${quest.id}/step/${prevIdx}`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← 上一步
              </Link>
            )}
            {nextIdx !== null && (
              <Link
                to={`/admin/quest/${quest.id}/step/${nextIdx}`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                下一步 →
              </Link>
            )}
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              儲存
            </button>
          </div>
        </div>
      </div>

      {/* Step nav pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {quest.steps.map((s, i) => (
          <Link
            key={i}
            to={`/admin/quest/${quest.id}/step/${i}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              i === stepIndex
                ? getStepTypeStyle(s.type as StepType) + ' border-current'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <span className="text-gray-400">#{i}</span>
            <span>{s.type}</span>
          </Link>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {stepType === 'start' && <StartStepEditor />}
        {stepType === 'receive_from' && <ReceiveFromStepEditor />}
        {stepType === 'deliver_to' && <DeliverToStepEditor />}
        {stepType === 'interact_with' && <InteractWithStepEditor />}
        {stepType === 'complete' && <CompleteStepEditor />}
      </div>
    </div>
  );
}
