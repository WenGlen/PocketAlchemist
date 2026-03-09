import { useState } from 'react';
import { missionList } from '../../quests/data/missionList';
import type { MissionEntry } from '../../quests/data/missionList';
import { questTable } from '../../quests/data/questData';
import { MAP_OPTIONS, getAcceptModeStyle } from '../adminConstants';
import { Link } from 'react-router-dom';

export function MapsPage() {
  const [entries, setEntries] = useState<MissionEntry[]>([...missionList]);
  const [addMapId, setAddMapId] = useState('');
  const [addQuestId, setAddQuestId] = useState('');
  const [addChainOrder, setAddChainOrder] = useState(1);
  const [saved, setSaved] = useState(false);

  const mapIds = [...new Set(entries.map((e) => e.mapId))];

  const moveEntry = (idx: number, dir: -1 | 1) => {
    const next = [...entries];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setEntries(next);
  };

  const removeEntry = (questId: string) => {
    setEntries(entries.filter((e) => e.questId !== questId));
  };

  const updateChainOrder = (questId: string, val: number) => {
    setEntries(entries.map((e) => e.questId === questId ? { ...e, chainOrder: val } : e));
  };

  const addEntry = () => {
    if (!addMapId || !addQuestId) return;
    if (entries.some((e) => e.questId === addQuestId)) return;
    const quest = questTable[addQuestId];
    setEntries([...entries, {
      mapId: addMapId,
      questId: addQuestId,
      name: quest?.name ?? addQuestId,
      chainOrder: addChainOrder,
    }]);
    setAddQuestId('');
    setAddChainOrder(1);
  };

  const allQuestIds = Object.keys(questTable);
  const usedQuestIds = new Set(entries.map((e) => e.questId));
  const availableQuests = allQuestIds.filter((id) => !usedQuestIds.has(id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">地圖任務綁定</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理 missionList.ts — 定義每個地圖包含哪些任務及其推進順序
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {saved ? '✓ 已儲存' : '儲存'}
        </button>
      </div>

      {/* Per-map sections */}
      {MAP_OPTIONS.map((map) => {
        const mapEntries = entries
          .filter((e) => e.mapId === map.id)
          .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

        return (
          <div key={map.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">{map.name}</h2>
                <code className="text-xs text-gray-400">{map.id}</code>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-600">
                {mapEntries.length} 個任務
              </span>
            </div>

            {mapEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">此地圖尚無任務綁定</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {mapEntries.map((entry, entryIdx) => {
                  const quest = questTable[entry.questId];
                  const globalIdx = entries.findIndex((e) => e.questId === entry.questId);
                  return (
                    <div key={entry.questId} className="flex items-center gap-3 px-5 py-3">
                      {/* Chain order */}
                      <div className="w-16 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={entry.chainOrder ?? entryIdx + 1}
                          onChange={(e) => updateChainOrder(entry.questId, Number(e.target.value))}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-center text-sm font-medium text-gray-700 focus:border-indigo-400 focus:outline-none"
                          title="chainOrder"
                        />
                      </div>

                      {/* Quest info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{entry.name}</span>
                          {quest?.acceptMode && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getAcceptModeStyle(quest.acceptMode)}`}>
                              {quest.acceptMode}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <code className="text-xs text-gray-400">{entry.questId}</code>
                          {quest?.prerequisiteQuestId && (
                            <span className="text-xs text-gray-400">
                              前置：{quest.prerequisiteQuestId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveEntry(globalIdx, -1)}
                          disabled={entryIdx === 0}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="上移"
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => moveEntry(globalIdx, 1)}
                          disabled={entryIdx === mapEntries.length - 1}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="下移"
                        >↓</button>
                        <Link
                          to={`/admin/quest/${entry.questId}`}
                          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          編輯任務
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.questId)}
                          className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="移除綁定"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Unbound maps */}
      {mapIds.filter((id) => !MAP_OPTIONS.some((m) => m.id === id)).map((mapId) => (
        <div key={mapId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700">{mapId}</h2>
          <p className="text-xs text-amber-600">⚠ 此地圖 ID 不在 MAP_OPTIONS 中</p>
        </div>
      ))}

      {/* Add new binding */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">新增地圖任務綁定</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">地圖</label>
            <select
              value={addMapId}
              onChange={(e) => setAddMapId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">請選擇</option>
              {MAP_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">任務</label>
            <select
              value={addQuestId}
              onChange={(e) => setAddQuestId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">請選擇未綁定的任務</option>
              {availableQuests.map((id) => (
                <option key={id} value={id}>{id} — {questTable[id]?.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">chainOrder</label>
            <input
              type="number"
              min={1}
              value={addChainOrder}
              onChange={(e) => setAddChainOrder(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addEntry}
          disabled={!addMapId || !addQuestId}
          className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          新增綁定
        </button>
      </div>
    </div>
  );
}
