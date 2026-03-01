//════════════════════════════════════════════════════════════════
// 遊戲主畫面
//════════════════════════════════════════════════════════════════
// 整合 TopBar、StatsBar、MapArea、BottomInventory
// 處理任務進度、合成、背包、對話等互動邏輯

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameState } from './useGameState';
import { playSound } from '../assets/audio';
import { useBackpack } from '../items/inventory/useBackpack';
import { TopBar } from './screen/TopBar';
import { StatsBar } from './screen/StatsBar';
import { MapArea, hitTest } from './screen/MapArea';
import { useMapContent } from './screen/useMapContent';
import { BottomInventory } from './screen/BottomInventory';
import { DialoguePanel } from '../objects/npc/DialoguePanel';
import { getObject, getResourceNode, getResourceNodesRequiringItem, getGatherLimitForNode, getLabTerrain } from '../objects/data/objectsTable';
import { ITM_MAT_0001, getItem } from '../items/data/itemsTable';
import type { SlotItem } from '../items/inventory/useBackpack';
import type { DropTargetFromBackpack } from '../items/inventory/Backpack';
import { QST_MAIN_001, getQuest, getCurrentStep, getBubbleDisplay, getCompleteMessage, getStartStep } from '../quests/data/questData';
import { interactionConfig } from './interactionConfig';
import { PLACE_FEEDBACK_MS, QUEST_CELEBRATION_MS, CRAFT_CLEAR_DELAY_MS } from '../objects/objectsConstants';
import { BACKPACK_CAPACITY } from '../items/inventoryConstants';
import { getDisplayStats } from './screen/statsConfig';
import { missionList } from '../quests/data/missionList';

// ========== 工具函數 ==========

// 初始背包：玻璃瓶不可堆疊，每瓶一格
function getInitialSlotsForMap(_mapId: string): { itemId: string; count: number }[] {
  const bottle = { itemId: ITM_MAT_0001.id, count: 1 };
  return [bottle, bottle];
}

