import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from './useGameState';
import { useBackpack } from '../items/inventory/useBackpack';
import { TopBar } from '../env/layout/panels/TopBar';
import { MapArea } from '../env/layout/panels/MapArea';
import { BottomInventory } from '../env/layout/panels/BottomInventory';
import { DialoguePanel } from '../objects/npc/DialoguePanel';
import { getObject } from '../objects/data/objectTable';
import { ITM_MAT_0001 } from '../items/data/itemTable';
import type { SlotItem } from '../items/inventory/useBackpack';
import type { DropTargetFromBackpack } from '../items/inventory/Backpack';
import { QST_MAIN_001 } from '../quests/data/questData';
import { getResourceNode } from '../objects/data/resourceNodes';
import { interactionConfig } from '../config/interactionConfig';

const PLACE_FEEDBACK_MS = 180;
const QUEST_CELEBRATION_MS = 2200;
const RESOURCE_FEEDBACK_MS = 800;

export function GameScreen() {
  const game = useGameState();
  const backpack = useBackpack({
    capacity: 10,
    initialSlots: [{ itemId: ITM_MAT_0001.id, count: 1 }, { itemId: ITM_MAT_0001.id, count: 1 }],
  });

  const [synthesisSlots, setSynthesisSlots] = useState<(SlotItem | null)[]>([null, null]);
  const [synthesisExpanded, setSynthesisExpanded] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetFromBackpack>(null);
  const [lastPlacedSlotIndex, setLastPlacedSlotIndex] = useState<number | null>(null);
  const [justCrafted, setJustCrafted] = useState(false);
  const [teaTreeGatherKey, setTeaTreeGatherKey] = useState(0);
  const [lakeJustFilled, setLakeJustFilled] = useState(false);
  const [showQuestCompleteCelebration, setShowQuestCompleteCelebration] = useState(false);
  const synthesisSlotsRef = useRef(synthesisSlots);
  synthesisSlotsRef.current = synthesisSlots;
  const backpackRef = useRef(backpack);
  backpackRef.current = backpack;

  // 跟 NPC 對話或移動時強制收合合成視窗，並把合成欄位內道具歸還背包（不依賴 backpack 避免無限迴圈）
  useEffect(() => {
    if (game.moveDirection.x !== 0 || game.moveDirection.y !== 0) {
      synthesisSlotsRef.current.forEach((s) => {
        if (s) backpackRef.current.addItem(s.itemId, s.count);
      });
      setSynthesisSlots([null, null]);
      setSynthesisExpanded(false);
    }
  }, [game.moveDirection.x, game.moveDirection.y]);

  const npc = game.dialogueNpcId ? getObject(game.dialogueNpcId) : null;
  const quest = QST_MAIN_001;

  const lakeNode = getResourceNode('OBJ-res-002');
  const distToLake =
    lakeNode && game.playerPosition
      ? Math.hypot(
          game.playerPosition.x - lakeNode.x,
          game.playerPosition.y - lakeNode.y
        )
      : Infinity;
  const nearLake = distToLake <= interactionConfig.interactionRange;
  const highlightItemId =
    nearLake && backpack.hasItem(ITM_MAT_0001.id) ? ITM_MAT_0001.id : null;

  const handleShowControlRing = (x: number, y: number) => {
    game.showControlRing(x, y);
  };

  /** 收合合成時把合成欄位內的道具全部歸還背包，再關閉 */
  const flushSynthesisToBackpackAndClose = useCallback(() => {
    synthesisSlotsRef.current.forEach((s) => {
      if (s) backpack.addItem(s.itemId, s.count);
    });
    setSynthesisSlots([null, null]);
    setSynthesisExpanded(false);
  }, [backpack]);

  const handleTapNpc = (npcId: string) => {
    flushSynthesisToBackpackAndClose();
    game.openDialogue(npcId);
  };

  const setSynthesisSlot = useCallback((index: number, item: { itemId: string; count: number } | null) => {
    setSynthesisSlots((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const handleCraft = useCallback(
    (resultItemId: string, resultCount: number) => {
      backpack.addItem(resultItemId, resultCount);
      setJustCrafted(true);
    },
    [backpack]
  );

  useEffect(() => {
    if (!justCrafted) return;
    const t = setTimeout(() => {
      setJustCrafted(false);
      setSynthesisSlots([null, null]);
    }, 450);
    return () => clearTimeout(t);
  }, [justCrafted]);

  useEffect(() => {
    if (lastPlacedSlotIndex == null) return;
    const t = setTimeout(() => setLastPlacedSlotIndex(null), PLACE_FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [lastPlacedSlotIndex]);

  useEffect(() => {
    if (!lakeJustFilled) return;
    const t = setTimeout(() => setLakeJustFilled(false), RESOURCE_FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [lakeJustFilled]);

  useEffect(() => {
    if (!showQuestCompleteCelebration) return;
    const t = setTimeout(() => setShowQuestCompleteCelebration(false), QUEST_CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [showQuestCompleteCelebration]);

  const handleDragMoveFromBackpack = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const synth = el?.closest('[data-synthesis-slot]');
    const delivery = el?.closest('[data-delivery-zone]');
    const resource = el?.closest('[data-resource-drop]');
    const slot = el?.closest('[data-slot-index]');
    if (synth) {
      const i = parseInt(synth.getAttribute('data-synthesis-slot-index') ?? '0', 10);
      setDropTarget({ type: 'synthesis', index: i });
    } else if (delivery) setDropTarget({ type: 'delivery' });
    else if (resource) setDropTarget({ type: 'resource', id: resource.getAttribute('data-resource-drop') ?? '' });
    else if (slot) setDropTarget({ type: 'backpack', index: parseInt(slot.getAttribute('data-slot-index') ?? '-1', 10) });
    else setDropTarget(null);
  }, []);

  const handleDragEndOrCancelFromBackpack = useCallback(() => setDropTarget(null), []);

  const handleDragEndFromBackpack = useCallback(
    (backpackSlotIndex: number, clientX: number, clientY: number) => {
      const item = backpack.slots[backpackSlotIndex];
      if (!item) return;

      const el = document.elementFromPoint(clientX, clientY);
      const synthSlot = el?.closest('[data-synthesis-slot]');
      const deliveryZone = el?.closest('[data-delivery-zone]');
      const resourceDrop = el?.closest('[data-resource-drop]');
      const resourceId = resourceDrop?.getAttribute('data-resource-drop');

      if (synthSlot) {
        const slotIndex = parseInt(
          synthSlot.getAttribute('data-synthesis-slot-index') ?? '0',
          10
        );
        const current = synthesisSlots[slotIndex];
        if (current) backpack.addItem(current.itemId, current.count);
        setSynthesisSlot(slotIndex, { itemId: item.itemId, count: 1 });
        backpack.removeItem(backpackSlotIndex, 1);
      }

      if (deliveryZone && game.questPhase === 'accepted' && quest) {
        if (item.itemId === quest.deliverItemId) {
          game.completeQuest();
          backpack.removeItem(backpackSlotIndex, 1);
          setDeliveryMessage(null);
          setShowQuestCompleteCelebration(true);
        } else {
          setDeliveryMessage('這不是我要的，請拿「不好喝的茶」來。');
        }
      }

      // 拖曳玻璃瓶到湖裡裝水（僅支援拖曳；須在互動範圍內）
      if (resourceId && nearLake) {
        const node = getResourceNode(resourceId);
        if (node?.kind === 'lake' && node.requireItemId && item.itemId === node.requireItemId && node.resultItemId) {
          backpack.removeItem(backpackSlotIndex, 1);
          backpack.addItem(node.resultItemId, 1);
          setLakeJustFilled(true);
        }
      }
    },
    [backpack, game.questPhase, game, quest, synthesisSlots, setSynthesisSlot, nearLake]
  );

  const handleDragEndFromSynthesis = useCallback(
    (synthesisSlotIndex: number, clientX: number, clientY: number) => {
      const slotItem = synthesisSlots[synthesisSlotIndex];
      if (!slotItem) return;

      const el = document.elementFromPoint(clientX, clientY);
      const backpackSlot = el?.closest('[data-slot-index]');
      if (backpackSlot) {
        const toIndex = parseInt(backpackSlot.getAttribute('data-slot-index') ?? '-1', 10);
        backpack.addItem(slotItem.itemId, slotItem.count);
        setSynthesisSlot(synthesisSlotIndex, null);
        if (toIndex >= 0) setLastPlacedSlotIndex(toIndex);
      }
    },
    [backpack, synthesisSlots, setSynthesisSlot]
  );

  const handleTapResource = useCallback(
    (nodeId: string) => {
      const node = getResourceNode(nodeId);
      if (!node) return;
      if (node.kind === 'tea_tree' && game.getTeaTreeRemaining() > 0) {
        game.tryGatherTea();
        backpack.addItem(node.gatherItemId!, 1);
        setTeaTreeGatherKey((k) => k + 1);
      }
    },
    [game, backpack]
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[var(--color-bg)]">
      <div className="game-layout flex flex-col">
        <TopBar />
        <div className="flex flex-col flex-1 min-h-0 relative">
          <MapArea
            mapId={game.mapId}
            playerPosition={game.playerPosition}
            controlRing={game.controlRing}
            mapLocked={game.mapLocked}
            moveDirection={game.moveDirection}
            onShowControlRing={handleShowControlRing}
            onHideControlRing={game.hideControlRing}
            onMoveDirection={game.setMoveDirection}
            onTapNpc={handleTapNpc}
            onTapResource={handleTapResource}
            teaTreeRemaining={game.getTeaTreeRemaining()}
            dropTargetResourceId={dropTarget?.type === 'resource' ? dropTarget.id : null}
            teaTreeGatherKey={teaTreeGatherKey}
            lakeJustFilled={lakeJustFilled}
          />
          {/* 對話時地圖半透明黑色遮罩，擋住地圖操作 */}
          {game.dialogueOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-30 pointer-events-auto"
              aria-hidden
            />
          )}
          {/* 對話時左側人物立繪站位（暫用半透明方塊 + 名稱）；外層 w-full 讓內層 50% 有可參照的寬度 */}
          {game.dialogueOpen && npc && (
            <div className="absolute inset-0 z-50 flex items-center pointer-events-none">
              <div className="w-1/2 h-[60%] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-25)]/80 flex items-center justify-center">
                <span className="text-sm text-[var(--color-text-default)] text-center">
                  {npc.displayName}
                </span>
              </div>
            </div>
          )}
          {game.dialogueOpen && npc && (
            <DialoguePanel
              npcName={npc.displayName}
              dialogueKey={npc.dialogueKey}
              onClose={() => {
                game.closeDialogue();
                setDeliveryMessage(null);
              }}
              questPhase={game.questPhase}
              quest={quest}
              onAcceptQuest={game.acceptQuest}
              deliveryZoneHighlight={dropTarget?.type === 'delivery'}
            />
          )}
          {deliveryMessage && (
            <div className="absolute bottom-2 left-2 right-2 py-2 px-3 rounded bg-[var(--color-panel)] border border-[var(--color-text-error)] text-[var(--color-text-error)] text-sm text-center">
              {deliveryMessage}
            </div>
          )}
        </div>
        <BottomInventory
          slots={backpack.slots}
          capacity={backpack.capacity}
          onMoveSlot={backpack.moveSlot}
          synthesisSlots={synthesisSlots}
          onSetSynthesisSlot={setSynthesisSlot}
          onCraft={handleCraft}
          onDragEndFromBackpack={handleDragEndFromBackpack}
          onDragEndFromSynthesis={handleDragEndFromSynthesis}
          onDragMoveFromBackpack={handleDragMoveFromBackpack}
          onDragEndOrCancelFromBackpack={handleDragEndOrCancelFromBackpack}
          dropTarget={dropTarget}
          lastPlacedSlotIndex={lastPlacedSlotIndex}
          onSlotPlaced={(toIndex) => setLastPlacedSlotIndex(toIndex)}
          highlightItemId={highlightItemId}
          synthesisExpanded={synthesisExpanded}
          onSynthesisExpandedChange={(expanded) =>
            expanded ? setSynthesisExpanded(true) : flushSynthesisToBackpackAndClose()
          }
          synthesisButtonDisabled={game.dialogueOpen}
          justCrafted={justCrafted}
        />
      </div>

      {showQuestCompleteCelebration && quest && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div className="animate-quest-complete rounded-xl bg-[var(--color-panel)] border-2 border-[var(--color-primary)] px-8 py-6 shadow-lg flex flex-col items-center gap-2">
            <span className="text-xl font-bold text-[var(--color-primary)]">任務完成</span>
            <span className="text-sm text-[var(--color-text-default)]">{quest.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
