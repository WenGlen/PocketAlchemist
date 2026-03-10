//════════════════════════════════════════════════════════════════
// 遊戲主畫面
//════════════════════════════════════════════════════════════════
// 整合 TopBar、StatsBar、MapArea、BottomInventory
// 處理任務進度、合成、背包、對話等互動邏輯

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameState } from './useGameState';
import { playSound } from '../assets/audio';
import { useBackpack } from '../items/inventory/useBackpack';
import { useEquipSlots } from '../items/equipment/useEquipSlots';
import { TopBar } from './screen/TopBar';
import { StatsBar } from './screen/StatsBar';
import { MapArea, hitTest } from './screen/MapArea';
import { useMapContent } from './screen/useMapContent';
import { BottomInventory } from './screen/BottomInventory';
import type { PanelConfig } from './screen/BottomInventory';
import { SynthesisPanel } from '../items/inventory/synthesis/SynthesisPanel';
import { ProcessingPanel } from '../items/inventory/processing/ProcessingPanel';
import { DialoguePanel } from '../objects/npc/DialoguePanel';
import { getObject, getResourceNode, getResourceNodesRequiringItem, getGatherLimitForNode, getLabTerrain } from '../objects/data/objectsTable';
import { ITM_MAT_0001, ITM_EQP_0001, ITM_EQP_0002, getItem } from '../items/data/itemsTable';
import type { SlotItem } from '../items/inventory/useBackpack';
import type { DropTargetFromBackpack } from '../items/inventory/Backpack';
import { getStartStep } from '../quests/data/questData';
import type { AcceptMode } from '../quests/data/questData';
import { useQuestState } from '../quests/useQuestState';
import { interactionConfig } from './interactionConfig';
import { PLACE_FEEDBACK_MS, CRAFT_CLEAR_DELAY_MS } from '../objects/objectsConstants';
import { BACKPACK_CAPACITY } from '../items/inventoryConstants';
import { getDisplayStats } from './screen/statsConfig';
import { questList } from '../quests/data/questList';

// ========== 技能面板定義 ==========
// 對應裝備 skill 欄位，定義面板 ID、按鈕標籤、展開高度
const SKILL_PANEL_DEFS: Record<string, { label: string; maxHeight: number }> = {
  synthesis: { label: '合成', maxHeight: 208 },
  processing: { label: '加工', maxHeight: 180 },
};

// ========== 工具函數 ==========