export function GameScreen() {
  const game = useGameState();
  const initialSlots = useMemo(
    () => getInitialSlotsForMap(game.mapId),
    [game.mapId, game.missionResetKey]
  );
  const backpack = useBackpack({
    capacity: BACKPACK_CAPACITY,
    initialSlots,
    resetKey: game.missionResetKey,
  });

  const [synthesisSlots, setSynthesisSlots] = useState<(SlotItem | null)[]>([null, null]);
  const [synthesisExpanded, setSynthesisExpanded] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetFromBackpack>(null);
  const [lastPlacedSlotIndex, setLastPlacedSlotIndex] = useState<number | null>(null);
  const [justCrafted, setJustCrafted] = useState(false);
  const [showQuestCompleteCelebration, setShowQuestCompleteCelebration] = useState(false);
  const synthesisSlotsRef = useRef(synthesisSlots);
  synthesisSlotsRef.current = synthesisSlots;
  const backpackRef = useRef(backpack);
  backpackRef.current = backpack;
  const screenToWorldRef = useRef<((clientX: number, clientY: number) => { x: number; y: number }) | null>(null);  // 拖曳時需要與點擊相同的座標換算與判定目標，避免 stale closure
  const hitTestTargetsRef = useRef<{ resources: { id: string; x: number; y: number; radius: number }[] }>({ resources: [] });

  // ── 副作用 ─────────────────────────────────────────────────────

  // 切換／重新開始任務時重置本畫面狀態
  useEffect(() => {
    setSynthesisSlots([null, null]);
    setSynthesisExpanded(false);
    setDeliveryMessage(null);
    setDropTarget(null);
    setShowQuestCompleteCelebration(false);
  }, [game.missionResetKey]);

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
  const quest = getQuest(game.selectedQuestId) ?? QST_MAIN_001;
  const currentStep = getCurrentStep(quest, game.questStepIndex);
  const bubble = getBubbleDisplay(quest, game.questPhase, game.questStepIndex, currentStep);

  // 依資源點定義統一判斷：需道具互動的節點（如湖邊、水源）用 interactionRange，有對應道具即高亮
  const range = interactionConfig.interactionRange;
  const nodesRequiringItem = getResourceNodesRequiringItem(game.mapId);
  const nodeToHighlight = game.playerPosition && nodesRequiringItem.find((node) => {
    const dist = Math.hypot(
      game.playerPosition!.x - node.x,
      game.playerPosition!.y - node.y
    );
    return dist <= range && node.requireItemId != null && backpack.hasItem(node.requireItemId);
  });
  const highlightItemId = nodeToHighlight?.requireItemId ?? null;

  const displayStats = useMemo(
    () => getDisplayStats(game.mapId, { hp: game.hp, hpMax: game.hpMax }),
    [game.mapId, game.hp, game.hpMax]
  );

  const handleShowControlRing = (x: number, y: number) => {
    game.showControlRing(x, y);
  };

  // ── 互動處理 ─────────────────────────────────────────────────

  // 收合合成時把合成欄位內的道具全部歸還背包，再關閉
  const flushSynthesisToBackpackAndClose = useCallback(() => {
    synthesisSlotsRef.current.forEach((s) => {
      if (s) backpack.addItem(s.itemId, s.count);
    });
    setSynthesisSlots([null, null]);
    setSynthesisExpanded(false);
  }, [backpack]);

  const handleTapNpc = (npcId: string) => {
    flushSynthesisToBackpackAndClose();
    if (game.questPhase === 'none' && quest && npcId !== getStartStep(quest)?.entityId) return;
    if (game.questPhase === 'completed' && quest) return;
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
      playSound('synthesize');
      setJustCrafted(true);
    },
    [backpack]
  );

  useEffect(() => {
    if (!justCrafted) return;
    const t = setTimeout(() => {
      setJustCrafted(false);
      setSynthesisSlots([null, null]);
    }, CRAFT_CLEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [justCrafted]);

  useEffect(() => {
    if (lastPlacedSlotIndex == null) return;
    const t = setTimeout(() => setLastPlacedSlotIndex(null), PLACE_FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [lastPlacedSlotIndex]);

  useEffect(() => {
    if (!showQuestCompleteCelebration) return;
    const t = setTimeout(() => setShowQuestCompleteCelebration(false), QUEST_CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [showQuestCompleteCelebration]);

  const handleDragMoveFromBackpack = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const synth = el?.closest('[data-synthesis-slot]');
    const delivery = el?.closest('[data-delivery-zone]');
    const terrain = el?.closest('[data-terrain-drop]');
    const slot = el?.closest('[data-slot-index]');
    // 資源點改用世界座標圓形判定（與點擊判定完全相同，避免 DOM 堆疊造成 Y 方向偏小）
    const world = screenToWorldRef.current?.(clientX, clientY);
    const resourceId = world ? hitTest(world.x, world.y, hitTestTargetsRef.current.resources) : null;
    if (synth) {
      const i = parseInt(synth.getAttribute('data-synthesis-slot-index') ?? '0', 10);
      setDropTarget({ type: 'synthesis', index: i });
    } else if (delivery) setDropTarget({ type: 'delivery' });
    else if (terrain) setDropTarget({ type: 'terrain', id: terrain.getAttribute('data-terrain-drop') ?? '' });
    else if (resourceId) setDropTarget({ type: 'resource', id: resourceId });
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
      const terrainDrop = el?.closest('[data-terrain-drop]');
      const terrainId = terrainDrop?.getAttribute('data-terrain-drop');
      // 資源點改用世界座標圓形判定，與點擊判定完全一致
      const world = screenToWorldRef.current?.(clientX, clientY);
      const resourceId = world ? hitTest(world.x, world.y, hitTestTargetsRef.current.resources) : null;

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

      if (deliveryZone && game.questPhase === 'accepted' && quest && currentStep?.type === 'deliver_to' && currentStep.entityId === game.dialogueNpcId) {
        if (item.itemId === currentStep.itemId) {
          backpack.removeItem(backpackSlotIndex, 1);
          setDeliveryMessage(null);
          game.advanceQuestStep();
        } else {
          setDeliveryMessage(currentStep.wrongItemMessage ?? '不是這個。');
        }
      }

      // 拖曳藥劑到需清除的地形
      if (terrainId && interactionConfig.obstacleUseMode === 'drag') {
        const t = getLabTerrain(terrainId);
        if (t?.requiredItemId && item.itemId === t.requiredItemId) {
          game.clearTerrain(terrainId);
          backpack.removeItem(backpackSlotIndex, 1);
        }
      }

      // 拖曳道具到資源點交換（須在互動範圍內，且提示泡泡需顯示）；依節點 requireItemEffectId、exchangeFloatText 觸發特效
      if (resourceId) {
        const node = getResourceNode(resourceId);
        const inRange =
          node &&
          Math.hypot(game.playerPosition.x - node.x, game.playerPosition.y - node.y) <=
            interactionConfig.interactionRange;
        if (
          inRange &&
          node &&
          node.proximityBubbleText &&
          node.acquisitionType === 'exchange' &&
          node.requireItemId &&
          item.itemId === node.requireItemId &&
          node.resultItemId
        ) {
          backpack.removeItem(backpackSlotIndex, 1);
          backpack.addItem(node.resultItemId, 1);
          playSound('gather');
          if (node.requireItemEffectId) {
            game.recordResourceGather(node.id, {
              effectId: node.requireItemEffectId,
              label: node.exchangeFloatText ?? '完成',
            });
          }
        }
      }
    },
    [backpack, game, quest, currentStep, game.questStepIndex, game.dialogueNpcId, synthesisSlots, setSynthesisSlot, game.playerPosition.x, game.playerPosition.y]
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
      if (!node || node.acquisitionType !== 'tap' || !node.gatherItemId) return;
      // 只有在提示泡泡顯示時（需 proximityBubbleText 且在互動範圍內）才允許採集
      if (!node.proximityBubbleText) return;
      const inRange = Math.hypot(game.playerPosition.x - node.x, game.playerPosition.y - node.y) <= interactionConfig.interactionRange;
      if (!inRange) return;
      const limit = getGatherLimitForNode(node, game.mapId);
      const remaining = limit != null ? game.getResourceRemaining(node.id) : undefined;
      if (limit != null && (remaining ?? limit) <= 0) return;
      // 採集行為由節點 acquisitionType 決定，不再特判資源種類
      if (node.gatherEffectId) {
        game.recordResourceGather(node.id, {
          effectId: node.gatherEffectId,
          label: node.gatherFloatText ?? `+1 ${getItem(node.gatherItemId)?.name ?? '素材'}`,
          gatherLimit: limit,
        });
      }
      playSound('gather');
      backpack.addItem(node.gatherItemId, 1);
    },
    [game, backpack, game.playerPosition.x, game.playerPosition.y]
  );

  const handleTapMonster = useCallback((monsterId: string) => game.tryStunMonster(monsterId), [game]);
  const handleTapTerrain = useCallback(
    (terrainId: string) => {
      if (interactionConfig.obstacleUseMode !== 'tap') return;
      const t = getLabTerrain(terrainId);
      if (!t?.requiredItemId) return;
      const idx = backpack.slots.findIndex((s) => s?.itemId === t.requiredItemId);
      if (idx < 0) return;
      game.clearTerrain(terrainId);
      backpack.removeItem(idx, 1);
    },
    [game, backpack]
  );

  // 對話窗內點「領取」：完成當前 receive_from 步驟（發放道具並推進步驟）
  const handleReceiveFromStep = useCallback(() => {
    if (game.questPhase !== 'accepted' || !quest || currentStep?.type !== 'receive_from' || currentStep.entityId !== game.dialogueNpcId) return;
    backpack.addItem(currentStep.itemId, currentStep.count ?? 1);
    game.advanceQuestStep();
  }, [game, quest, currentStep, game.dialogueNpcId, backpack]);

  // 進入「結束任務」步驟時：記錄完成、播音效、顯示彈窗
  useEffect(() => {
    if (game.questPhase !== 'accepted' || !quest || currentStep?.type !== 'complete') return;
    game.setQuestPhase('completed');
    game.recordQuestCompletion(game.selectedQuestId);
    playSound('success');
    setShowQuestCompleteCelebration(true);
  }, [game.questPhase, quest, currentStep?.type, game]);

  const monsterStunned = game.monsterStunUntil > Date.now();

  // 取得當前任務完成後的下一個串鏈任務（有 prerequisiteQuestId 指向當前任務）
  const nextMission = useMemo(
    () =>
      missionList.find((m) => {
        const q = getQuest(m.questId);
        return q?.prerequisiteQuestId === game.selectedQuestId;
      }) ?? null,
    [game.selectedQuestId]
  );

  const handleMapTap = useCallback(
    (type: 'npc' | 'resource' | 'monster' | 'terrain', id: string) => {
      if (type === 'npc') handleTapNpc(id);
      else if (type === 'resource') handleTapResource(id);
      else if (type === 'monster') handleTapMonster(id);
      else if (type === 'terrain') handleTapTerrain(id);
    },
    [handleTapNpc, handleTapResource, handleTapMonster, handleTapTerrain]
  );

  const { hitTestTargets, content } = useMapContent(
    {
      mapId: game.mapId,
      playerPosition: game.playerPosition,
      interactionRange: interactionConfig.interactionRange,
      resourceRemaining: game.resourceRemaining,
      lastResourceFeedback: game.lastResourceFeedback,
      dropTargetResourceId: dropTarget?.type === 'resource' ? dropTarget.id : null,
      dropTargetTerrainId: dropTarget?.type === 'terrain' ? dropTarget.id : null,
      terrainClearedIds: game.terrainClearedIds,
      monsterPositions: game.monsterPositions,
      monsterLastHitTimes: game.monsterLastHitTimes,
      monsterStunned,
      monsterStunUntil: game.monsterStunUntil,
      monsterCooldownResetTimes: game.monsterCooldownResetTimes,
      lastStunFeedback: game.lastStunFeedback,
      acceptFromEntityId: getStartStep(quest)?.entityId ?? null,
      questPhase: game.questPhase,
      bubbleEntityId: bubble?.entityId ?? null,
      bubbleItemId: bubble?.itemId ?? null,
      bubbleLabel: bubble?.label ?? null,
    },
    { onTap: handleMapTap }
  );
  // 每次 render 都即時更新，讓拖曳 handlers 能透過 ref 讀到最新的判定目標
  hitTestTargetsRef.current = hitTestTargets;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[var(--color-bg)]">
      <div className="game-layout flex flex-col">
        <TopBar
          currentMapId={game.mapId}
          currentQuestId={game.selectedQuestId}
          missions={missionList}
          completedQuestIds={game.completedQuestIds}
          onSelectMission={game.selectMission}
        />
        <StatsBar stats={displayStats} />
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
            hitTestTargets={hitTestTargets}
            onTap={handleMapTap}
            screenToWorldRef={screenToWorldRef}
          >
            {content}
          </MapArea>
          {/* 對話時地圖半透明黑色遮罩；點擊等同關閉對話 */}
          {game.dialogueOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-30 pointer-events-auto cursor-pointer"
              aria-hidden
              role="button"
              tabIndex={0}
              onClick={() => {
                game.closeDialogue();
                setDeliveryMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  game.closeDialogue();
                  setDeliveryMessage(null);
                }
              }}
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
              currentStep={currentStep}
              dialogueNpcId={game.dialogueNpcId}
              acceptFromEntityId={getStartStep(quest)?.entityId ?? null}
              acceptText={getStartStep(quest)?.acceptText ?? null}
              completeMessage={getCompleteMessage(quest) ?? null}
              onAcceptQuest={game.acceptQuest}
              onReceiveFromStep={handleReceiveFromStep}
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
          onSynthesisExpandedChange={(expanded) => {
            if (expanded) {
              if (game.dialogueOpen) {
                game.closeDialogue();
                setDeliveryMessage(null);
              }
              setSynthesisExpanded(true);
            } else {
              flushSynthesisToBackpackAndClose();
            }
          }}
          justCrafted={justCrafted}
        />
      </div>

      {showQuestCompleteCelebration && quest && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="關閉任務完成"
          onClick={() => setShowQuestCompleteCelebration(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowQuestCompleteCelebration(false);
            }
          }}
        >
          <div
            className="animate-quest-complete rounded-xl bg-[var(--color-panel)] border-2 border-[var(--color-primary)] px-8 py-6 shadow-lg flex flex-col items-center gap-3 cursor-default relative"
            role="dialog"
            aria-label="任務完成"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQuestCompleteCelebration(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)] hover:text-[var(--color-text-default)] text-lg leading-none transition-colors"
              aria-label="關閉"
            >
              ×
            </button>
            <span className="text-xl font-bold text-[var(--color-primary)]">任務完成</span>
            <span className="text-sm text-[var(--color-text-default)]">{quest.name}</span>
            {nextMission && (
              <button
                type="button"
                onClick={() => {
                  game.selectMission(nextMission.mapId, nextMission.questId);
                  setShowQuestCompleteCelebration(false);
                }}
                className="mt-1 px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                繼續：{nextMission.name} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* MVP-01：成功 / 失敗結算 */}
      {game.gameOutcome === 'success' && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="關閉"
          onClick={() => game.dismissOutcome()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              game.dismissOutcome();
            }
          }}
        >
          <div
            className="rounded-xl bg-[var(--color-panel)] border-2 border-[var(--color-primary)] px-8 py-6 shadow-lg flex flex-col items-center gap-2 cursor-default relative"
            role="dialog"
            aria-label="成功"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => game.dismissOutcome()}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)] hover:text-[var(--color-text-default)] text-lg leading-none transition-colors"
              aria-label="關閉"
            >
              ×
            </button>
            <span className="text-xl font-bold text-[var(--color-primary)]">成功</span>
            <span className="text-sm text-[var(--color-text-default)]">任務完成</span>
          </div>
        </div>
      )}
      {game.gameOutcome === 'fail' && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="失敗"
        >
          <div
            className="rounded-xl bg-[var(--color-panel)] border-2 border-[var(--color-text-error)] px-8 py-6 shadow-lg flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xl font-bold text-[var(--color-text-error)]">失敗</span>
            <span className="text-sm text-[var(--color-text-default)]">HP 歸零</span>
            <button
              type="button"
              onClick={() => game.selectMission(game.mapId, game.selectedQuestId)}
              className="mt-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              重新開始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
