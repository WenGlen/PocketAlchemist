import { EntitySelect } from './EntitySelect';
import type { StepCompleteAction } from '../../quests/data/questData';

export type StepCompleteMode = 'close' | 'continue' | 'advanced';

export interface StepCompleteState {
  mode: StepCompleteMode;
  dialogue: 'close' | 'continue';
  hideNpc: string[];
  showNpc: string[];
}

export const DEFAULT_COMPLETE: StepCompleteState = {
  mode: 'close',
  dialogue: 'close',
  hideNpc: [],
  showNpc: [],
};

/** StepCompleteState → onStepComplete（儲存時使用） */
export function buildOnStepComplete(
  state: StepCompleteState
): 'close' | 'continue' | StepCompleteAction | undefined {
  if (state.mode === 'close') return undefined;
  if (state.mode === 'continue') return 'continue';
  // advanced
  const action: StepCompleteAction = {};
  if (state.dialogue !== 'close') action.dialogue = state.dialogue;
  if (state.hideNpc.length > 0) {
    action.hideNpc = state.hideNpc.length === 1 ? state.hideNpc[0] : state.hideNpc;
  }
  if (state.showNpc.length > 0) {
    action.showNpc = state.showNpc.length === 1 ? state.showNpc[0] : state.showNpc;
  }
  const isEmpty = !action.dialogue && !action.hideNpc && !action.showNpc;
  return isEmpty ? undefined : action;
}

/** onStepComplete → StepCompleteState（讀取時使用） */
export function parseOnStepComplete(
  value?: 'close' | 'continue' | StepCompleteAction
): StepCompleteState {
  if (!value || value === 'close') return DEFAULT_COMPLETE;
  if (value === 'continue') return { mode: 'continue', dialogue: 'continue', hideNpc: [], showNpc: [] };
  const hideNpc = value.hideNpc
    ? Array.isArray(value.hideNpc) ? value.hideNpc : [value.hideNpc]
    : [];
  const showNpc = value.showNpc
    ? Array.isArray(value.showNpc) ? value.showNpc : [value.showNpc]
    : [];
  const dialogue = value.dialogue ?? 'close';
  const hasAdvanced = hideNpc.length > 0 || showNpc.length > 0;
  return {
    mode: hasAdvanced ? 'advanced' : (dialogue === 'continue' ? 'continue' : 'close'),
    dialogue,
    hideNpc,
    showNpc,
  };
}

interface Props {
  value: StepCompleteState;
  onChange: (v: StepCompleteState) => void;
  showAdvanced?: boolean; // interact_with 和 start 才顯示進階設定
}

export function StepCompleteEditor({ value, onChange, showAdvanced = false }: Props) {
  const toggleNpc = (list: 'hideNpc' | 'showNpc', npcId: string) => {
    const current = value[list];
    const next = current.includes(npcId)
      ? current.filter((id) => id !== npcId)
      : [...current, npcId];
    onChange({ ...value, [list]: next });
  };

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        步驟完成後行為（onStepComplete）
      </label>

      <div className="flex flex-wrap gap-3">
        {(['close', 'continue', ...(showAdvanced ? ['advanced'] : [])] as StepCompleteMode[]).map((mode) => (
          <label key={mode} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="stepComplete"
              value={mode}
              checked={value.mode === mode}
              onChange={() =>
                onChange({
                  ...value,
                  mode,
                  dialogue: mode === 'continue' ? 'continue' : 'close',
                })
              }
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700">
              {mode === 'close' && '關閉對話框（預設）'}
              {mode === 'continue' && '保持對話框開啟'}
              {mode === 'advanced' && '進階設定'}
            </span>
          </label>
        ))}
      </div>

      {value.mode === 'advanced' && showAdvanced && (
        <div className="space-y-3 rounded-md border border-indigo-100 bg-indigo-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">對話框行為</label>
            <div className="flex gap-4">
              {(['close', 'continue'] as const).map((d) => (
                <label key={d} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    value={d}
                    checked={value.dialogue === d}
                    onChange={() => onChange({ ...value, dialogue: d })}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">
                    {d === 'close' ? '關閉' : '保持開啟'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              步驟完成後隱藏 NPC
              <span className="ml-1 font-normal text-gray-400">（hideNpc）</span>
            </label>
            <EntitySelect
              value=""
              onChange={(id) => id && toggleNpc('hideNpc', id)}
              placeholder="點選新增要隱藏的 NPC"
            />
            {value.hideNpc.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {value.hideNpc.map((id) => (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => toggleNpc('hideNpc', id)}
                      className="ml-0.5 hover:text-red-900"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              步驟完成後顯示 NPC
              <span className="ml-1 font-normal text-gray-400">（showNpc）</span>
            </label>
            <EntitySelect
              value=""
              onChange={(id) => id && toggleNpc('showNpc', id)}
              placeholder="點選新增要顯示的 NPC"
            />
            {value.showNpc.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {value.showNpc.map((id) => (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => toggleNpc('showNpc', id)}
                      className="ml-0.5 hover:text-green-900"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
