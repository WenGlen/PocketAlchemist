//════════════════════════════════════════════════════════════════
// 手持工具按鈕
//════════════════════════════════════════════════════════════════
// 每個欄位呈現為左右分割的按鈕：
//   左半：道具解鎖的技能（合成／加工等），點擊切換延伸面板
//   右半：手持道具圖示，點擊切換延伸面板，拖曳可取下道具
// 右半保留 data-equip-slot 屬性，可作為背包拖曳的放置目標

import { useRef, useCallback } from 'react';
import { getItem } from '../data/itemsTable';
import type { SlotItem } from '../inventory/useBackpack';
import type { SkillButtonConfig } from './SkillButtons';
import { DRAG_THRESHOLD_PX, DRAG_GHOST_Z_INDEX, ITEM_BOX_SIZE_PX } from '../inventoryConstants';

interface EquipmentSlotsProps {
  slots: (SlotItem | null)[];
  skillConfigs: (SkillButtonConfig | null)[];
  activePanelId: string | null;
  onTogglePanel: (panelId: string) => void;
  dropTargetIndex?: number | null;
  onUnequip?: (index: number) => void;
}

function createGhostEl(emoji: string, name: string): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('data-drag-ghost', 'true');
  el.style.cssText = [
    `position:fixed`, `left:0`, `top:0`,
    `width:${ITEM_BOX_SIZE_PX}px`, `height:${ITEM_BOX_SIZE_PX}px`,
    `display:flex`, `flex-direction:column`, `align-items:center`, `justify-content:flex-start`,
    `pointer-events:none`, `z-index:${DRAG_GHOST_Z_INDEX}`,
    `border:1pt solid hsl(200,60%,50%)`,
    `background:var(--color-panel)`,
    `transform:translate(-50%,-50%)`,
    `border-radius:6px`,
    `box-shadow:0 10px 15px -3px rgba(0,0,0,0.2)`,
    `overflow:hidden`,
  ].join(';');
  const emojiEl = document.createElement('div');
  emojiEl.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;';
  emojiEl.textContent = emoji;
  el.appendChild(emojiEl);
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'width:100%;padding:0 2px 2px;box-sizing:border-box;text-align:center;font-size:8px;line-height:1.2;word-break:break-all;color:var(--color-text-default);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';
  nameEl.textContent = name;
  el.appendChild(nameEl);
  return el;
}

// ========== 單一手持工具按鈕 ==========

interface HeldToolButtonProps {
  slot: SlotItem | null;
  skillConfig: SkillButtonConfig | null;
  isDropTarget: boolean;
  isActive: boolean;
  equipIndex: number;
  onTogglePanel: (panelId: string) => void;
  onUnequip: (index: number) => void;
}

