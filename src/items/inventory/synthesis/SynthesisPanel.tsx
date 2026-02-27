import { useState, useRef, useCallback } from 'react';
import { getItem } from '../../data/itemTable';
import { matchRecipe } from './recipes';
import type { SlotItem } from '../useBackpack';

const SYNTH_SLOTS = 2;
const DRAG_THRESHOLD = 10;

/** 與道具小框同尺寸（欄位邊框內縮 1px） */
const SLOT_BORDER_PX = 2;
const ITEM_BOX_GAP_PX = 1;
const SLOT_OUTER_PX = 64;
const ITEM_BOX_SIZE_PX = SLOT_OUTER_PX - SLOT_BORDER_PX * 2 - ITEM_BOX_GAP_PX * 2;

function createGhostEl(itemName: string, count: number): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'fixed shadow-lg flex flex-col items-center justify-center text-xs font-medium pointer-events-none z-[9999] relative rounded-md';
  el.style.cssText = `width:${ITEM_BOX_SIZE_PX}px;height:${ITEM_BOX_SIZE_PX}px;border:1pt solid var(--color-primary);background:var(--color-panel);color:var(--color-text-default);transform:translate(-50%,-50%);z-index:2147483647;`;
  const span = document.createElement('span');
  span.className = 'leading-tight px-0.5 text-center break-words line-clamp-2';
  span.textContent = itemName;
  el.appendChild(span);
  if (count > 1) {
    const badge = document.createElement('span');
    badge.className = 'absolute bottom-0.5 right-1 text-[10px]';
    badge.textContent = String(count);
    el.appendChild(badge);
  }
  return el;
}

interface SynthesisPanelProps {
  slots: (SlotItem | null)[];
  onSetSlot: (index: number, item: SlotItem | null) => void;
  onCraft: (resultItemId: string, resultCount: number) => void;
  onDragEndFromSynthesis?: (synthesisSlotIndex: number, clientX: number, clientY: number) => void;
  /** 拖曳中游標在該合成格上時高亮（可放置預覽） */
  dragOverSynthesisSlotIndex?: number | null;
  /** 剛合成成功，結果格播發光動效 */
  justCrafted?: boolean;
}

export function SynthesisPanel({
  slots,
  onSetSlot: _onSetSlot,
  onCraft,
  onDragEndFromSynthesis,
  dragOverSynthesisSlotIndex = null,
  justCrafted = false,
}: SynthesisPanelProps) {
  const [, setDragStart] = useState<{ x: number; y: number; index: number } | null>(null);
  const [, setDidDrag] = useState(false);
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const onDragEndFromSynthesisRef = useRef(onDragEndFromSynthesis);
  onDragEndFromSynthesisRef.current = onDragEndFromSynthesis;

  const removeGhost = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
      ghostElRef.current = null;
    }
  }, []);

  const ingredients = slots
    .map((s) => (s ? { itemId: s.itemId, count: s.count } : null))
    .filter(Boolean) as { itemId: string; count: number }[];
  const recipe = matchRecipe(ingredients);

  const handleCraft = () => {
    if (!recipe) return;
    onCraft(recipe.result.itemId, recipe.result.count);
  };

  const handleSlotPointerDown = (e: React.PointerEvent, i: number) => {
    if (!slots[i]) return;
    const start = { x: e.clientX, y: e.clientY, index: i };
    setDragStart(start);
    setDidDrag(false);
    removeGhost();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    let ghostCreated = false;
    const currentSlots = [...slots];

    const onDocPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        if (!ghostCreated) {
          ghostCreated = true;
          setDidDrag(true);
          const slot = currentSlots[start.index];
          const item = slot ? getItem(slot.itemId) : null;
          if (slot && item) {
            const ghost = createGhostEl(item.name, slot.count);
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
        setDidDrag(true);
      }
    };

    const onDocPointerUp = (upEvent: PointerEvent) => {
      document.removeEventListener('pointermove', onDocPointerMove);
      document.removeEventListener('pointerup', onDocPointerUp);
      document.removeEventListener('pointercancel', onDocPointerUp);
      if (ghostCreated && onDragEndFromSynthesisRef.current) {
        onDragEndFromSynthesisRef.current(start.index, upEvent.clientX, upEvent.clientY);
      }
      removeGhost();
      setDragStart(null);
      setDidDrag(false);
    };

    document.addEventListener('pointermove', onDocPointerMove);
    document.addEventListener('pointerup', onDocPointerUp);
    document.addEventListener('pointercancel', onDocPointerUp);
  };

  const handleSlotPointerUp = () => {
    removeGhost();
    setDragStart(null);
    setDidDrag(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3 items-center">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {Array.from({ length: SYNTH_SLOTS }, (_, i) => {
          const slot = slots[i];
          const item = slot ? getItem(slot.itemId) : null;
          const canDrag = !!slot;
          return (
            <div
              key={i}
              data-synthesis-slot
              data-synthesis-slot-index={i}
              className={`w-16 h-16 rounded-lg border-[1pt] border-solid flex flex-col items-center justify-center text-xs text-[var(--color-text-default)] select-none touch-none relative transition-[border-color,background,box-shadow] duration-150 ${
                dragOverSynthesisSlotIndex === i
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] shadow-[0_0_10px_var(--color-primary-50)]'
                  : 'border-[var(--color-border)] bg-[var(--color-panel-muted)]'
              }`}
              onPointerUp={canDrag ? handleSlotPointerUp : undefined}
              onPointerCancel={canDrag ? handleSlotPointerUp : undefined}
            >
              {item ? (
                <div
                  className="absolute inset-px rounded-md border-[1pt] border-solid border-[var(--color-border)] bg-[var(--color-panel-muted)] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handleSlotPointerDown(e, i)}
                >
                  <span title={item.name} className="leading-tight px-0.5 text-center break-words line-clamp-2">{item.name}</span>
                  {slot && slot.count > 1 && <span className="absolute bottom-0.5 right-1 text-[10px]">{slot.count}</span>}
                </div>
              ) : (
                <span className="text-[var(--color-text-muted)]">素材</span>
              )}
            </div>
          );
        })}
        <span className="text-[var(--color-text-muted)] text-sm">→</span>
        <div
          className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center min-w-[4rem] text-center ${
            recipe
              ? `border-[3px] border-[var(--color-primary)] bg-[var(--color-primary-25)] shadow-[0_0_16px_var(--color-primary-50)] ${justCrafted ? 'animate-craft-result-glow' : ''}`
              : 'border-2 border-[var(--color-border)] bg-[var(--color-panel-50)]'
          }`}
        >
          {recipe ? (
            <>
              <span className="text-sm font-semibold text-[var(--color-primary)] w-full text-center">
                {getItem(recipe.result.itemId)?.name ?? '?'}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] text-center">即將合成</span>
            </>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">?</span>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={!recipe}
        onClick={handleCraft}
        className="py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
      >
        合成
      </button>
    </div>
  );
}
