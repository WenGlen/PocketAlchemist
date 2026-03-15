//════════════════════════════════════════════════════════════════
// 任務狀態管理 Hook
//════════════════════════════════════════════════════════════════
// 管理任務進度、對話狀態、承接模式等邏輯
// 從 GameScreen 抽離，讓 GameScreen 專注於 UI 組裝

import { useState, useCallback, useEffect, useMemo } from 'react';
import { playSound } from '../assets/audio';
import {
  getQuest,
  getCurrentStep,
  getBubbleDisplay,
  getCompleteMessage,
  getStartStep,
  getNextQuest,
  getInteractableNpcId,
  getStepEntityId,
  getStepByIndex,
  parseStepCompleteAction,
} from './data/questUtils';
import type { AcceptMode, QuestDef, QuestStep } from './data/questData';
import { QUEST_CELEBRATION_MS } from '../objects/objectsConstants';
import { getEventByTrigger } from './data/eventsData';
import type { EventDef } from './data/eventsData';

// ========== 型別定義 ==========

/**
 * 外部副作用 callbacks，讓 useQuestState 不直接依賴背包等 UI 層模組
 */
interface QuestStateActions {
  /** 發放道具給玩家（receive_from 步驟完成時呼叫） */
  onGiveItem?: (itemId: string, count: number) => void;
}

interface GameStateForQuest {
  mapId: string;
  questPhase: 'idle' | 'accepted' | 'completed';
  selectedQuestId: string | null;
  questStepIndex: number;
  completedQuestIds: string[];
  dialogueNpcId: string | null;
  missionResetKey: number;
  startQuest: (questId: string) => void;
  clearCurrentQuest: () => void;
  openDialogue: (npcId: string) => void;
  closeDialogue: () => void;
  setQuestPhase: (phase: 'idle' | 'accepted' | 'completed') => void;
  recordQuestCompletion: (questId: string) => void;
  advanceQuestStep: () => void;
  hideNpcs: (ids: string[]) => void;
  showNpcs: (ids: string[]) => void;
  enterMap: (mapId: string) => void;
}

export interface UseQuestStateReturn {
  // 任務資料
  nextQuest: QuestDef | null;
  quest: QuestDef | null;
  currentStep: QuestStep | null;
  bubble: { entityId: string; itemId: string | null; label: string | null } | null;
  interactableNpcId: string | null;
  completeMessage: string | null;

  // 慶祝狀態
  showQuestCompleteCelebration: boolean;
  completedQuestInfo: { name: string } | null;

  // 承接模式
  isManualAcceptMode: boolean;
  isChainedPendingMode: boolean;
  isAutoAcceptMode: boolean;
  showForcedStartDialogue: boolean;

  // talk_to 步驟對話狀態
  talkToLines: { speaker: string; content: string }[] | null;
  talkToLineIndex: number;

  /**
   * start 步驟「點擊推進」模式
   * auto/chained/forced 在顯示 acceptText 時為 true，tap 推進即承接任務
   */
  isPlayingStart: boolean;

  // 泡泡顯示
  displayBubbleLabel: string | null;

  // 處理函數
  handleCloseQuestCelebration: () => void;
  /** 推進 talk_to 步驟的下一句；到最後一句後自動完成步驟 */
  handleAdvanceTalkTo: () => void;
  /** 確認 interact_with 步驟完成（點確認按鈕時呼叫） */
  handleConfirmInteract: () => void;
  /** 領取 receive_from 步驟的道具並完成步驟（點「領取」按鈕時呼叫） */
  handleReceiveFromStep: () => void;
  handleAcceptQuest: () => void;
  /**
   * 處理關閉對話的任務邏輯
   * @returns shouldClose: 對話是否應該關閉, hideNpc/showNpc: NPC 狀態變化
   */
  handleQuestDialogueClose: () => {
    shouldClose: boolean;
    hideNpc?: string[];
    showNpc?: string[];
  };

  // 事件系統
  pendingEvent: EventDef | null;
  showEventPanel: boolean;
  handleCloseEventPanel: () => void;