function HeldToolButton({
  slot,
  skillConfig,
  isDropTarget,
  isActive,
  equipIndex,
  onTogglePanel,
  onUnequip,
}: HeldToolButtonProps) {
  const item = slot ? getItem(slot.itemId) : null;

  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef(slot);
  slotRef.current = slot;
  const skillConfigRef = useRef(skillConfig);
  skillConfigRef.current = skillConfig;
  const onUnequipRef = useRef(onUnequip);
  onUnequipRef.current = onUnequip;
  const onTogglePanelRef = useRef(onTogglePanel);
  onTogglePanelRef.current = onTogglePanel;

  const removeGhost = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
      ghostElRef.current = null;
    }
  }, []);

  // 右半：點擊 = 切換面板，拖曳 = 取下道具
  // touch-action:none 防止瀏覽器攔截手勢並觸發 pointercancel
  const handleItemPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!slotRef.current) return;
    const start = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    removeGhost();

    let dragging = false;

    const cleanup = () => {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('pointercancel', onCancel, true);
    };

    const onMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y);
      if (dist >= DRAG_THRESHOLD_PX) {
        if (!dragging) {
          dragging = true;
          const s = slotRef.current;
          const it = s ? getItem(s.itemId) : null;
          if (s && it) {
            const ghost = createGhostEl(it.emoji, it.name);
            ghost.style.left = `${moveEvent.clientX}px`;
            ghost.style.top = `${moveEvent.clientY}px`;
            document.body.appendChild(ghost);
            ghostElRef.current = ghost;
          }
        }
        if (ghostElRef.current) {
          ghostElRef.current.style.left = `${moveEvent.clientX}px`;
          ghostElRef.current.style.top = `${moveEvent.clientY}px`;
        }
      }
    };

    // pointerup：有拖曳 → 取下，沒拖曳 → 切換面板
    const onUp = () => {
      cleanup();
      if (dragging) {
        onUnequipRef.current(equipIndex);
      } else {
        const cfg = skillConfigRef.current;
        if (cfg) onTogglePanelRef.current(cfg.panelId);
      }
      removeGhost();
    };

    // pointercancel：瀏覽器中斷（如系統手勢），僅清理，不做任何操作
    const onCancel = () => {
      cleanup();
      removeGhost();
    };

    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onCancel, true);
  };

  const handleSkillClick = () => {
    if (skillConfig) onTogglePanel(skillConfig.panelId);
  };

  const hasSkill = !!skillConfig;

  return (
    <div
      className={[
        'flex flex-row h-14 rounded-lg border border-solid overflow-hidden select-none',
        'transition-[border-color,box-shadow] duration-150',
        isDropTarget
          ? 'border-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary-50)]'
          : 'border-[hsl(200,60%,50%)]',
      ].join(' ')}
    >
      {/* 左半：技能 */}
      <button
        type="button"
        disabled={!hasSkill}
        onClick={handleSkillClick}
        aria-label={hasSkill ? `${skillConfig!.label}面板` : '無技能'}
        className={[
          'w-10 flex flex-col items-center justify-center gap-0.5',
          'border-r border-[hsl(200,60%,50%)] text-[11px] font-medium leading-tight',
          'transition-[background,color] duration-150',
          !hasSkill
            ? 'bg-[var(--color-panel-muted)] text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'
            : isActive
              ? 'bg-[var(--color-primary-25)] text-[var(--color-primary)]'
              : 'bg-[var(--color-panel-muted)] text-[var(--color-text-default)] hover:brightness-110',
        ].join(' ')}
      >
        <span className="px-0.5 text-center leading-none">
          {hasSkill ? skillConfig!.label : '─'}
        </span>
        {hasSkill && (
          <span className="text-[9px] opacity-60">{isActive ? '▼' : '▲'}</span>
        )}
      </button>

      {/* 右半：道具（拖曳 = 取下，點擊 = 切換面板） */}
      <div
        data-equip-slot
        data-equip-slot-index={equipIndex}
        onPointerDown={item ? handleItemPointerDown : undefined}
        onClick={!item && skillConfig ? handleSkillClick : undefined}
        style={item ? { touchAction: 'none' } : undefined}
        className={[
          'w-14 flex flex-col items-center justify-center relative',
          isDropTarget ? 'bg-[var(--color-primary-25)]' : 'bg-[var(--color-panel-muted)]',
          item ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        ].join(' ')}
      >
        {item ? (
          <>
            <div className="text-[22px] leading-none pointer-events-none">{item.emoji}</div>
            <div className="w-full px-0.5 text-[8px] leading-tight text-center break-all line-clamp-2 text-[var(--color-text-default)] pointer-events-none">
              {item.name}
            </div>
          </>
        ) : (
          <span className="text-[var(--color-text-muted)] text-[10px] leading-tight text-center pointer-events-none">
            手持
          </span>
        )}
      </div>
    </div>
  );
}

// ========== 裝備欄（複數欄位） ==========

export function EquipmentSlots({
  slots,
  skillConfigs,
  activePanelId,
  onTogglePanel,
  dropTargetIndex = null,
  onUnequip,
}: EquipmentSlotsProps) {
  return (
    <div className="flex flex-col gap-2 py-2">
      {slots.map((slot, i) => (
        <HeldToolButton
          key={i}
          slot={slot}
          skillConfig={skillConfigs[i] ?? null}
          isDropTarget={dropTargetIndex === i}
          isActive={!!skillConfigs[i] && activePanelId === skillConfigs[i]!.panelId}
          equipIndex={i}
          onTogglePanel={onTogglePanel}
          onUnequip={onUnequip ?? (() => {})}
        />
      ))}
    </div>
  );
}
