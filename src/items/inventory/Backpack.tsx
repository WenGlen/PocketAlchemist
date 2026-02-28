import { useState, useRef, useCallback } from 'react';
import { getItem } from '../data/itemTable';
import type { SlotItem } from './useBackpack';

const DRAG_THRESHOLD = 10;
/**
 * 拖曳排查：設為 true 後打開 DevTools Console，拖道具時應看到
 * [Backpack] pointer down → threshold passed, creating ghost → ghost appended to body → ghost position (每 20 次 move 印一次) → pointer up
 * 若沒有 "creating ghost" 表示 document 沒收到 pointermove（可改為在 window 監聽試試）
 */
const DRAG_DEBUG = false;

export type DropTargetFromBackpack =
  | { type: 'backpack'; index: number }
  | { type: 'synthesis'; index: number }
  | { type: 'delivery' }
  | { type: 'resource'; id: string }
  | { type: 'terrain'; id: string }
  | null;

interface BackpackProps {
  slots: (SlotItem | null)[];
  capacity: number;
  onMoveSlot: (fromIndex: number, toIndex: number) => void;
  onDragEnd?: (fromSlotIndex: number, clientX: number, clientY: number) => void;
  /** 拖曳中每 move 回報座標，供 parent 用 elementFromPoint 算 drop 目標高亮 */
  onDragMove?: (clientX: number, clientY: number) => void;
  /** 拖曳結束或取消時呼叫，供 parent 清除 drop 目標狀態 */
  onDragEndOrCancel?: () => void;
  /** 需要高亮顯示的道具 ID（例如靠近湖時玻璃瓶變亮） */
  highlightItemId?: string | null;
  /** 剛放入道具的格子 index，觸發落地縮放動效後由 parent 清除 */
  lastPlacedSlotIndex?: number | null;
  /** 背包內拖曳排序成功放入時由 Backpack 呼叫，供 parent 顯示落地動效 */
  onSlotPlaced?: (toIndex: number) => void;
}

/** 拖曳用 ghost：與道具小框同尺寸（欄位邊框內縮 1px 的小框） */
const SLOT_BORDER_PX = 2;
const ITEM_BOX_GAP_PX = 1;
const SLOT_OUTER_PX = 64;
const ITEM_BOX_SIZE_PX = SLOT_OUTER_PX - SLOT_BORDER_PX * 2 - ITEM_BOX_GAP_PX * 2;

function createGhostEl(itemName: string, count: number): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('data-drag-ghost', 'true');
  el.style.cssText = [
    `position:fixed`,
    `left:0`,
    `top:0`,
    `width:${ITEM_BOX_SIZE_PX}px`,
    `height:${ITEM_BOX_SIZE_PX}px`,
    `margin:0`,
    `padding:4px`,
    `box-sizing:border-box`,
    `display:flex`,
    `flex-direction:column`,
    `align-items:center`,
    `justify-content:center`,
    `pointer-events:none`,
    `z-index:2147483647`,
    `border:1pt solid var(--color-primary)`,
    `background:var(--color-panel)`,
    `color:var(--color-text-default)`,
    `transform:translate(-50%,-50%)`,
    `border-radius:6px`,
    `box-shadow:0 10px 15px -3px rgba(0,0,0,0.2)`,
    `font-size:12px`,
  ].join(';');
  const span = document.createElement('span');
  span.style.cssText = 'text-align:center;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';
  span.textContent = itemName;
  el.appendChild(span);
  if (count > 1) {
    const badge = document.createElement('span');
    badge.style.cssText = 'position:absolute;bottom:2px;right:4px;font-size:12px;';
    badge.textContent = String(count);
    el.appendChild(badge);
  }
  return el;
}

