import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MAP_OPTIONS } from '../adminConstants';
import { questTable } from '../../quests/data/questData';

function checkIdConflict(id: string): boolean {
  return id in questTable;
}

export function QuestNewPage() {
  const navigate = useNavigate();
  const [questId, setQuestId] = useState('');
  const [name, setName] = useState('');
  const [mapId, setMapId] = useState('');
  const [chainOrder, setChainOrder] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!questId.trim()) e.questId = '必填';
    else if (!/^QST-[a-z]+-\d{3,}$/.test(questId)) e.questId = '格式應為 QST-{類型}-{編號}，如 QST-main-012';
    else if (checkIdConflict(questId)) e.questId = '此 ID 已存在';
    if (!name.trim()) e.name = '必填';
    return e;
  };

  const handleCreate = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    // 純 UI，模擬建立後跳轉
    navigate(`/admin/quest/${questId}`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/admin" className="hover:text-gray-600">任務總覽</Link>
          <span>/</span>
          <span className="text-gray-600">新增任務</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">新增任務</h1>
        <p className="mt-1 text-sm text-gray-500">填寫基本資訊後建立，再到任務主設定填寫完整內容。</p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            任務 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={questId}
            onChange={(e) => { setQuestId(e.target.value); setErrors((prev) => ({ ...prev, questId: '' })); }}
            placeholder="QST-main-012"
            className={`w-full rounded-md border px-3 py-2 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 ${
              errors.questId ? 'border-red-400 focus:border-red-500 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {errors.questId ? (
            <p className="mt-1 text-xs text-red-500">{errors.questId}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">格式：QST-{'{類型}'}-{'{編號}'}，如 QST-main-012</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            任務名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
            placeholder="例：奇特的委托"
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              errors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">所屬地圖</label>
            <select
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">（未指定）</option>
              {MAP_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Chain 排序
              <span className="ml-1 font-normal text-gray-400 text-xs">chainOrder</span>
            </label>
            <input
              type="number"
              min={1}
              value={chainOrder}
              onChange={(e) => setChainOrder(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link
          to="/admin"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          取消
        </Link>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          建立任務
        </button>
      </div>
    </div>
  );
}
