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
  showAdvanced?: boolean; // interact_with 才顯示進階設定（含對話框行為）
  /**
   * npcOnly 模式：給 start / talk_to / complete 使用
   * 這些步驟的對話框行為由系統固定控制，此處只顯示 hideNpc / showNpc 副作用設定
   */
  npcOnly?: boolean;
}

export function StepCompleteEditor({ value, onChange, showAdvanced = false, npcOnly = false }: Props) {
  const toggleNpc = (list: 'hideNpc' | 'showNpc', npcId: string) => {
    const current = value[list];
    const next = current.includes(npcId)
      ? current.filter((id) => id !== npcId)
      : [...current, npcId];
    onChange({ ...value, mode: 'advanced', [list]: next });
  };

  // npcOnly 模式：直接顯示 hideNpc / showNpc 控制，不顯示對話框模式選項
  if (npcOnly) {
    return (
      <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          步驟完成後 NPC 變化（onStepComplete）
        </label>
        <NpcToggleSection label="隱藏 NPC" field="hideNpc" colorClass="red" value={value} toggleNpc={toggleNpc} />
        <NpcToggleSection label="顯示 NPC" field="showNpc" colorClass="green" value={value} toggleNpc={toggleNpc} />
      </div>
    );
  }

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
          <NpcToggleSection label="隱藏 NPC" field="hideNpc" colorClass="red" value={value} toggleNpc={toggleNpc} />
          <NpcToggleSection label="顯示 NPC" field="showNpc" colorClass="green" value={value} toggleNpc={toggleNpc} />
        </div>
      )}
    </div>
  );
}

// ── 共用子元件：NPC 隱藏/顯示切換 ──────────────────────────────────────────

interface NpcToggleSectionProps {
  label: string;
  field: 'hideNpc' | 'showNpc';
  colorClass: 'red' | 'green';
  value: StepCompleteState;
  toggleNpc: (field: 'hideNpc' | 'showNpc', id: string) => void;
}

function NpcToggleSection({ label, field, colorClass, value, toggleNpc }: NpcToggleSectionProps) {
  const tagBg = colorClass === 'red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  const fieldName = field === 'hideNpc' ? 'hideNpc' : 'showNpc';
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        <span className="ml-1 font-normal text-gray-400">（{fieldName}）</span>
      </label>
      <EntitySelect
        value=""
        onChange={(id) => id && toggleNpc(field, id)}
        placeholder={`點選新增要${label.replace(' NPC', '')}的 NPC`}
      />
      {value[field].length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {value[field].map((id) => (
            <span key={id} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${tagBg}`}>
              {id}
              <button type="button" onClick={() => toggleNpc(field, id)} className="ml-0.5 hover:opacity-70">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