  // 重置函數（供 GameScreen 的 useEffect 呼叫）
  resetQuestState: () => void;
}

// ========== Hook 實作 ==========

export function useQuestState(game: GameStateForQuest, actions?: QuestStateActions): UseQuestStateReturn {
  const { onGiveItem } = actions ?? {};
  // ── 狀態 ─────────────────────────────────────────────────────
  const [showQuestCompleteCelebration, setShowQuestCompleteCelebration] = useState(false);
  const [completedQuestInfo, setCompletedQuestInfo] = useState<{ name: string } | null>(null);
  const [chainedPendingQuestId, setChainedPendingQuestId] = useState<string | null>(null);
  const [seenForcedStartDialogue, setSeenForcedStartDialogue] = useState<Set<string>>(new Set());
  const [talkToLineIndex, setTalkToLineIndex] = useState<number>(0);
  const [pendingEvent, setPendingEvent] = useState<EventDef | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);

  // ── 計算值 ───────────────────────────────────────────────────
  const nextQuest = useMemo(
    () => getNextQuest(game.mapId, game.completedQuestIds),
    [game.mapId, game.completedQuestIds]
  );

  const quest = useMemo(() => {
    if (game.questPhase === 'accepted' && game.selectedQuestId) {
      return getQuest(game.selectedQuestId) ?? null;
    }
    return nextQuest;
  }, [game.questPhase, game.selectedQuestId, nextQuest]);

  const currentStepRaw = useMemo(
    () => getCurrentStep(quest, game.questStepIndex),
    [quest, game.questStepIndex]
  );
  const currentStep = currentStepRaw ?? null;

  const bubble = useMemo(() => {
    const raw = getBubbleDisplay(quest, game.questPhase, game.questStepIndex, currentStepRaw);
    if (!raw) return null;
    return {
      entityId: raw.entityId,
      itemId: raw.itemId ?? null,
      label: raw.label ?? null,
    };
  }, [quest, game.questPhase, game.questStepIndex, currentStepRaw]);

  const interactableNpcId = useMemo(
    () => getInteractableNpcId(quest, game.questPhase, game.questStepIndex) ?? null,
    [quest, game.questPhase, game.questStepIndex]
  );

  const completeMessage = useMemo(
    () => getCompleteMessage(quest) ?? null,
    [quest]
  );

  const isManualAcceptMode = game.questPhase === 'idle' && nextQuest?.acceptMode === 'manual';
  const isChainedPendingMode = game.questPhase === 'idle' && chainedPendingQuestId !== null;

  const showForcedStartDialogue = useMemo(() => {
    if (game.questPhase !== 'accepted' || !quest || !game.selectedQuestId) return false;
    if (quest.acceptMode !== 'forced') return false;
    if (seenForcedStartDialogue.has(game.selectedQuestId)) return false;
    const startNpcId = getStartStep(quest)?.entityId;
    return game.dialogueNpcId === startNpcId;
  }, [game.questPhase, quest, game.selectedQuestId, seenForcedStartDialogue, game.dialogueNpcId]);

  // talk_to 步驟：當前對話行
  const talkToLines = useMemo(() => {
    if (game.questPhase !== 'accepted' || !currentStep) return null;
    if (currentStep.type !== 'talk_to') return null;
    if (currentStep.entityId !== game.dialogueNpcId) return null;
    return currentStep.lines;
  }, [game.questPhase, currentStep, game.dialogueNpcId]);

  const displayBubbleLabel = useMemo(() => {
    if (game.questPhase === 'idle' && nextQuest) {
      return `📜 ${nextQuest.name}`;
    }
    return bubble?.label ?? null;
  }, [game.questPhase, nextQuest, bubble?.label]);

  // 判斷是否為 auto 承接模式
  const isAutoAcceptMode = useMemo(() => {
    if (game.questPhase !== 'idle') return false;
    if (!nextQuest) return false;
    if (!game.dialogueNpcId) return false;
    const mode = nextQuest.acceptMode ?? 'auto';
    if (mode !== 'auto') return false;
    const startNpcId = getStartStep(nextQuest)?.entityId;
    return game.dialogueNpcId === startNpcId;
  }, [game.questPhase, nextQuest, game.dialogueNpcId]);

  /**
   * start 步驟「點擊推進」模式：auto/chained/forced 正在顯示 acceptText
   * 此時 tap 整個面板或遮罩 = 承接任務（推進）而非關閉
   */
  const isPlayingStart = useMemo(() => {
    if (!game.dialogueNpcId) return false;
    // auto 模式
    if (game.questPhase === 'idle' && nextQuest) {
      const mode = nextQuest.acceptMode ?? 'auto';
      if (mode === 'auto') {
        return game.dialogueNpcId === getStartStep(nextQuest)?.entityId;
      }
    }
    // chained 模式（等待承接中）
    if (chainedPendingQuestId) {
      const chainedQuest = getQuest(chainedPendingQuestId);
      return game.dialogueNpcId === getStartStep(chainedQuest)?.entityId;
    }
    // forced 模式：任務已承接但尚未看過 start 對話
    if (game.questPhase === 'accepted' && quest?.acceptMode === 'forced' && game.selectedQuestId) {
      if (!seenForcedStartDialogue.has(game.selectedQuestId)) {
        return game.dialogueNpcId === getStartStep(quest)?.entityId;
      }
    }
    return false;
  }, [game.questPhase, game.dialogueNpcId, game.selectedQuestId, nextQuest, chainedPendingQuestId, quest, seenForcedStartDialogue]);

  // ── 副作用 ───────────────────────────────────────────────────

  // 進入新步驟時重置 talkToLineIndex
  useEffect(() => {
    setTalkToLineIndex(0);
  }, [game.questStepIndex]);

  // 慶祝視窗自動關閉
  useEffect(() => {
    if (!showQuestCompleteCelebration) return;
    const t = setTimeout(() => {
      handleCloseQuestCelebration();
    }, QUEST_CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [showQuestCompleteCelebration]);

  // ── 處理函數 ─────────────────────────────────────────────────

  const handleCloseQuestCelebration = useCallback(() => {
    setShowQuestCompleteCelebration(false);
    setCompletedQuestInfo(null);

    const next = getNextQuest(game.mapId, game.completedQuestIds);
    if (!next) {
      game.clearCurrentQuest();
      // 無後續任務時，若有待觸發事件則顯示事件面板
      if (pendingEvent) setShowEventPanel(true);
      return;
    }

    const mode: AcceptMode = next.acceptMode ?? 'auto';
    const startNpcId = getStartStep(next)?.entityId;

    if (mode === 'forced') {
      game.startQuest(next.id);
    } else if (mode === 'chained') {
      game.clearCurrentQuest();
      setChainedPendingQuestId(next.id);
      if (startNpcId) {
        game.openDialogue(startNpcId);
      }
    } else {
      game.clearCurrentQuest();
    }
  }, [game, game.mapId, game.completedQuestIds, pendingEvent]);

  /** 推進 talk_to 步驟的下一句；到最後一句後自動完成步驟 */
  const handleAdvanceTalkTo = useCallback(() => {
    if (!talkToLines) return;
    const nextIndex = talkToLineIndex + 1;
    if (nextIndex >= talkToLines.length) {
      // 讀完所有台詞，完成步驟
      const nextStep = getStepByIndex(quest, game.questStepIndex + 1);
      const action = parseStepCompleteAction(currentStep);
      if (action.dialogue === 'continue' || !getStepEntityId(nextStep)) {
        // continue 或下一步無 entityId（如 complete）時不關閉對話
      }
      game.advanceQuestStep();
    } else {
      setTalkToLineIndex(nextIndex);
    }
  }, [talkToLines, talkToLineIndex, quest, game.questStepIndex, currentStep]);

  /** 確認 interact_with 步驟完成 */
  const handleConfirmInteract = useCallback(() => {
    if (game.questPhase !== 'accepted' || currentStep?.type !== 'interact_with') return;
    if (currentStep.entityId !== game.dialogueNpcId) return;
    const nextStep = getStepByIndex(quest, game.questStepIndex + 1);
    const action = parseStepCompleteAction(currentStep);
    // 套用 hideNpc/showNpc（由呼叫方透過 handleQuestDialogueClose 的回傳值處理）
    void action;
    void nextStep;
    game.advanceQuestStep();
  }, [game, currentStep, quest]);

  /** 領取 receive_from 步驟的道具並完成步驟 */
  const handleReceiveFromStep = useCallback(() => {
    if (game.questPhase !== 'accepted' || !quest || currentStep?.type !== 'receive_from') return;
    if (currentStep.entityId !== game.dialogueNpcId) return;
    onGiveItem?.(currentStep.itemId, currentStep.count ?? 1);
    game.advanceQuestStep();
  }, [game, quest, currentStep, onGiveItem]);

  const handleAcceptQuest = useCallback(() => {
    if (!nextQuest) return;
    game.startQuest(nextQuest.id);
  }, [game, nextQuest]);

  /**
   * 處理關閉對話的任務邏輯
   * @returns shouldClose: 對話是否應該關閉, hideNpc/showNpc: NPC 狀態變化
   */
  const handleQuestDialogueClose = useCallback((): {
    shouldClose: boolean;
    hideNpc?: string[];
    showNpc?: string[];
  } => {
    const result: { shouldClose: boolean; hideNpc?: string[]; showNpc?: string[] } = { shouldClose: true };

    const applyStepCompleteAction = (step: QuestStep | null | undefined, nextStepEntityId: string | undefined) => {
      const action = parseStepCompleteAction(step);
      if (action.hideNpc) {
        result.hideNpc = Array.isArray(action.hideNpc) ? action.hideNpc : [action.hideNpc];
      }
      if (action.showNpc) {
        result.showNpc = Array.isArray(action.showNpc) ? action.showNpc : [action.showNpc];
      }
      if (action.dialogue === 'continue') {
        if (nextStepEntityId === game.dialogueNpcId || !nextStepEntityId) {
          result.shouldClose = false;
        }
      }
    };

    // forced 模式：第一次點擊只是標記已看過，不關閉對話
    if (game.questPhase === 'accepted' && quest?.acceptMode === 'forced' && game.selectedQuestId) {
      const startNpcId = getStartStep(quest)?.entityId;
      if (game.dialogueNpcId === startNpcId && !seenForcedStartDialogue.has(game.selectedQuestId)) {
        setSeenForcedStartDialogue(prev => new Set(prev).add(game.selectedQuestId!));
        return { shouldClose: false };
      }
    }

    // talk_to 步驟：對話未讀完時關閉不完成步驟（保留進度，重開從頭）
    // interact_with 步驟：關閉不完成步驟，需點確認按鈕才完成（handleConfirmInteract）

    // complete 步驟：關閉對話時才真正完成任務
    if (game.questPhase === 'accepted' && currentStep?.type === 'complete' && quest && game.selectedQuestId) {
      // 套用 complete 步驟的副作用（hideNpc / showNpc）
      applyStepCompleteAction(currentStep, undefined);
      setCompletedQuestInfo({ name: quest.name });
      game.setQuestPhase('completed');
      game.recordQuestCompletion(game.selectedQuestId);
      playSound('success');
      setShowQuestCompleteCelebration(true);
      // 檢查是否有此任務完成後應觸發的事件，預存待慶祝視窗關閉後顯示
      const evt = getEventByTrigger(game.selectedQuestId);
      if (evt) setPendingEvent(evt);
    }

    // chained 模式：關閉對話時自動承接任務
    // start 步驟的副作用（hideNpc / showNpc）套用後，判斷是否需要關閉對話
    if (chainedPendingQuestId) {
      const chainedQuest = getQuest(chainedPendingQuestId);
      const startStep = getStartStep(chainedQuest);
      game.startQuest(chainedPendingQuestId);
      setChainedPendingQuestId(null);
      const action = parseStepCompleteAction(startStep);
      if (action.hideNpc) result.hideNpc = Array.isArray(action.hideNpc) ? action.hideNpc : [action.hideNpc];
      if (action.showNpc) result.showNpc = Array.isArray(action.showNpc) ? action.showNpc : [action.showNpc];
      // 下一步（step index 1）是否與當前對話 NPC 相同；不同則關閉對話讓玩家去找對應 NPC
      const chainedNextStep = getStepByIndex(chainedQuest, 1);
      const chainedNextEntityId = getStepEntityId(chainedNextStep);
      result.shouldClose = !!(chainedNextEntityId && chainedNextEntityId !== game.dialogueNpcId);
    }

    // auto 模式：關閉對話時自動承接任務
    // start 步驟永遠 continue（不關閉對話框），onStepComplete 只取 hideNpc/showNpc
    if (game.questPhase === 'idle' && nextQuest) {
      const mode = nextQuest.acceptMode ?? 'auto';
      if (mode === 'auto') {
        const startStep = getStartStep(nextQuest);
        const startNpcId = startStep?.entityId;
        if (game.dialogueNpcId === startNpcId) {
          game.startQuest(nextQuest.id);
          // 套用副作用（hideNpc / showNpc），但忽略 dialogue 欄位
          const action = parseStepCompleteAction(startStep);
          if (action.hideNpc) result.hideNpc = Array.isArray(action.hideNpc) ? action.hideNpc : [action.hideNpc];
          if (action.showNpc) result.showNpc = Array.isArray(action.showNpc) ? action.showNpc : [action.showNpc];
          result.shouldClose = false;
        }
      }
    }

    return result;
  }, [game, chainedPendingQuestId, currentStep, quest, nextQuest, game.questPhase, game.selectedQuestId, game.questStepIndex, seenForcedStartDialogue]);

  /** 玩家確認事件後執行副作用（NPC 變化、切換地圖）並關閉事件面板 */
  const handleCloseEventPanel = useCallback(() => {
    if (!pendingEvent) return;
    const { onComplete } = pendingEvent;
    if (onComplete?.hideNpc) {
      const ids = Array.isArray(onComplete.hideNpc) ? onComplete.hideNpc : [onComplete.hideNpc];
      game.hideNpcs(ids);
    }
    if (onComplete?.showNpc) {
      const ids = Array.isArray(onComplete.showNpc) ? onComplete.showNpc : [onComplete.showNpc];
      game.showNpcs(ids);
    }
    if (onComplete?.switchMap) {
      game.enterMap(onComplete.switchMap);
    }
    setPendingEvent(null);
    setShowEventPanel(false);
  }, [pendingEvent, game]);

  const resetQuestState = useCallback(() => {
    setShowQuestCompleteCelebration(false);
    setCompletedQuestInfo(null);
    setChainedPendingQuestId(null);
    setSeenForcedStartDialogue(new Set());
    setTalkToLineIndex(0);
    setPendingEvent(null);
    setShowEventPanel(false);
  }, []);

  // ── 回傳 ─────────────────────────────────────────────────────

  return {
    nextQuest,
    quest,
    currentStep,
    bubble,
    interactableNpcId,
    completeMessage,
    showQuestCompleteCelebration,
    completedQuestInfo,
    isManualAcceptMode,
    isChainedPendingMode,
    isAutoAcceptMode,
    showForcedStartDialogue,
    isPlayingStart,
    talkToLines,
    talkToLineIndex,
    displayBubbleLabel,
    handleCloseQuestCelebration,
    handleAdvanceTalkTo,
    handleConfirmInteract,
    handleReceiveFromStep,
    handleAcceptQuest,
    handleQuestDialogueClose,
    pendingEvent,
    showEventPanel,
    handleCloseEventPanel,
    resetQuestState,
  };
}
