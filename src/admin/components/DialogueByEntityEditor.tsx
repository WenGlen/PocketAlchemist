import { useState } from 'react';
import { EntitySelect } from './EntitySelect';
import { getNpcName } from '../adminConstants';

export type DialogueByEntity = Record<string, string[]>;

interface Props {
  value: DialogueByEntity;
  onChange: (v: DialogueByEntity) => void;
}

export function DialogueByEntityEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const entryCount = Object.keys(value).length;

  const addEntry = () => {
    onChange({ ...value, '': [''] });
  };

  const updateKey = (oldKey: string, newKey: string) => {
    const entries = Object.entries(value).map(([k, v]) =>
      k === oldKey ? [newKey, v] : [k, v],
    );
    onChange(Object.fromEntries(entries));
  };

  const updateLines = (key: string, lines: string[]) => {
    onChange({ ...value, [key]: lines });
  };

  const removeEntry = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const addLine = (key: string) => {
    onChange({ ...value, [key]: [...(value[key] ?? []), ''] });
  };

  const updateLine = (key: string, idx: number, text: string) => {
    const lines = [...(value[key] ?? [])];
    lines[idx] = text;
    updateLines(key, lines);
  };

  const removeLine = (key: string, idx: number) => {
    const lines = [...(value[key] ?? [])];
    lines.splice(idx, 1);
    updateLines(key, lines.length ? lines : ['']);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>
          其他 NPC 旁白（dialogueByEntity）
          {entryCount > 0 && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {entryCount} 個 NPC
            </span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-gray-400">
            在此步驟中，玩家與非目標 NPC 對話時顯示的台詞。
          </p>

          {Object.entries(value).map(([npcId, lines], entryIdx) => (
            <div key={entryIdx} className="rounded-md border border-gray-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">NPC</label>
                  <EntitySelect
                    value={npcId}
                    onChange={(newId) => updateKey(npcId, newId)}
                    placeholder="請選擇 NPC"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(npcId)}
                  className="mt-5 rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                  title="刪除此 NPC 旁白"
                >
                  ✕
                </button>
              </div>

              {npcId && (
                <div className="ml-1 text-xs text-gray-400">
                  與 {getNpcName(npcId)} 對話時顯示：
                </div>
              )}

              <div className="space-y-1.5">
                {lines.map((line, lineIdx) => (
                  <div key={lineIdx} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-xs text-gray-400">
                      {lineIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => updateLine(npcId, lineIdx, e.target.value)}
                      placeholder="台詞內容"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(npcId, lineIdx)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="刪除此行"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addLine(npcId)}
                className="text-xs text-indigo-600 hover:underline"
              >
                + 新增行
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + 新增 NPC 旁白
          </button>
        </div>
      )}
    </div>
  );
}
