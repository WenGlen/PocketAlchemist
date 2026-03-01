//════════════════════════════════════════════════════════════════
// 頂部工具列
//════════════════════════════════════════════════════════════════
// 顯示標題、版本號、音效開關、任務選單

import { useState, useRef, useEffect } from 'react';
import type { MissionEntry } from '../../quests/data/missionList';
import { APP_VERSION } from '../version';
import { useAudioMute } from '../../assets/audio';
import { getQuest, isQuestUnlocked } from '../../quests/data/questData';

// ========== Props ==========

interface TopBarProps {
  currentMapId: string;
  currentQuestId: string;  // 當前選中的任務 ID（與 mission 的 questId 比對）
  missions: MissionEntry[];
  completedQuestIds: string[];  // 已完成任務 ID 清單，供串鏈任務鎖定判斷
  onSelectMission: (mapId: string, questId: string) => void;  // 選擇任務：傳入該任務的 mapId 與 questId
}

export function TopBar({ currentMapId, currentQuestId, missions, completedQuestIds, onSelectMission }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [muted, toggleMute] = useAudioMute();

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSelect = (m: MissionEntry) => {
    onSelectMission(m.mapId, m.questId);
    setMenuOpen(false);
  };

  return (
    <header className="flex-shrink-0 h-12 px-3 flex items-center justify-between bg-[var(--color-panel)] border-b border-[var(--color-border)] relative">
      <span className="text-sm font-semibold text-[var(--color-text-default)]">通勤鍊金術師</span>
      <span className="text-sm font-semibold text-muted">{APP_VERSION}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-base hover:bg-[var(--color-panel-muted)] transition-colors"
          aria-label={muted ? '開啟音效' : '靜音'}
          title={muted ? '開啟音效' : '靜音'}
          onClick={toggleMute}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="px-3 py-1 rounded bg-[var(--color-btn)] text-[var(--color-btn-text)] text-sm"
          aria-label="選單"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          選單
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 py-1 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg z-50"
            role="menu"
          >
            <div className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              選擇任務
            </div>
            {missions.map((m) => {
              const isCurrent = m.mapId === currentMapId && m.questId === currentQuestId;
              const quest = getQuest(m.questId);
              const locked = quest ? !isQuestUnlocked(quest, completedQuestIds) : false;
              const isCompleted = completedQuestIds.includes(m.questId);
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
                  onClick={() => !locked && handleSelect(m)}
                >
                  <span className="flex items-center gap-1.5">
                    {locked && <span aria-label="未解鎖">🔒</span>}
                    {isCompleted && !locked && <span aria-label="已完成" className="text-[var(--color-primary)]">✓</span>}
                    {m.name}
                  </span>
                  {isCurrent && !locked && (
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">（重新開始）</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