export function Backpack({
  slots,
  capacity,
  onMoveSlot,
  onDragEnd,
  onDragMove,
  onDragEndOrCancel,
  highlightItemId,
  lastPlacedSlotIndex = null,
  onSlotPlaced,
}: BackpackProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [, setDragStart] = useState<{ x: number; y: number; index: number } | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [, setDidDrag] = useState(false);
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef(slots);
  const capacityRef = useRef(capacity);
  const onMoveSlotRef = useRef(onMoveSlot);
  const onDragEndRef = useRef(onDragEnd);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndOrCancelRef = useRef(onDragEndOrCancel);
  const onSlotPlacedRef = useRef(onSlotPlaced);
  slotsRef.current = slots;
  onSlotPlacedRef.current = onSlotPlaced;
  capacityRef.current = capacity;
  onMoveSlotRef.current = onMoveSlot;
  onDragEndRef.current = onDragEnd;
  onDragMoveRef.current = onDragMove;
  onDragEndOrCancelRef.current = onDragEndOrCancel;

  const removeGhost = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
      ghostElRef.current = null;
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (!slots[index]) return;
    const start = { x: e.clientX, y: e.clientY, index };
    if (DRAG_DEBUG) console.log('[Backpack] pointer down', index, start);
    setDragStart(start);
    setDidDrag(false);
    removeGhost();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    let ghostCreated = false;
    let moveCount = 0;
    const cap = capacityRef.current;
    const currentSlots = slotsRef.current;

    const onDocPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      const dist = Math.hypot(dx, dy);
      const overThreshold = dist >= DRAG_THRESHOLD;
      if (overThreshold) {
        if (!ghostCreated) {
          ghostCreated = true;
          if (DRAG_DEBUG) console.log('[Backpack] threshold passed, creating ghost');
          setDraggingIndex(start.index);
          setDidDrag(true);
          const slot = currentSlots[start.index];
          const item = slot ? getItem(slot.itemId) : null;
          if (slot && item) {
            const ghost = createGhostEl(item.name, slot.count);
            ghost.style.left = `${moveEvent.clientX}px`;
            ghost.style.top = `${moveEvent.clientY}px`;
            document.body.appendChild(ghost);
            ghostElRef.current = ghost;
            if (DRAG_DEBUG) console.log('[Backpack] ghost appended to body', !!document.body.contains(ghost));
          }
        }
        if (ghostElRef.current) {
          ghostElRef.current.style.left = `${moveEvent.clientX}px`;
          ghostElRef.current.style.top = `${moveEvent.clientY}px`;
          if (DRAG_DEBUG && (moveCount++ % 20 === 0)) {
            console.log('[Backpack] ghost position', moveEvent.clientX, moveEvent.clientY);
          }
        }
        onDragMoveRef.current?.(moveEvent.clientX, moveEvent.clientY);
        setDidDrag(true);
        const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const slotEl = el?.closest('[data-slot-index]');
        const toIndex = slotEl ? parseInt(slotEl.getAttribute('data-slot-index') ?? '-1', 10) : -1;
        if (toIndex >= 0 && toIndex < cap) setOverIndex(toIndex);
        else setOverIndex(null);
      }
    };

    const onDocPointerUp = (upEvent: PointerEvent) => {
      document.removeEventListener('pointermove', onDocPointerMove, true);
      document.removeEventListener('pointerup', onDocPointerUp, true);
      document.removeEventListener('pointercancel', onDocPointerUp, true);
      onDragEndOrCancelRef.current?.();
      if (DRAG_DEBUG) console.log('[Backpack] pointer up', ghostCreated);
      if (ghostCreated) {
        const el = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const slotEl = el?.closest('[data-slot-index]');
        const toIndex = slotEl ? parseInt(slotEl.getAttribute('data-slot-index') ?? '-1', 10) : -1;
        if (toIndex >= 0 && toIndex !== start.index) {
          onMoveSlotRef.current(start.index, toIndex);
          onSlotPlacedRef.current?.(toIndex);
        } else onDragEndRef.current?.(start.index, upEvent.clientX, upEvent.clientY);
      }
      removeGhost();
      setDraggingIndex(null);
      setDragStart(null);
      setOverIndex(null);
      setDidDrag(false);
    };

    document.addEventListener('pointermove', onDocPointerMove, true);
    document.addEventListener('pointerup', onDocPointerUp, true);
    document.addEventListener('pointercancel', onDocPointerUp, true);
  };

  const handlePointerUp = () => {
    removeGhost();
    setDraggingIndex(null);
    setDragStart(null);
    setOverIndex(null);
    setDidDrag(false);
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 justify-center">
      {Array.from({ length: capacity }, (_, i) => {
        const slot = slots[i];
        const item = slot ? getItem(slot.itemId) : null;
        const isDragging = draggingIndex === i;
        const isOver = overIndex === i;
        const isHighlight = !!item && highlightItemId === item.id;
        return (
          <div
            key={i}
            data-slot-index={i}
            className={`w-16 h-16 rounded-lg border-[1pt] border-solid flex flex-col items-center justify-center text-sm font-medium text-[var(--color-text-default)] select-none touch-none relative bg-[var(--color-panel-muted)] transition-[border-color,background,box-shadow] duration-150 ${
              isHighlight ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
            } ${lastPlacedSlotIndex === i ? 'animate-slot-landing' : ''}`}
            style={{
              borderColor: isOver ? 'var(--color-primary)' : undefined,
              ...(isOver
                ? { background: 'var(--color-primary-25)', boxShadow: '0 0 10px var(--color-primary-50)' }
                : isHighlight && item
                  ? { background: 'var(--color-primary-25)', boxShadow: '0 0 8px var(--color-primary-50)' }
                  : {}),
            }}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {item ? (
              <div
                className={`absolute inset-px rounded-md border-[1pt] border-solid flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-[var(--color-border)] bg-[var(--color-panel-muted)] ${
                  isHighlight ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)]' : ''
                }`}
                style={{ opacity: isDragging ? 0.5 : 1 }}
                onPointerDown={(e) => handlePointerDown(e, i)}
              >
                <span title={item.name} className="leading-tight px-0.5 text-center break-words line-clamp-2 text-xs max-w-full">
                  {item.name}
                </span>
                {slot && slot.count > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-xs">{slot.count}</span>
                )}
              </div>
            ) : (
              <span className="text-[var(--color-text-muted)] text-xs">空</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
