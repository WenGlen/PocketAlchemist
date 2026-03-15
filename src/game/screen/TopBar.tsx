//════════════════════════════════════════════════════════════════
// 頂部工具列
//════════════════════════════════════════════════════════════════
// 顯示標題、版本號、音效開關、地圖選單
// MVP-02-4：改為地圖選擇模式（任務由 NPC 對話承接）

import { useState, useRef, useEffect, useMemo } from 'react';
import type { QuestEntry } from '../../quests/data/questList';
import { APP_VERSION } from '../../devVersion';
import { useAudioMute } from '../../assets/audio';
import { getQuest, isQuestUnlocked } from '../../quests/data/questUtils';
import { getMap } from '../../maps/data/mapsTable';
import { getItem } from '../../items/data/itemsTable';

// ========== Props ==========

interface TopBarProps {
  currentMapId: string;
  currentQuestId: string | null;
  quests: QuestEntry[];
  completedQuestIds: string[];
  onEnterMap: (mapId: string) => void;
  onSelectMission: (mapId: string, questId: string) => void;  // 開發測試用（會重置一切）
  onCheatAddItem?: (itemId: string, count: number) => void;   // 金手指：新增道具
}

export function TopBar({
  currentMapId,
  currentQuestId,
  quests,
  completedQuestIds,
  onEnterMap,
  onSelectMission,
  onCheatAddItem,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [cheatMenuOpen, setCheatMenuOpen] = useState(false);
  const [cheatItemId, setCheatItemId] = useState('');
  const [cheatCount, setCheatCount] = useState('1');
  const [cheatMessage, setCheatMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [muted, toggleMute] = useAudioMute();

  // 依 mapId 分組
  const mapGroups = useMemo(() => {
    const groups: Record<string, QuestEntry[]> = {};
    for (const q of quests) {
      if (!groups[q.mapId]) groups[q.mapId] = [];
      groups[q.mapId].push(q);
    }
    return groups;
  }, [quests]);

  const mapIds = useMemo(() => Object.keys(mapGroups), [mapGroups]);

  useEffect(() => {
    if (!menuOpen && !devMenuOpen && !cheatMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setDevMenuOpen(false);
        setCheatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, devMenuOpen, cheatMenuOpen]);

  const handleSelectMap = (mapId: string) => {
    onEnterMap(mapId);
    setMenuOpen(false);
  };

  const handleSelectQuest = (q: QuestEntry) => {
    onSelectMission(q.mapId, q.questId);
    setDevMenuOpen(false);
  };

  const handleCheatSubmit = () => {
    if (!onCheatAddItem) return;
    const trimmedId = cheatItemId.trim();
    const count = parseInt(cheatCount, 10) || 1;
    const item = getItem(trimmedId);
    if (!item) {
      setCheatMessage(`❌ 找不到道具：${trimmedId}`);
      return;
    }
    onCheatAddItem(trimmedId, count);
    setCheatMessage(`✅ 獲得 ${item.name} x${count}`);
    setCheatItemId('');
    setCheatCount('1');
  };

  const currentMapName = getMap(currentMapId)?.name ?? currentMapId;

  return (
    <header className="flex-shrink-0 h-12 px-3 flex items-center justify-between bg-[var(--color-panel)] border-b border-[var(--color-border)] relative">
      <span className="text-sm font-semibold text-[var(--color-text-default)]">通勤鍊金術師</span>
      <span className="text-xs text-[var(--color-text-muted)]">{currentMapName}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{APP_VERSION}</span>

      <div className="flex items-center gap-2">
        {/* 音效開關 */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-base hover:bg-[var(--color-panel-muted)] transition-colors"
          aria-label={muted ? '開啟音效' : '靜音'}
          title={muted ? '開啟音效' : '靜音'}
          onClick={toggleMute}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* 地圖選單 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="px-3 py-1 rounded bg-[var(--color-btn)] text-[var(--color-btn-text)] text-sm"
            aria-label="選單"
            aria-expanded={menuOpen || devMenuOpen}
            onClick={() => {
              setMenuOpen((o) => !o);
              setDevMenuOpen(false);
            }}
          >
            選單
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg z-50"
              role="menu"
            >
              <div className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                選擇地圖
              </div>
              {mapIds.map((mapId) => {
                const map = getMap(mapId);
                const mapName = map?.name ?? mapId;
                const isCurrent = mapId === currentMapId;
                // 計算此地圖的任務完成進度
                const questsInMap = mapGroups[mapId];
                const completedInMap = questsInMap.filter((m) => completedQuestIds.includes(m.questId)).length;
                const totalInMap = questsInMap.length;
                return (
                  <button
                    key={mapId}
                    type="button"
                    role="menuitem"
                    className={[
                      'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2',
                      'text-[var(--color-text-default)] hover:bg-[var(--color-panel-muted)]',
                    ].join(' ')}
                    onClick={() => handleSelectMap(mapId)}
                  >
                    <span className="flex items-center gap-1.5">
                      🗺️ {mapName}
                      {isCurrent && <span className="text-[10px] text-[var(--color-primary)]">（當前）</span>}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {completedInMap}/{totalInMap}
                    </span>
                  </button>
                );
              })}
              <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)]"
                  onClick={() => {
                    setMenuOpen(false);
                    setDevMenuOpen(true);
                  }}
                >
                  🔧 開發：選任務
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)]"
                  onClick={() => {
                    setMenuOpen(false);
                    setCheatMenuOpen(true);
                    setCheatMessage(null);
                  }}
                >
                  🎮 金手指：新增道具
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-error)] hover:bg-[var(--color-panel-muted)]"
                  onClick={() => {
                    localStorage.removeItem('pa_completed_quests');
                    setDevMenuOpen(false);
                    location.reload();
                  }}
                >
                  🗑️ 清除所有紀錄
                </button>
              </div>
            </div>
          )}

          {/* 開發模式：任務選單（保留供測試） */}
          {devMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg z-50"
              role="menu"
            >
              <div className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                🔧 開發模式：選任務
              </div>
              {quests.map((q) => {
                const isCurrent = q.mapId === currentMapId && q.questId === currentQuestId;
                const quest = getQuest(q.questId);
                const locked = quest ? !isQuestUnlocked(quest, completedQuestIds) : false;
                const isCompleted = completedQuestIds.includes(q.questId);
                const mapName = getMap(q.mapId)?.name ?? q.mapId;
                return (
                  <button
                    key={q.questId}
                    type="button"
                    role="menuitem"
                    disabled={locked}
                    className={[
                      'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2',
                      locked
                        ? 'text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                        : 'text-[var(--color-text-default)] hover:bg-[var(--color-panel-muted)]',
                    ].join(' ')}
                    onClick={() => !locked && handleSelectQuest(q)}
                  >
                    <span className="flex items-center gap-1.5">
                      {locked && <span aria-label="未解鎖">🔒</span>}
                      {isCompleted && !locked && <span aria-label="已完成" className="text-[var(--color-primary)]">✓</span>}
                      <span className="text-[10px] text-[var(--color-text-muted)]">[{mapName}]</span>
                      {q.name}
                    </span>
                    {isCurrent && !locked && (
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">（重新開始）</span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)]"
                  onClick={() => {
                    setDevMenuOpen(false);
                    setMenuOpen(true);
                  }}
                >
                  ← 返回地圖選單
                </button>
              </div>
            </div>
          )}

          {/* 金手指選單 */}
          {cheatMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-2 px-3 min-w-[240px] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg z-50"
              role="menu"
            >
              <div className="text-xs text-[var(--color-text-muted)] mb-2">
                🎮 金手指：新增道具
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="道具編號 (如 ITM-pot-0001)"
                  value={cheatItemId}
                  onChange={(e) => setCheatItemId(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-default)] placeholder:text-[var(--color-text-muted)]"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="數量"
                    value={cheatCount}
                    onChange={(e) => setCheatCount(e.target.value)}
                    className="w-16 px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-default)]"
                  />
                  <button
                    type="button"
                    className="flex-1 px-3 py-1.5 text-sm rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] hover:brightness-110"
                    onClick={handleCheatSubmit}
                  >
                    獲得
                  </button>
                </div>
                {cheatMessage && (
                  <div className="text-xs py-1">{cheatMessage}</div>
                )}
              </div>
              <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                <button
                  type="button"
                  className="w-full text-left text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-default)]"
                  onClick={() => {
                    setCheatMenuOpen(false);
                    setMenuOpen(true);
                  }}
                >
                  ← 返回選單
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
