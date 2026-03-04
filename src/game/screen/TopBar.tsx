//════════════════════════════════════════════════════════════════
// 頂部工具列
//════════════════════════════════════════════════════════════════
// 顯示標題、版本號、音效開關、地圖選單
// MVP-02-4：改為地圖選擇模式（任務由 NPC 對話承接）

import { useState, useRef, useEffect, useMemo } from 'react';
import type { MissionEntry } from '../../quests/data/missionList';
import { APP_VERSION } from '../version';
import { useAudioMute } from '../../assets/audio';
import { getQuest, isQuestUnlocked } from '../../quests/data/questData';
import { getMap } from '../../maps/data/mapsTable';

// ========== Props ==========

interface TopBarProps {
  currentMapId: string;
  currentQuestId: string | null;
  missions: MissionEntry[];
  completedQuestIds: string[];
  onEnterMap: (mapId: string) => void;
  onSelectMission: (mapId: string, questId: string) => void;  // 開發測試用（會重置一切）
}

export function TopBar({
  currentMapId,
  currentQuestId,
  missions,
  completedQuestIds,
  onEnterMap,
  onSelectMission,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [muted, toggleMute] = useAudioMute();

  // 依 mapId 分組
  const mapGroups = useMemo(() => {
    const groups: Record<string, MissionEntry[]> = {};
    for (const m of missions) {
      if (!groups[m.mapId]) groups[m.mapId] = [];
      groups[m.mapId].push(m);
    }
    return groups;
  }, [missions]);

  const mapIds = useMemo(() => Object.keys(mapGroups), [mapGroups]);

  useEffect(() => {
    if (!menuOpen && !devMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setDevMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, devMenuOpen]);

  const handleSelectMap = (mapId: string) => {
    onEnterMap(mapId);
    setMenuOpen(false);
  };

  const handleSelectMission = (m: MissionEntry) => {
    onSelectMission(m.mapId, m.questId);
    setDevMenuOpen(false);
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
              {missions.map((m) => {
                const isCurrent = m.mapId === currentMapId && m.questId === currentQuestId;
                const quest = getQuest(m.questId);
                const locked = quest ? !isQuestUnlocked(quest, completedQuestIds) : false;
                const isCompleted = completedQuestIds.includes(m.questId);
                const mapName = getMap(m.mapId)?.name ?? m.mapId;
                return (
                  <button
                    key={m.questId}
                    type="button"
                    role="menuitem"
                    disabled={locked}
                    className={[
                      'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2',
                      locked
                        ? 'text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                        : 'text-[var(--color-text-default)] hover:bg-[var(--color-panel-muted)]',
                    ].join(' ')}
                    onClick={() => !locked && handleSelectMission(m)}
                  >
                    <span className="flex items-center gap-1.5">
                      {locked && <span aria-label="未解鎖">🔒</span>}
                      {isCompleted && !locked && <span aria-label="已完成" className="text-[var(--color-primary)]">✓</span>}
                      <span className="text-[10px] text-[var(--color-text-muted)]">[{mapName}]</span>
                      {m.name}
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
        </div>
      </div>
    </header>
  );
}
