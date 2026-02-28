import { useState, useRef, useEffect } from 'react';
import type { MissionEntry } from '../../../quests/data/missionList';

interface TopBarProps {
  currentMapId: string;
  /** 當前選中的任務 ID（與 mission 的 questId 比對） */
  currentQuestId: string;
  missions: MissionEntry[];
  /** 選擇任務：傳入該任務的 mapId 與 questId */
  onSelectMission: (mapId: string, questId: string) => void;
}

export function TopBar({ currentMapId, currentQuestId, missions, onSelectMission }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      <span className="text-sm font-semibold text-muted">MVP-01.00</span>

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
              return (
                <button
                  key={m.questId}
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-sm text-[var(--color-text-default)] hover:bg-[var(--color-panel-muted)] flex items-center justify-between gap-2"
                  onClick={() => handleSelect(m)}
                >
                  <span>{m.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">（重新開始）</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
