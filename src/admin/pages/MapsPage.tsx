import { useState } from 'react';
import { questList } from '../../quests/data/questList';
import type { QuestEntry } from '../../quests/data/questList';
import { questTable } from '../../quests/data/questUtils';
import { mapsById } from '../../maps/data/mapsTable';
import type { MapData } from '../../maps/data/mapsTable';
import { getAcceptModeStyle } from '../adminConstants';
import { uploadMaps, uploadQuestList } from '../utils/uploadToSheet';
import { Link } from 'react-router-dom';

// ========== 型別 ==========

type EditableMapData = Omit<MapData, 'texture' | 'features'> & {
  textureJson: string;   // texture 序列化為 JSON 字串以利文字編輯
  featuresJson: string;  // features 序列化為 JSON 字串以利文字編輯
};

// ========== 工具函式 ==========

function toEditable(m: MapData): EditableMapData {
  return {
    id: m.id,
    name: m.name,
    width: m.width,
    height: m.height,
    spawnPoint: m.spawnPoint,
    textureJson: m.texture ? JSON.stringify(m.texture, null, 2) : '',
    featuresJson: m.features ? JSON.stringify(m.features, null, 2) : '',
  };
}

function isValidJson(s: string): boolean {
  if (!s.trim()) return true;
  try { JSON.parse(s); return true; } catch { return false; }
}

function fromEditable(e: EditableMapData): MapData {
  return {
    id: e.id,
    name: e.name,
    width: e.width,
    height: e.height,
    spawnPoint: e.spawnPoint,
    texture: e.textureJson.trim() ? JSON.parse(e.textureJson) : undefined,
    features: e.featuresJson.trim() ? JSON.parse(e.featuresJson) : undefined,
  };
}

// ========== 地圖設定區塊 ==========

interface MapSettingsProps {
  data: EditableMapData;
  onChange: (next: EditableMapData) => void;
}

