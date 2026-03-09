//════════════════════════════════════════════════════════════════
// 裝備欄 UI
//════════════════════════════════════════════════════════════════
// 左側兩個垂直格子，只接受 subCategory='eqp' + part='hand' 的道具
// 點擊（小移動）→ 取下裝備；拖曳（大移動）→ 取下並放回背包

import { useRef, useCallback } from 'react';
import { getItem } from '../data/itemsTable';
import type { SlotItem } from '../inventory/useBackpack';
import { DRAG_THRESHOLD_PX, DRAG_GHOST_Z_INDEX, ITEM_BOX_SIZE_PX } from '../inventoryConstants';

interface EquipmentSlotsProps {
  slots: (SlotItem | null)[];
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

export function EquipmentSlots({ slots, dropTargetIndex = null, onUnequip }: EquipmentSlotsProps) {
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const onUnequipRef = useRef(onUnequip);
  onUnequipRef.current = onUnequip;

  const removeGhost = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
      ghostElRef.current = null;
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (!slotsRef.current[index]) return;
    const start = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    removeGhost();

    let ghostCreated = false;

    const onDocPointerMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y);
      if (dist >= DRAG_THRESHOLD_PX) {
        if (!ghostCreated) {
          ghostCreated = true;
          const slot = slotsRef.current[index];
          const item = slot ? getItem(slot.itemId) : null;
          if (slot && item) {
            const ghost = createGhostEl(item.emoji, item.name);
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

    const onDocPointerUp = () => {
      document.removeEventListener('pointermove', onDocPointerMove, true);
      document.removeEventListener('pointerup', onDocPointerUp, true);
      document.removeEventListener('pointercancel', onDocPointerUp, true);
      // 不論 tap 還是 drag，只要放開就取下裝備
      onUnequipRef.current?.(index);
      removeGhost();
    };

    document.addEventListener('pointermove', onDocPointerMove, true);
    document.addEventListener('pointerup', onDocPointerUp, true);
    document.addEventListener('pointercancel', onDocPointerUp, true);
  };

  return (
    <div className="flex flex-col gap-2 py-2">
      {slots.map((slot, i) => {
        const item = slot ? getItem(slot.itemId) : null;
        const isOver = dropTargetIndex === i;
        return (
          <div
            key={i}
            data-equip-slot
            data-equip-slot-index={i}
            onPointerDown={item ? (e) => handlePointerDown(e, i) : undefined}
            className={`w-16 h-16 rounded-lg border-[1pt] border-solid flex flex-col items-center justify-center relative select-none transition-[border-color,background,box-shadow] duration-150 ${
              isOver
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] shadow-[0_0_10px_var(--color-primary-50)]'
                : 'bg-[var(--color-panel-muted)]'
            } ${item ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={isOver ? undefined : { borderColor: 'hsl(200,60%,50%)' }}
          >
            {item ? (
              <div
                className="absolute inset-px rounded-md border-[1pt] border-solid bg-[var(--color-panel-muted)] flex flex-col items-stretch justify-start overflow-hidden pointer-events-none"
                style={{ borderColor: 'hsl(200,60%,50%)' }}
              >
                <div className="flex-1 flex items-center justify-center text-[22px] leading-none min-h-0">
                  {item.emoji}
                </div>
                <div className="w-full px-0.5 pb-[2px] text-center">
                  <span className="block text-[8px] leading-tight break-all line-clamp-2 text-[var(--color-text-default)]">
                    {item.name}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[var(--color-text-muted)] text-[10px] leading-tight text-center pointer-events-none">
                手持
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
