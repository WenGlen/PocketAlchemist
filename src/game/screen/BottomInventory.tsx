//════════════════════════════════════════════════════════════════
// 底部道具欄
//════════════════════════════════════════════════════════════════
// 左：手持裝備欄  中：背包  右：技能按鈕
// 延伸面板（合成、加工等）統一從底部向上展開

import type { ReactNode } from 'react';
import { Backpack } from '../../items/inventory/Backpack';
import { EquipmentSlots } from '../../items/equipment/EquipmentSlots';
import { SkillButtons } from '../../items/equipment/SkillButtons';
import type { SlotItem } from '../../items/inventory/useBackpack';
import type { DropTargetFromBackpack } from '../../items/inventory/Backpack';
import type { SkillButtonConfig } from '../../items/equipment/SkillButtons';

// ========== 型別 ==========

export interface PanelConfig {
  panelId: string;
  maxHeight: number;
  content: ReactNode;
}

// ========== Props ==========

interface BottomInventoryProps {
  // 背包
  slots: (SlotItem | null)[];
  capacity: number;
  onMoveSlot: (from: number, to: number) => void;
  // 裝備欄
  equipSlots: (SlotItem | null)[];
  equipDropTargetIndex?: number | null;
  onUnequip?: (index: number) => void;
  // 技能按鈕與面板
  skillButtonConfigs: (SkillButtonConfig | null)[];
  activePanelId: string | null;
  onSetActivePanelId: (id: string | null) => void;
  panelContents: Record<string, PanelConfig>;
  // 拖曳
  onDragEndFromBackpack?: (backpackSlotIndex: number, clientX: number, clientY: number) => void;
  onDragMoveFromBackpack?: (clientX: number, clientY: number) => void;
  onDragEndOrCancelFromBackpack?: () => void;
  dropTarget?: DropTargetFromBackpack | null;
  // 高亮與動效
  highlightItemId?: string | null;
  lastPlacedSlotIndex?: number | null;
  onSlotPlaced?: (toIndex: number) => void;
}

// ========== 元件 ==========

export function BottomInventory({
  slots,
  capacity,
  onMoveSlot,
  equipSlots,
  equipDropTargetIndex = null,
  onUnequip,
  skillButtonConfigs,
  activePanelId,
  onSetActivePanelId,
  panelContents,
  onDragEndFromBackpack,
  onDragMoveFromBackpack,
  onDragEndOrCancelFromBackpack,
  lastPlacedSlotIndex,
  onSlotPlaced,
  highlightItemId,
}: BottomInventoryProps) {
  const handleTogglePanel = (panelId: string) => {
    onSetActivePanelId(activePanelId === panelId ? null : panelId);
  };

  const activePanel = activePanelId ? panelContents[activePanelId] ?? null : null;

  return (
    <div className="flex-shrink-0 relative bg-[var(--color-panel)] border-t border-[var(--color-border)]">
      {/* 延伸面板：向上展開（合成、加工等共用容器） */}
      {activePanel && (
        <div
          className="absolute left-0 right-0 bottom-full z-20 bg-[var(--color-panel)] border border-[var(--color-border)] rounded-t-lg shadow-lg overflow-hidden"
          style={{ maxHeight: activePanel.maxHeight, minHeight: 100 }}
        >
          {activePanel.content}
        </div>
      )}

      {/* 主列：裝備欄 ╱ 背包格 ╱ 技能按鈕 */}
      <div className="flex flex-row items-center justify-center px-2">
        <EquipmentSlots
          slots={equipSlots}
          dropTargetIndex={equipDropTargetIndex}
          onUnequip={onUnequip}
        />
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
        <SkillButtons
          configs={skillButtonConfigs}
          activePanelId={activePanelId}
          onToggle={handleTogglePanel}
        />
      </div>
    </div>
  );
}