function MapSettings({ data, onChange }: MapSettingsProps) {
  const set = <K extends keyof EditableMapData>(key: K, val: EditableMapData[K]) =>
    onChange({ ...data, [key]: val });

  const textureInvalid = !isValidJson(data.textureJson);
  const featuresInvalid = !isValidJson(data.featuresJson);

  return (
    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-4">
      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">地圖名稱</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">寬度 (px)</label>
          <input
            type="number"
            value={data.width}
            onChange={(e) => set('width', Number(e.target.value))}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">高度 (px)</label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => set('height', Number(e.target.value))}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 出生點 */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">出生點 (spawnPoint)</label>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">X</span>
            <input
              type="number"
              value={data.spawnPoint?.x ?? ''}
              onChange={(e) => set('spawnPoint', { x: Number(e.target.value), y: data.spawnPoint?.y ?? 0 })}
              className="w-24 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Y</span>
            <input
              type="number"
              value={data.spawnPoint?.y ?? ''}
              onChange={(e) => set('spawnPoint', { x: data.spawnPoint?.x ?? 0, y: Number(e.target.value) })}
              className="w-24 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Features & Texture JSON */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            features (JSON)
            {featuresInvalid && <span className="text-red-500">⚠ 格式錯誤</span>}
          </label>
          <textarea
            rows={5}
            value={data.featuresJson}
            onChange={(e) => set('featuresJson', e.target.value)}
            spellCheck={false}
            className={`w-full rounded-md border px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:outline-none ${
              featuresInvalid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-indigo-400'
            }`}
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            texture (JSON)
            {textureInvalid && <span className="text-red-500">⚠ 格式錯誤</span>}
          </label>
          <textarea
            rows={5}
            value={data.textureJson}
            onChange={(e) => set('textureJson', e.target.value)}
            spellCheck={false}
            className={`w-full rounded-md border px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:outline-none ${
              textureInvalid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-indigo-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

// ========== 主頁面 ==========

export function MapsPage() {
  // 任務綁定狀態
  const [entries, setEntries] = useState<QuestEntry[]>([...questList]);
  const [addMapId, setAddMapId] = useState('');
  const [addQuestId, setAddQuestId] = useState('');
  const [addChainOrder, setAddChainOrder] = useState(1);

  // 地圖資料狀態
  const [mapDataMap, setMapDataMap] = useState<Record<string, EditableMapData>>(
    () => Object.fromEntries(Object.values(mapsById).map((m) => [m.id, toEditable(m)]))
  );

  // 哪些地圖卡片展開了設定面板
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set());

  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const allMapIds = Object.keys(mapsById);

  const toggleExpand = (mapId: string) => {
    setExpandedMaps((prev) => {
      const next = new Set(prev);
      next.has(mapId) ? next.delete(mapId) : next.add(mapId);
      return next;
    });
  };

  const updateMapData = (mapId: string, next: EditableMapData) => {
    setMapDataMap((prev) => ({ ...prev, [mapId]: next }));
  };

  // 任務綁定操作
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
    setEntries(entries.map((e) => (e.questId === questId ? { ...e, chainOrder: val } : e)));
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

  // 有 JSON 格式錯誤的地圖
  const hasJsonError = Object.values(mapDataMap).some(
    (m) => !isValidJson(m.textureJson) || !isValidJson(m.featuresJson)
  );

  const handleSave = async () => {
    if (hasJsonError) return;
    setSaveStatus('loading');
    setSaveError(null);
    try {
      const mapsToUpload = Object.values(mapDataMap).map(fromEditable);
      const [mapsResult, questListResult] = await Promise.all([
        uploadMaps(mapsToUpload),
        uploadQuestList(entries),
      ]);
      if (!mapsResult.success) throw new Error(mapsResult.error ?? '地圖上傳失敗');
      if (!questListResult.success) throw new Error(questListResult.error ?? '任務綁定上傳失敗');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">地圖管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            編輯地圖基本設定，並管理各地圖的任務綁定順序
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={hasJsonError || saveStatus === 'loading'}
            onClick={handleSave}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              saveStatus === 'success' ? 'bg-green-600' : saveStatus === 'error' ? 'bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title={hasJsonError ? '有 JSON 格式錯誤，請修正後再儲存' : ''}
          >
            {saveStatus === 'loading' ? '上傳中…' : saveStatus === 'success' ? '✓ 已同步' : saveStatus === 'error' ? '✕ 失敗' : '儲存並同步'}
          </button>
          {saveStatus === 'error' && saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
        </div>
      </div>

      {/* Per-map sections */}
      {allMapIds.map((mapId) => {
        const mapMeta = mapsById[mapId];
        const editableData = mapDataMap[mapId];
        const mapEntries = entries
          .filter((e) => e.mapId === mapId)
          .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));
        const isExpanded = expandedMaps.has(mapId);
        const hasError =
          !isValidJson(editableData.featuresJson) || !isValidJson(editableData.textureJson);

        return (
          <div key={mapId} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* 地圖標題列 */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{mapMeta.name}</h2>
                  {hasError && <span className="text-xs text-red-500">⚠ JSON 錯誤</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                  <code>{mapId}</code>
                  <span>{mapMeta.width} × {mapMeta.height}</span>
                  {mapMeta.spawnPoint && (
                    <span>出生點 ({mapMeta.spawnPoint.x}, {mapMeta.spawnPoint.y})</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-600">
                  {mapEntries.length} 個任務
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(mapId)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isExpanded
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isExpanded ? '收合設定 ▲' : '編輯設定 ▼'}
                </button>
              </div>
            </div>

            {/* 地圖設定面板（可展開） */}
            {isExpanded && editableData && (
              <MapSettings data={editableData} onChange={(next) => updateMapData(mapId, next)} />
            )}

            {/* 任務綁定列表 */}
            {mapEntries.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">此地圖尚無任務綁定</div>
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

      {/* 新增地圖任務綁定 */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">新增任務綁定</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">地圖</label>
            <select
              value={addMapId}
              onChange={(e) => setAddMapId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">請選擇</option>
              {allMapIds.map((id) => (
                <option key={id} value={id}>{mapsById[id].name} — {id}</option>
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
