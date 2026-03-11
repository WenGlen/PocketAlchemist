import { useState } from 'react';
import { Link } from 'react-router-dom';
import { questList } from '../../quests/data/questList';
import { getAcceptModeStyle } from '../adminConstants';
import { CodePreviewModal } from '../components/CodePreviewModal';
import { useQuestTable } from '../hooks/useQuestTable';

function getMapName(questId: string): string {
  const entry = questList.find((q) => q.questId === questId);
  if (!entry) return '—';
  const MAP_NAMES: Record<string, string> = {
    'MAP-field-001': '野外初生地',
    'MAP-field-002': '幽林深處',
    'MAP-shimmer-001': '微光村斷崖',
  };
  return MAP_NAMES[entry.mapId] ?? entry.mapId;
}

export function QuestListPage() {
  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const { questTable, loading, error } = useQuestTable();

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

  const table = questTable ?? {};

  const quests = Object.values(table).filter(
    (q) =>
      q.id.includes(search) ||
      q.name.includes(search) ||
      (q.description ?? '').includes(search),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任務總覽</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {Object.keys(table).length} 個任務
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            匯出 questData.ts
          </button>
          <Link
            to="/admin/quest/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + 新增任務
          </Link>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋任務 ID、名稱或描述…"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">任務 ID</th>
              <th className="px-4 py-3">名稱</th>
              <th className="px-4 py-3">所屬地圖</th>
              <th className="px-4 py-3">步驟數</th>
              <th className="px-4 py-3">承接方式</th>
              <th className="px-4 py-3">前置任務</th>
              <th className="w-32 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quests.map((quest) => (
              <tr key={quest.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{quest.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{quest.name}</div>
                  {quest.description && (
                    <div className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                      {quest.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{getMapName(quest.id)}</td>
                <td className="px-4 py-3 text-center text-gray-600">{quest.steps.length}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getAcceptModeStyle(quest.acceptMode ?? 'auto')}`}
                  >
                    {quest.acceptMode ?? 'auto'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {quest.prerequisiteQuestId ?? '—'}
                </td>
                <td className="w-32 px-4 py-3 text-right">
                  <Link
                    to={`/admin/quest/${quest.id}`}
                    className="inline-block whitespace-nowrap rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    查看&amp;編輯
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {quests.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            沒有符合條件的任務
          </div>
        )}
      </div>

      <CodePreviewModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
