import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questTable } from '../../quests/data/questData';
import { questList } from '../../quests/data/questList';
import { ACCEPT_MODE_OPTIONS, MAP_OPTIONS, getAcceptModeStyle } from '../adminConstants';
import { StepsTabContent } from '../components/StepsTabContent';

type Tab = 'basic' | 'notes' | 'steps';

function getMapId(questId: string): string {
  return questList.find((q) => q.questId === questId)?.mapId ?? '';
}

export function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const quest = questId ? questTable[questId] : undefined;

  const [tab, setTab] = useState<Tab>('basic');

  // Basic tab state
  const [name, setName] = useState(quest?.name ?? '');
  const [description, setDescription] = useState(quest?.description ?? '');
  const [acceptMode, setAcceptMode] = useState(quest?.acceptMode ?? 'auto');
  const [prerequisiteQuestId, setPrerequisiteQuestId] = useState(quest?.prerequisiteQuestId ?? '');

  // Notes tab state
  const [storyNote, setStoryNote] = useState(quest?.storyNote ?? '');
  const [blockingNote, setBlockingNote] = useState(quest?.blockingNote ?? '');
  const [designNote, setDesignNote] = useState(quest?.designNote ?? '');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-gray-500">找不到任務：{questId}</p>
        <Link to="/admin" className="mt-4 text-sm text-indigo-600 hover:underline">
          回到任務總覽
        </Link>
      </div>
    );
  }

  const mapId = getMapId(quest.id);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'basic', label: '基本資訊' },
    { key: 'steps', label: '步驟管理' },
    { key: 'notes', label: '備註欄位' },
  ];

  const otherQuests = Object.values(questTable).filter((q) => q.id !== quest.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link to="/admin" className="hover:text-gray-600">任務總覽</Link>
        <span>/</span>
        <span className="text-gray-600">{quest.id}</span>
      </nav>

      {/* Header：標題 ＋ 分頁 ＋ 儲存 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* 標題 + meta */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-gray-900">{quest.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{quest.id}</code>
            {mapId && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {mapId}
              </span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getAcceptModeStyle(acceptMode)}`}>
              {acceptMode}
            </span>
          </div>
        </div>

        {/* 分頁按鈕 ＋ 儲存（手機版換行到第二排） */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {key === 'steps' && (
                  <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 text-xs text-gray-500">
                    {quest.steps.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {saved ? '✓ 已儲存' : '儲存'}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Basic tab */}
        {tab === 'basic' && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                任務 ID
                <span className="ml-1 font-normal text-gray-400 text-xs">（唯讀）</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={quest.id}
                  className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(quest.id)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
                >
                  複製
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                任務名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                任務描述
                <span className="ml-1 font-normal text-gray-400 text-xs">description</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">供任務清單等使用</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                承接方式
                <span className="ml-1 font-normal text-gray-400 text-xs">acceptMode</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCEPT_MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      acceptMode === opt.value ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="acceptMode"
                      value={opt.value}
                      checked={acceptMode === opt.value}
                      onChange={() => setAcceptMode(opt.value)}
                      className="accent-indigo-600"
                    />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
              {(() => {
                const cur = ACCEPT_MODE_OPTIONS.find((o) => o.value === acceptMode);
                return cur ? <p className="mt-1.5 text-xs text-gray-500">{cur.desc}</p> : null;
              })()}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                前置任務
                <span className="ml-1 font-normal text-gray-400 text-xs">prerequisiteQuestId</span>
              </label>
              <select
                value={prerequisiteQuestId}
                onChange={(e) => setPrerequisiteQuestId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">（無前置任務）</option>
                {otherQuests.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id} — {q.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">需完成此任務才能承接</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">所屬地圖</label>
              <select
                defaultValue={mapId}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">（未指定）</option>
                {MAP_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}（{m.id}）</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Steps tab */}
        {tab === 'steps' && (
          <StepsTabContent questId={quest.id} initialSteps={quest.steps} />
        )}

        {/* Notes tab */}
        {tab === 'notes' && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                劇情備註
                <span className="ml-1 font-normal text-gray-400 text-xs">storyNote</span>
              </label>
              <textarea
                value={storyNote}
                onChange={(e) => setStoryNote(e.target.value)}
                rows={4}
                placeholder="例：物物在前往採集的途中，於微光村郊外的斷崖邊聽到金屬摩擦聲與慘叫..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">{storyNote.length} 字 ── 劇情背景、角色動機、故事脈絡</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                範圍阻擋備註
                <span className="ml-1 font-normal text-gray-400 text-xs">blockingNote</span>
              </label>
              <textarea
                value={blockingNote}
                onChange={(e) => setBlockingNote(e.target.value)}
                rows={3}
                placeholder="例：任務進行中，小迪應隱藏或設為不可互動。老漢克位置固定在斷崖邊。"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">筆記此任務應阻擋哪些區域 / NPC（實際阻擋機制另外實作）</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                體驗設計備註
                <span className="ml-1 font-normal text-gray-400 text-xs">designNote</span>
              </label>
              <textarea
                value={designNote}
                onChange={(e) => setDesignNote(e.target.value)}
                rows={3}
                placeholder="例：體驗重點：讓玩家感受「一瓶藥水的重量」，理解在資源匱乏的環境中，煉金術師的急救價值。"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">體驗重點、設計意圖、玩家應有的感受</p>
            </div>

            <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-600">
              備註欄位僅供開發者與策劃筆記，不影響任何遊戲邏輯。
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
