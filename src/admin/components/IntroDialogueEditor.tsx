import { useState } from 'react';
import { NPC_OPTIONS } from '../adminConstants';

export interface IntroLine {
  speaker: string;
  content: string;
}

interface Props {
  value: IntroLine[];
  onChange: (v: IntroLine[]) => void;
}

export function IntroDialogueEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const addLine = () => {
    onChange([...value, { speaker: 'player', content: '' }]);
  };

  const updateLine = (idx: number, field: keyof IntroLine, text: string) => {
    const next = value.map((l, i) => (i === idx ? { ...l, [field]: text } : l));
    onChange(next);
  };

  const removeLine = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveLine = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>
          銜接對話（introDialogue）
          {value.length > 0 && (
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              {value.length} 行
            </span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-gray-400">
            進入此步驟時，第一次開啟對話窗播放的來回對話。最後一行為第二次開啟時顯示的提示。
          </p>

          <div className="space-y-2">
            {value.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-md border bg-white p-2 ${
                  idx === value.length - 1 ? 'border-amber-300' : 'border-gray-200'
                }`}
              >
                <span className="mt-2 w-6 shrink-0 text-center text-xs font-mono text-gray-400">
                  {idx + 1}
                </span>

                <div className="flex flex-1 gap-2">
                  <select
                    value={line.speaker}
                    onChange={(e) => updateLine(idx, 'speaker', e.target.value)}
                    className="w-40 shrink-0 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="player">🧙 player（主角）</option>
                    {NPC_OPTIONS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.emoji} {n.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={line.content}
                    onChange={(e) => updateLine(idx, 'content', e.target.value)}
                    placeholder="台詞內容"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveLine(idx, -1)}
                    disabled={idx === 0}
                    className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLine(idx, 1)}
                    disabled={idx === value.length - 1}
                    className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>

                {idx === value.length - 1 && (
                  <div className="absolute -right-1 -top-1">
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                      最後一行
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {value.length > 0 && (
            <p className="text-xs text-amber-600">
              ⚠ 最後一行（第 {value.length} 行）為玩家第二次開啟對話時顯示的提示。
            </p>
          )}

          <button
            type="button"
            onClick={addLine}
            className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + 新增對話行
          </button>
        </div>
      )}
    </div>
  );
}
