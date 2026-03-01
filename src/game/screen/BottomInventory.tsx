//════════════════════════════════════════════════════════════════
// 底部道具欄
//════════════════════════════════════════════════════════════════
// 背包 + 合成面板的容器元件

import { Backpack } from '../../items/inventory/Backpack';
import { SynthesisPanel } from '../../items/inventory/synthesis/SynthesisPanel';
import type { SlotItem } from '../../items/inventory/useBackpack';
import type { DropTargetFromBackpack } from '../../items/inventory/Backpack';

// ========== Props ==========

interface BottomInventoryProps {
  slots: (SlotItem | null)[];
  capacity: number;
  onMoveSlot: (from: number, to: number) => void;
  synthesisSlots: (SlotItem | null)[];
  onSetSynthesisSlot: (index: number, item: SlotItem | null) => void;
  onCraft: (resultItemId: string, resultCount: number) => void;
  onDragEndFromBackpack?: (backpackSlotIndex: number, clientX: number, clientY: number) => void;
  onDragEndFromSynthesis?: (synthesisSlotIndex: number, clientX: number, clientY: number) => void;
  onDragMoveFromBackpack?: (clientX: number, clientY: number) => void;
  onDragEndOrCancelFromBackpack?: () => void;
  dropTarget?: DropTargetFromBackpack | null;
  lastPlacedSlotIndex?: number | null;
  onSlotPlaced?: (toIndex: number) => void;
  highlightItemId?: string | null;
  synthesisExpanded?: boolean;
  onSynthesisExpandedChange?: (expanded: boolean) => void;
  synthesisButtonDisabled?: boolean;
  justCrafted?: boolean;  // 剛合成成功，結果格播發光動效
}

export function BottomInventory({
  slots,
  capacity,
  onMoveSlot,
  synthesisSlots,
  onSetSynthesisSlot,
  onCraft,
  onDragEndFromBackpack,
  onDragEndFromSynthesis,
  onDragMoveFromBackpack,
  onDragEndOrCancelFromBackpack,
  dropTarget,
  lastPlacedSlotIndex,
  onSlotPlaced,
  highlightItemId,
  synthesisExpanded = false,
  onSynthesisExpandedChange,
  synthesisButtonDisabled = false,
  justCrafted = false,
}: BottomInventoryProps) {
  return (
    <div className="flex-shrink-0 relative bg-[var(--color-panel)] border-t border-[var(--color-border)]">
      <div className="flex flex-row gap-2 px-2 py-2 border-b border-[var(--color-border)]">
        <button
          type="button"
          disabled={synthesisButtonDisabled}
          className="flex-1 py-2 px-4 rounded-lg bg-[var(--color-btn)] text-[var(--color-btn-text)] text-sm font-medium hover:bg-[var(--color-btn-hover)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-btn)] disabled:active:scale-100"
          onClick={() => onSynthesisExpandedChange?.(!synthesisExpanded)}
          aria-expanded={synthesisExpanded}
        >
          {synthesisExpanded ? '收起合成 ▼' : '合成 ▲'}
        </button>
        {/* 預留其他功能按鈕 */}
      </div>
      {/* 道具欄：背包 */}
      <div className="px-2 pt-2 pb-2">
        <span className="text-xs text-[var(--color-text-muted)] block mb-1">背包</span>
        <Backpack
          slots={slots}
          capacity={capacity}
          onMoveSlot={onMoveSlot}
          onDragEnd={onDragEndFromBackpack}
          onDragMove={onDragMoveFromBackpack}
          onDragEndOrCancel={onDragEndOrCancelFromBackpack}
          highlightItemId={highlightItemId}
          lastPlacedSlotIndex={lastPlacedSlotIndex}
          onSlotPlaced={onSlotPlaced}
        />
      </div>

      {/* 合成面板：從道具欄「向上」延伸的浮層，z-index 低於對話視窗 */}
      {synthesisExpanded && (
        <div
          className="absolute left-0 right-0 bottom-full mb-0 z-20 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-t-lg shadow-lg overflow-hidden transition-[max-height] duration-200 max-h-52"
          style={{ minHeight: 140 }}
        >
          <SynthesisPanel
            slots={synthesisSlots}
            onSetSlot={onSetSynthesisSlot}
            onCraft={onCraft}
            onDragEndFromSynthesis={onDragEndFromSynthesis}
            dragOverSynthesisSlotIndex={dropTarget?.type === 'synthesis' ? dropTarget.index : null}
            justCrafted={justCrafted}
          />
        </div>
      )}
    </div>
  );
}
