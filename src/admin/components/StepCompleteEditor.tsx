import { EntitySelect } from './EntitySelect';

export type StepCompleteMode = 'close' | 'continue' | 'advanced';

export interface StepCompleteState {
  mode: StepCompleteMode;
  dialogue: 'close' | 'continue';
  hideNpc: string[];
  showNpc: string[];
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