// 初始背包：玻璃瓶 x2 + 簡易加熱器 + 手套
function getInitialSlotsForMap(_mapId: string): { itemId: string; count: number }[] {
  return [
    { itemId: ITM_MAT_0001.id, count: 1 },
    { itemId: ITM_MAT_0001.id, count: 1 },
    { itemId: ITM_EQP_0001.id, count: 1 },
    { itemId: ITM_EQP_0002.id, count: 1 },
  ];
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
  const equipSlots = useEquipSlots({ resetKey: game.missionResetKey });

  const [synthesisSlots, setSynthesisSlots] = useState<(SlotItem | null)[]>([null, null]);
  const [processingSlots, setProcessingSlots] = useState<(SlotItem | null)[]>([null]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetFromBackpack>(null);
  const [lastPlacedSlotIndex, setLastPlacedSlotIndex] = useState<number | null>(null);
  const [justCrafted, setJustCrafted] = useState(false);
  const [justProcessed, setJustProcessed] = useState(false);

  // 任務狀態管理（從 useQuestState hook 取得）
  const questState = useQuestState(game);
  const synthesisSlotsRef = useRef(synthesisSlots);
  synthesisSlotsRef.current = synthesisSlots;
  const processingSlotsRef = useRef(processingSlots);
  processingSlotsRef.current = processingSlots;
  const backpackRef = useRef(backpack);
  backpackRef.current = backpack;
  const equipSlotsRef = useRef(equipSlots);
  equipSlotsRef.current = equipSlots;
  const screenToWorldRef = useRef<((clientX: number, clientY: number) => { x: number; y: number }) | null>(null);  // 拖曳時需要與點擊相同的座標換算與判定目標，避免 stale closure
  const hitTestTargetsRef = useRef<{ resources: { id: string; x: number; y: number; radius: number }[] }>({ resources: [] });

  // ── 副作用 ─────────────────────────────────────────────────────

  // 切換／重新開始任務時重置本畫面狀態
  useEffect(() => {
    setSynthesisSlots([null, null]);
    setProcessingSlots([null]);
    setActivePanelId(null);
    setDeliveryMessage(null);
    setDropTarget(null);
    questState.resetQuestState();
  }, [game.missionResetKey, questState.resetQuestState]);

  // 面板關閉時把合成槽道具歸還背包
  useEffect(() => {
    if (activePanelId === 'synthesis') return;
    synthesisSlotsRef.current.forEach((s) => {
      if (s) backpackRef.current.addItem(s.itemId, s.count);
    });
    setSynthesisSlots([null, null]);
  }, [activePanelId]);

  // 面板關閉時把加工槽道具歸還背包
  useEffect(() => {
    if (activePanelId === 'processing') return;
    processingSlotsRef.current.forEach((s) => {
      if (s) backpackRef.current.addItem(s.itemId, s.count);
    });
    setProcessingSlots([null]);
  }, [activePanelId]);

  // 移動時關閉面板
  useEffect(() => {
    if (game.moveDirection.x !== 0 || game.moveDirection.y !== 0) {
      setActivePanelId(null);
    }
  }, [game.moveDirection.x, game.moveDirection.y]);

  // 裝備改變時，若面板對應的裝備已取下則自動關閉
  useEffect(() => {
    if (!activePanelId) return;
    const stillEquipped = equipSlots.slots.some((slot) => {
      const item = slot ? getItem(slot.itemId) : null;
      return item?.skill === activePanelId;
    });
    if (!stillEquipped) setActivePanelId(null);
  }, [equipSlots.slots, activePanelId]);

  const npc = game.dialogueNpcId ? getObject(game.dialogueNpcId) : null;

  // 從 questState 解構常用值
  const { quest, currentStep, nextQuest, interactableNpcId, bubble } = questState;

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

  // 關閉所有面板（並確保合成槽道具歸還背包，由 activePanelId effect 處理）
  const closeActivePanel = useCallback(() => {
    setActivePanelId(null);
  }, []);

  const handleTapNpc = (npcId: string) => {
    // MVP-02-4 簡化版：只有 interactableNpcId 的 NPC 可互動
    if (npcId !== interactableNpcId) return;

    closeActivePanel();

    // idle 狀態：點擊任務發放 NPC 時，根據 acceptMode 決定是否自動承接
    if (game.questPhase === 'idle' && nextQuest) {
      const mode: AcceptMode = nextQuest.acceptMode ?? 'auto';
      // forced 模式：立即承接任務（不顯示 acceptText）
      // auto 模式：先顯示 acceptText，關閉對話時再自動承接（由 useQuestState 處理）
      // manual 模式：顯示 acceptText，等待玩家按「接受任務」按鈕
      // chained 模式：由 handleCloseQuestCelebration 處理
      if (mode === 'forced') {
        game.startQuest(nextQuest.id);
      }
    }

    game.openDialogue(npcId);
  };

  // ── 裝備操作 ────────────────────────────────────────────────

  // 取下裝備：歸還背包（透過 ref 讀取，避免 stale closure）
  const handleUnequip = useCallback((index: number) => {
    const slot = equipSlotsRef.current.slots[index];
    if (!slot) return;
    backpackRef.current.addItem(slot.itemId, slot.count);
    equipSlotsRef.current.setSlot(index, null);
  }, []);

  const setSynthesisSlot = useCallback((index: number, item: { itemId: string; count: number } | null) => {
    setSynthesisSlots((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const setProcessingSlot = useCallback((index: number, item: { itemId: string; count: number } | null) => {
    setProcessingSlots((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  const handleCraft = useCallback(
    (resultItemId: string, resultCount: number) => {
      backpack.addItem(resultItemId, resultCount);
      setSynthesisSlots([null, null]);
      playSound('synthesize');
      setJustCrafted(true);
    },
    [backpack]
  );

  useEffect(() => {
    if (!justCrafted) return;
    const t = setTimeout(() => setJustCrafted(false), CRAFT_CLEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [justCrafted]);

  const handleProcess = useCallback(
    (outputItemId: string, outputCount: number) => {
      backpack.addItem(outputItemId, outputCount);
      setProcessingSlots([null]);
      playSound('synthesize');
      setJustProcessed(true);
    },
    [backpack]
  );

  useEffect(() => {
    if (!justProcessed) return;
    const t = setTimeout(() => setJustProcessed(false), CRAFT_CLEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [justProcessed]);

  useEffect(() => {
    if (lastPlacedSlotIndex == null) return;
    const t = setTimeout(() => setLastPlacedSlotIndex(null), PLACE_FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [lastPlacedSlotIndex]);

  const handleDragMoveFromBackpack = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const synth = el?.closest('[data-synthesis-slot]');
    const proc = el?.closest('[data-processing-slot]');
    const equip = el?.closest('[data-equip-slot]');
    const delivery = el?.closest('[data-delivery-zone]');
    const terrain = el?.closest('[data-terrain-drop]');
    const slot = el?.closest('[data-slot-index]');
    // 資源點改用世界座標圓形判定（與點擊判定完全相同，避免 DOM 堆疊造成 Y 方向偏小）
    const world = screenToWorldRef.current?.(clientX, clientY);
    const resourceId = world ? hitTest(world.x, world.y, hitTestTargetsRef.current.resources) : null;
    if (synth) {
      const i = parseInt(synth.getAttribute('data-synthesis-slot-index') ?? '0', 10);
      setDropTarget({ type: 'synthesis', index: i });
    } else if (proc) {
      const i = parseInt(proc.getAttribute('data-processing-slot-index') ?? '0', 10);
      setDropTarget({ type: 'processing', index: i });
    } else if (equip) {
      const i = parseInt(equip.getAttribute('data-equip-slot-index') ?? '0', 10);
      setDropTarget({ type: 'equip', index: i });
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
      const procSlotEl = el?.closest('[data-processing-slot]');
      const equipSlotEl = el?.closest('[data-equip-slot]');
      const deliveryZone = el?.closest('[data-delivery-zone]');
      const terrainDrop = el?.closest('[data-terrain-drop]');
      const terrainId = terrainDrop?.getAttribute('data-terrain-drop');
      // 資源點改用世界座標圓形判定，與點擊判定完全一致
      const world = screenToWorldRef.current?.(clientX, clientY);
      const resourceId = world ? hitTest(world.x, world.y, hitTestTargetsRef.current.resources) : null;

      // 裝備欄放入：只接受 subCategory='eqp' + part='hand' 的道具
      if (equipSlotEl) {
        const equipIndex = parseInt(equipSlotEl.getAttribute('data-equip-slot-index') ?? '-1', 10);
        if (equipIndex >= 0) {
          const itemDef = getItem(item.itemId);
          if (itemDef?.subCategory === 'eqp' && itemDef.part === 'hand') {
            const currentEquip = equipSlotsRef.current.slots[equipIndex];
            if (currentEquip) backpackRef.current.addItem(currentEquip.itemId, currentEquip.count);
            equipSlotsRef.current.setSlot(equipIndex, { itemId: item.itemId, count: 1 });
            backpackRef.current.removeItem(backpackSlotIndex, 1);
          }
        }
        return;
      }

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

      // 加工槽放入：交換原有素材
      if (procSlotEl) {
        const procIndex = parseInt(procSlotEl.getAttribute('data-processing-slot-index') ?? '0', 10);
        const current = processingSlotsRef.current[procIndex];
        if (current) backpack.addItem(current.itemId, current.count);
        setProcessingSlot(procIndex, { itemId: item.itemId, count: 1 });
        backpack.removeItem(backpackSlotIndex, 1);
        return;
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
    [backpack, game, quest, currentStep, game.questStepIndex, game.dialogueNpcId, synthesisSlots, setSynthesisSlot, setProcessingSlot, game.playerPosition.x, game.playerPosition.y]
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

  const handleDragEndFromProcessing = useCallback(
    (processingSlotIndex: number, clientX: number, clientY: number) => {
      const slotItem = processingSlotsRef.current[processingSlotIndex];
      if (!slotItem) return;

      const el = document.elementFromPoint(clientX, clientY);
      const backpackSlot = el?.closest('[data-slot-index]');
      if (backpackSlot) {
        const toIndex = parseInt(backpackSlot.getAttribute('data-slot-index') ?? '-1', 10);
        backpackRef.current.addItem(slotItem.itemId, slotItem.count);
        setProcessingSlot(processingSlotIndex, null);
        if (toIndex >= 0) setLastPlacedSlotIndex(toIndex);
      }
    },
    [setProcessingSlot]
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

  // 關閉對話窗：委託 questState 處理任務邏輯，再關閉對話
  const handleCloseDialogue = useCallback(() => {
    const result = questState.handleQuestDialogueClose();

    // 執行 NPC 隱藏/顯示動作
    if (result.hideNpc?.length) game.hideNpcs(result.hideNpc);
    if (result.showNpc?.length) game.showNpcs(result.showNpc);

    if (!result.shouldClose) return;  // onStepComplete: 'continue' 時不關閉

    game.closeDialogue();
    setDeliveryMessage(null);
  }, [game, questState.handleQuestDialogueClose]);

  const monsterStunned = game.monsterStunUntil > Date.now();

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
      bubbleEntityId: interactableNpcId,
      bubbleItemId: bubble?.itemId ?? null,
      bubbleLabel: questState.displayBubbleLabel,
      interactableNpcId,
      npcPositionOverrides: game.questPhase === 'accepted' ? quest?.npcPositionOverrides : null,
      hiddenNpcIds: game.hiddenNpcIds,
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
          quests={questList}
          completedQuestIds={game.completedQuestIds}
          onEnterMap={game.enterMap}
          onSelectMission={game.selectMission}
          onCheatAddItem={backpack.addItem}
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
              role="button"
              tabIndex={-1}
              aria-label="關閉對話"
              onClick={handleCloseDialogue}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCloseDialogue();
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
              onClose={handleCloseDialogue}
              questPhase={game.questPhase}
              quest={quest}
              currentStep={currentStep}
              dialogueNpcId={game.dialogueNpcId}
              completeMessage={questState.completeMessage}
              onReceiveFromStep={handleReceiveFromStep}
              deliveryZoneHighlight={dropTarget?.type === 'delivery'}
              onAcceptQuest={questState.handleAcceptQuest}
              isManualAcceptMode={questState.isManualAcceptMode}
              isChainedPendingMode={questState.isChainedPendingMode}
              isAutoAcceptMode={questState.isAutoAcceptMode}
              showForcedStartDialogue={questState.showForcedStartDialogue}
              introDialogue={questState.currentIntroDialogue}
              introDialogueIndex={questState.introDialogueIndex}
              onAdvanceIntroDialogue={questState.handleAdvanceIntroDialogue}
              deliveryErrorMessage={deliveryMessage}
            />
          )}
        </div>
        {(() => {
          // 依裝備欄道具建立技能按鈕設定
          const skillButtonConfigs = equipSlots.slots.map((slot) => {
            const item = slot ? getItem(slot.itemId) : null;
            if (!item?.skill) return null;
            const def = SKILL_PANEL_DEFS[item.skill];
            if (!def) return null;
            return { panelId: item.skill, label: def.label };
          });

          // 面板內容定義
          const panelContents: Record<string, PanelConfig> = {
            synthesis: {
              panelId: 'synthesis',
              maxHeight: 208,
              content: (
                <SynthesisPanel
                  slots={synthesisSlots}
                  onSetSlot={setSynthesisSlot}
                  onCraft={handleCraft}
                  onDragEndFromSynthesis={handleDragEndFromSynthesis}
                  dragOverSynthesisSlotIndex={dropTarget?.type === 'synthesis' ? dropTarget.index : null}
                  justCrafted={justCrafted}
                />
              ),
            },
            processing: {
              panelId: 'processing',
              maxHeight: 180,
              content: (
                <ProcessingPanel
                  slots={processingSlots}
                  onProcess={handleProcess}
                  onDragEndFromProcessing={handleDragEndFromProcessing}
                  dragOverProcessingSlotIndex={dropTarget?.type === 'processing' ? dropTarget.index : null}
                  justProcessed={justProcessed}
                />
              ),
            },
          };

          return (
            <BottomInventory
              slots={backpack.slots}
              capacity={backpack.capacity}
              onMoveSlot={backpack.moveSlot}
              equipSlots={equipSlots.slots}
              equipDropTargetIndex={dropTarget?.type === 'equip' ? dropTarget.index : null}
              onUnequip={handleUnequip}
              skillButtonConfigs={skillButtonConfigs}
              activePanelId={activePanelId}
              onSetActivePanelId={(id) => {
                if (id !== null && game.dialogueOpen) handleCloseDialogue();
                setActivePanelId(id);
              }}
              panelContents={panelContents}
              onDragEndFromBackpack={handleDragEndFromBackpack}
              onDragMoveFromBackpack={handleDragMoveFromBackpack}
              onDragEndOrCancelFromBackpack={handleDragEndOrCancelFromBackpack}
              lastPlacedSlotIndex={lastPlacedSlotIndex}
              onSlotPlaced={(toIndex) => setLastPlacedSlotIndex(toIndex)}
              highlightItemId={highlightItemId}
            />
          );
        })()}
      </div>

      {/* MVP-02-4：任務完成彈窗，關閉後回到 idle 狀態繼續探索 */}
      {questState.showQuestCompleteCelebration && questState.completedQuestInfo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="關閉任務完成"
          onClick={questState.handleCloseQuestCelebration}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              questState.handleCloseQuestCelebration();
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
              onClick={questState.handleCloseQuestCelebration}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)] hover:text-[var(--color-text-default)] text-lg leading-none transition-colors"
              aria-label="關閉"
            >
              ×
            </button>
            <span className="text-xl font-bold text-[var(--color-primary)]">任務完成</span>
            <span className="text-sm text-[var(--color-text-default)]">{questState.completedQuestInfo.name}</span>
            <span className="text-xs text-[var(--color-text-muted)]">點擊任意處繼續探索</span>
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
            {game.selectedQuestId && (
              <button
                type="button"
                onClick={() => game.selectMission(game.mapId, game.selectedQuestId!)}
                className="mt-2 px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                重新開始
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
