//════════════════════════════════════════════════════════════════
// 同步頁面：將任務資料上傳到 Google Sheet
//════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { questTable } from '../../quests/data/questUtils';
import { questList } from '../../quests/data/questList';
import { mapsById } from '../../maps/data/mapsTable';
import { uploadQuests, uploadQuestList, uploadMaps, type UploadResult } from '../utils/uploadToSheet';

// ========== 每個上傳區塊的狀態 ==========

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface BlockState {
  status: UploadStatus;
  result: UploadResult | null;
}

const initBlock = (): BlockState => ({ status: 'idle', result: null });

// ========== 上傳區塊元件 ==========

interface UploadBlockProps {
  title: string;
  description: string;
  count: number;
  tabName: string;
  state: BlockState;
  onUpload: () => void;
}

function UploadBlock({ title, description, count, tabName, state, onUpload }: UploadBlockProps) {
  const { status, result } = state;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* 左側：資訊 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {tabName}
            </code>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          <p className="mt-1 text-xs text-gray-400">{count} 筆資料</p>
        </div>

        {/* 右側：按鈕 */}
        <button
          type="button"
          onClick={onUpload}
          disabled={status === 'loading'}
          className={[
            'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            status === 'loading'
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
          ].join(' ')}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              上傳中…
            </span>
          ) : (
            '上傳'
          )}
        </button>
      </div>

      {/* 狀態回饋 */}
      {status === 'success' && result && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <span className="text-base">✅</span>
          <span>成功寫入 <strong>{result.count}</strong> 列到「{tabName}」</span>
        </div>
      )}
      {status === 'error' && result && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <span className="text-base">❌</span>
            <span className="font-medium">{result.error ?? '上傳失敗'}</span>
          </div>
          {result.details && (
            <p className="mt-1 pl-6 text-xs text-red-500">{result.details}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ========== 主頁面 ==========

export function SyncPage() {
  const [questsState, setQuestsState] = useState<BlockState>(initBlock);
  const [questListState, setQuestListState] = useState<BlockState>(initBlock);
  const [mapsState, setMapsState] = useState<BlockState>(initBlock);

  const handleUploadQuests = async () => {
    setQuestsState({ status: 'loading', result: null });
    try {
      const result = await uploadQuests(Object.values(questTable));
      setQuestsState({ status: result.success ? 'success' : 'error', result });
    } catch (err) {
      setQuestsState({
        status: 'error',
        result: { success: false, error: '網路錯誤', details: String(err) },
      });
    }
  };

  const handleUploadQuestList = async () => {
    setQuestListState({ status: 'loading', result: null });
    try {
      const result = await uploadQuestList(questList);
      setQuestListState({ status: result.success ? 'success' : 'error', result });
    } catch (err) {
      setQuestListState({
        status: 'error',
        result: { success: false, error: '網路錯誤', details: String(err) },
      });
    }
  };

  const handleUploadMaps = async () => {
    setMapsState({ status: 'loading', result: null });
    try {
      const result = await uploadMaps(Object.values(mapsById));
      setMapsState({ status: result.success ? 'success' : 'error', result });
    } catch (err) {
      setMapsState({
        status: 'error',
        result: { success: false, error: '網路錯誤', details: String(err) },
      });
    }
  };

  const allIdle = questsState.status === 'idle' && questListState.status === 'idle' && mapsState.status === 'idle';
  const anyLoading = questsState.status === 'loading' || questListState.status === 'loading' || mapsState.status === 'loading';

  const handleUploadAll = async () => {
    await Promise.all([handleUploadQuests(), handleUploadQuestList(), handleUploadMaps()]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">同步到 Google Sheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            將前端程式碼中的任務資料上傳到 Google Sheet，供後端 API 讀取。
          </p>
        </div>
        <button
          type="button"
          onClick={handleUploadAll}
          disabled={anyLoading}
          className={[
            'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            anyLoading
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'bg-gray-900 text-white hover:bg-gray-700',
          ].join(' ')}
        >
          {anyLoading ? '上傳中…' : '全部上傳'}
        </button>
      </div>

      {/* 說明提示 */}
      {allIdle && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          上傳會<strong>覆蓋</strong>對應分頁的所有資料，不會保留舊內容。請確認資料正確後再執行。
        </div>
      )}

      {/* 上傳區塊 */}
      <div className="space-y-4">
        <UploadBlock
          title="地圖定義"
          description="mapsTable.ts 中的所有 MapData（尺寸、出生點、紋理、特性等）"
          count={Object.keys(mapsById).length}
          tabName="maps"
          state={mapsState}
          onUpload={handleUploadMaps}
        />
        <UploadBlock
          title="任務定義"
          description="questData.ts 中的所有 QuestDef（包含步驟、對話、NPC 等完整設定）"
          count={Object.keys(questTable).length}
          tabName="quests"
          state={questsState}
          onUpload={handleUploadQuests}
        />
        <UploadBlock
          title="地圖任務綁定"
          description="questList.ts 中的 QuestEntry（地圖 ID、任務 ID、chainOrder）"
          count={questList.length}
          tabName="questList"
          state={questListState}
          onUpload={handleUploadQuestList}
        />
      </div>

      {/* 資料欄位說明 */}
      <details className="rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
          查看欄位結構
        </summary>
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-2">maps 分頁欄位</p>
            <div className="flex flex-wrap gap-1.5">
              {['id', 'name', 'width', 'height', 'texture (JSON)', 'spawnPoint (JSON)', 'features (JSON)'].map((f) => (
                <code key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</code>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">quests 分頁欄位</p>
            <div className="flex flex-wrap gap-1.5">
              {['id', 'name', 'description', 'prerequisiteQuestId', 'acceptMode', 'steps (JSON)', 'npcPositionOverrides (JSON)', 'storyNote', 'blockingNote', 'designNote'].map((f) => (
                <code key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</code>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-2">questList 分頁欄位</p>
            <div className="flex flex-wrap gap-1.5">
              {['mapId', 'questId', 'name', 'chainOrder'].map((f) => (
                <code key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</code>
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
