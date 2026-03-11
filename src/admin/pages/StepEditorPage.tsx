import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { QuestStep } from '../../quests/data/questData';
import { saveQuestToSheet } from '../../core/config/dataSource';
import { useQuestTable } from '../hooks/useQuestTable';
import { getStepTypeStyle } from '../adminConstants';
import type { StepType } from '../adminConstants';
import { StartStepEditor } from '../components/steps/StartStepEditor';
import type { StartStepEditorHandle } from '../components/steps/StartStepEditor';
import { ReceiveFromStepEditor } from '../components/steps/ReceiveFromStepEditor';
import type { ReceiveFromStepEditorHandle } from '../components/steps/ReceiveFromStepEditor';
import { DeliverToStepEditor } from '../components/steps/DeliverToStepEditor';
import type { DeliverToStepEditorHandle } from '../components/steps/DeliverToStepEditor';
import { InteractWithStepEditor } from '../components/steps/InteractWithStepEditor';
import type { InteractWithStepEditorHandle } from '../components/steps/InteractWithStepEditor';
import { CompleteStepEditor } from '../components/steps/CompleteStepEditor';
import type { CompleteStepEditorHandle } from '../components/steps/CompleteStepEditor';

// 統一的 editor handle 型別
type AnyStepEditorHandle =
  | StartStepEditorHandle
  | ReceiveFromStepEditorHandle
  | DeliverToStepEditorHandle
  | InteractWithStepEditorHandle
  | CompleteStepEditorHandle;

export function StepEditorPage() {
  const { questId, idx } = useParams<{ questId: string; idx: string }>();
  const { questTable, loading, error } = useQuestTable();
  const quest = questId && questTable ? questTable[questId] : undefined;
  const stepIndex = idx !== undefined ? Number(idx) : -1;
  const step = quest?.steps?.[stepIndex];

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const editorRef = useRef<AnyStepEditorHandle>(null);

  const handleSave = async () => {
    if (!editorRef.current || !quest) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const newStep = editorRef.current.getStep();
      const updatedSteps = quest.steps.map((s, i) =>
        i === stepIndex ? newStep : s
      );
      const updatedQuest = { ...quest, steps: updatedSteps };
      await saveQuestToSheet(updatedQuest);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-400">
        載入任務資料中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-red-500">載入失敗：{error}</p>
      </div>
    );
  }

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
          <Link to={`/admin/quest/${quest.id}`} className="hover:text-gray-600">步驟管理</Link>
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
              <Link to={`/admin/quest/${quest.id}/step/${prevIdx}`} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                ← 上一步
              </Link>
            )}
            {nextIdx !== null && (
              <Link to={`/admin/quest/${quest.id}/step/${nextIdx}`} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                下一步 →
              </Link>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存到 Sheet'}
            </button>
          </div>
        </div>

        {/* 儲存錯誤提示 */}
        {saveError && (
          <div className="mt-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            ✕ {saveError}
          </div>
        )}
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
        {stepType === 'start' && (
          <StartStepEditor
            key={stepIndex}
            ref={editorRef as React.Ref<StartStepEditorHandle>}
            initialStep={step as Extract<QuestStep, { type: 'start' }>}
          />
        )}
        {stepType === 'receive_from' && (
          <ReceiveFromStepEditor
            key={stepIndex}
            ref={editorRef as React.Ref<ReceiveFromStepEditorHandle>}
            initialStep={step as Extract<QuestStep, { type: 'receive_from' }>}
          />
        )}
        {stepType === 'deliver_to' && (
          <DeliverToStepEditor
            key={stepIndex}
            ref={editorRef as React.Ref<DeliverToStepEditorHandle>}
            initialStep={step as Extract<QuestStep, { type: 'deliver_to' }>}
          />
        )}
        {stepType === 'interact_with' && (
          <InteractWithStepEditor
            key={stepIndex}
            ref={editorRef as React.Ref<InteractWithStepEditorHandle>}
            initialStep={step as Extract<QuestStep, { type: 'interact_with' }>}
          />
        )}
        {stepType === 'complete' && (
          <CompleteStepEditor
            key={stepIndex}
            ref={editorRef as React.Ref<CompleteStepEditorHandle>}
            initialStep={step as Extract<QuestStep, { type: 'complete' }>}
          />
        )}
      </div>
    </div>
  );
}
