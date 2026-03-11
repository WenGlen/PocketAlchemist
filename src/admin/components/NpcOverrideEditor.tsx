import { EntitySelect } from './EntitySelect';
import type { NpcPositionOverride } from '../../quests/data/questData';

export interface NpcOverride {
  npcId: string;
  x: number;
  y: number;
}

/** Record → 陣列（UI 編輯用，讀取時使用） */
export function recordToOverrideArray(
  record?: Record<string, NpcPositionOverride>
): NpcOverride[] {
  if (!record) return [];
  return Object.entries(record).map(([npcId, pos]) => ({ npcId, x: pos.x, y: pos.y }));
}

/** 陣列 → Record（儲存時使用） */
export function arrayToOverrideRecord(
  arr: NpcOverride[]
): Record<string, NpcPositionOverride> | undefined {
  const valid = arr.filter((o) => o.npcId.trim() !== '');
  if (valid.length === 0) return undefined;
  return Object.fromEntries(valid.map((o) => [o.npcId, { x: o.x, y: o.y }]));
}

interface Props {
  value: NpcOverride[];
  onChange: (v: NpcOverride[]) => void;
}

export function NpcOverrideEditor({ value, onChange }: Props) {
  const add = () => {
    onChange([...value, { npcId: '', x: 0, y: 0 }]);
  };

  const update = (idx: number, patch: Partial<NpcOverride>) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">

      {value.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
          尚未設定 NPC 位置覆蓋
        </div>
      )}

      {value.map((item, idx) => (
        <div key={idx} className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">覆蓋設定 #{idx + 1}</span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              title="刪除"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">NPC</label>
              <EntitySelect
                value={item.npcId}
                onChange={(v) => update(idx, { npcId: v })}
                placeholder="選擇 NPC"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">X 座標</label>
              <input
                type="number"
                value={item.x}
                onChange={(e) => update(idx, { x: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Y 座標</label>
              <input
                type="number"
                value={item.y}
                onChange={(e) => update(idx, { y: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-md border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
      >
        + 新增 NPC 位置覆蓋
      </button>

      <p className="text-xs text-gray-400">此步驟進行期間，指定 NPC 會臨時移動到新位置（覆蓋 objectsTable 的預設座標）。</p>
    </div>
  );
}
