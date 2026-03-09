//════════════════════════════════════════════════════════════════
// 加工面板
//════════════════════════════════════════════════════════════════
// 素材槽（1 格）+ 結果預覽 + 加工按鈕
// 與合成面板共用同一套展開機制，僅內容不同

import { useRef, useCallback } from 'react';
import { getItem } from '../../data/itemsTable';
import { matchProcessRecipe } from './processRecipes';
import type { SlotItem } from '../useBackpack';
import {
  ITEM_BOX_SIZE_PX,
  DRAG_THRESHOLD_PX,
  DRAG_GHOST_Z_INDEX,
} from '../../inventoryConstants';

// ========== 工具函數 ==========

function createGhostEl(emoji: string, name: string): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('data-drag-ghost', 'true');
  el.style.cssText = [
    `position:fixed`, `left:0`, `top:0`,
    `width:${ITEM_BOX_SIZE_PX}px`, `height:${ITEM_BOX_SIZE_PX}px`,
    `display:flex`, `flex-direction:column`, `align-items:center`, `justify-content:flex-start`,
    `pointer-events:none`, `z-index:${DRAG_GHOST_Z_INDEX}`,
    `border:1pt solid var(--color-primary)`,
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

// ========== Props ==========

interface ProcessingPanelProps {
  slots: (SlotItem | null)[];
  onProcess: (outputItemId: string, outputCount: number, inputSlotIndex: number) => void;
  onDragEndFromProcessing?: (processingSlotIndex: number, clientX: number, clientY: number) => void;
  dragOverProcessingSlotIndex?: number | null;
  justProcessed?: boolean;
}

// ========== 元件 ==========

export function ProcessingPanel({
  slots,
  onProcess,
  onDragEndFromProcessing,
  dragOverProcessingSlotIndex = null,
  justProcessed = false,
}: ProcessingPanelProps) {
  const ghostElRef = useRef<HTMLDivElement | null>(null);
  const onDragEndRef = useRef(onDragEndFromProcessing);
  onDragEndRef.current = onDragEndFromProcessing;

  const removeGhost = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
      ghostElRef.current = null;
    }
  }, []);

  const slot = slots[0] ?? null;
  const item = slot ? getItem(slot.itemId) : null;
  const recipe = item ? matchProcessRecipe(item.id) : null;
  const outputItem = recipe ? getItem(recipe.output.itemId) : null;

  const handleSlotPointerDown = (e: React.PointerEvent, i: number) => {
    if (!slots[i]) return;
    const start = { x: e.clientX, y: e.clientY, index: i };
    removeGhost();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    let ghostCreated = false;
    const currentSlots = [...slots];

    const onDocPointerMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y);
      if (dist >= DRAG_THRESHOLD_PX) {
        if (!ghostCreated) {
          ghostCreated = true;
          const s = currentSlots[start.index];
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

    const onDocPointerUp = (upEvent: PointerEvent) => {
      document.removeEventListener('pointermove', onDocPointerMove);
      document.removeEventListener('pointerup', onDocPointerUp);
      document.removeEventListener('pointercancel', onDocPointerUp);
      if (ghostCreated) {
        onDragEndRef.current?.(start.index, upEvent.clientX, upEvent.clientY);
      }
      removeGhost();
    };

    document.addEventListener('pointermove', onDocPointerMove);
    document.addEventListener('pointerup', onDocPointerUp);
    document.addEventListener('pointercancel', onDocPointerUp);
  };

  return (
    <div className="flex flex-col gap-3 p-3 items-center">
      <div className="flex items-center gap-2 justify-center">
        {/* 輸入槽 */}
        <div
          data-processing-slot
          data-processing-slot-index={0}
          className={`w-16 h-16 rounded-lg border-[1pt] border-solid flex flex-col items-center justify-center text-xs text-[var(--color-text-default)] select-none touch-none relative transition-[border-color,background,box-shadow] duration-150 ${
            dragOverProcessingSlotIndex === 0
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] shadow-[0_0_10px_var(--color-primary-50)]'
              : 'border-[var(--color-border)] bg-[var(--color-panel-muted)]'
          }`}
        >
          {item ? (
            <div
              className="absolute inset-px rounded-md border-[1pt] border-solid border-[var(--color-border)] bg-[var(--color-panel-muted)] flex flex-col items-stretch justify-start overflow-hidden cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => handleSlotPointerDown(e, 0)}
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
            <span className="text-[var(--color-text-muted)]">素材</span>
          )}
        </div>

        <span className="text-[var(--color-text-muted)] text-sm">→</span>

        {/* 輸出預覽：有配方時可直接點擊觸發加工 */}
        <div
          role={outputItem ? 'button' : undefined}
          tabIndex={outputItem ? 0 : undefined}
          onClick={() => recipe && onProcess(recipe.output.itemId, recipe.output.count, 0)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); recipe && onProcess(recipe.output.itemId, recipe.output.count, 0); } }}
          className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center min-w-[4rem] text-center transition-[transform,box-shadow] duration-100 ${
            outputItem
              ? `border-[3px] border-[var(--color-primary)] bg-[var(--color-primary-25)] shadow-[0_0_16px_var(--color-primary-50)] cursor-pointer active:scale-95 ${justProcessed ? 'animate-craft-result-glow' : ''}`
              : 'border-2 border-[var(--color-border)] bg-[var(--color-panel-50)]'
          }`}
        >
          {outputItem ? (
            <>
              <div className="text-[22px] leading-none">{outputItem.emoji}</div>
              <span className="text-[8px] text-[var(--color-text-muted)] leading-tight px-0.5 break-all line-clamp-2 text-center">
                {outputItem.name}
              </span>
            </>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">?</span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!recipe}
        onClick={() => recipe && onProcess(recipe.output.itemId, recipe.output.count, 0)}
        className="py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
      >
        加工
      </button>
    </div>
  );
}
