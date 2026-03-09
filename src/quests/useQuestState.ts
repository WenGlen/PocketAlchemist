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
} from './data/questData';
import type { AcceptMode, QuestDef, QuestStep } from './data/questData';
import { QUEST_CELEBRATION_MS } from '../objects/objectsConstants';

// ========== 型別定義 ==========

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

  // introDialogue 對話狀態
  currentIntroDialogue: { speaker: string; content: string }[] | null;
  introDialogueIndex: number;

  // 泡泡顯示
  displayBubbleLabel: string | null;

  // 處理函數
  handleCloseQuestCelebration: () => void;
  handleAdvanceIntroDialogue: () => void;
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

  // 重置函數（供 GameScreen 的 useEffect 呼叫）
  resetQuestState: () => void;
}

// ========== Hook 實作 ==========

export function useQuestState(game: GameStateForQuest): UseQuestStateReturn {
  // ── 狀態 ─────────────────────────────────────────────────────
  const [showQuestCompleteCelebration, setShowQuestCompleteCelebration] = useState(false);
  const [completedQuestInfo, setCompletedQuestInfo] = useState<{ name: string } | null>(null);
  const [chainedPendingQuestId, setChainedPendingQuestId] = useState<string | null>(null);
  const [seenForcedStartDialogue, setSeenForcedStartDialogue] = useState<Set<string>>(new Set());
  const [seenIntroDialogueSteps, setSeenIntroDialogueSteps] = useState<Set<number>>(new Set());
  const [introDialogueIndex, setIntroDialogueIndex] = useState<number>(-1);

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

  const currentIntroDialogue = useMemo(() => {
    if (game.questPhase !== 'accepted' || !currentStep) return null;
    if (!('introDialogue' in currentStep) || !currentStep.introDialogue?.length) return null;
    if (seenIntroDialogueSteps.has(game.questStepIndex)) return null;
    return currentStep.introDialogue;
  }, [game.questPhase, currentStep, game.questStepIndex, seenIntroDialogueSteps]);

  const displayBubbleLabel = useMemo(() => {
    if (game.questPhase === 'idle' && nextQuest) {
      return `📜 ${nextQuest.name}`;
    }
    return bubble?.label ?? null;
  }, [game.questPhase, nextQuest, bubble?.label]);

  // 判斷是否為 auto 承接模式（idle + auto 模式 + 與任務發放 NPC 對話）
  const isAutoAcceptMode = useMemo(() => {
    if (game.questPhase !== 'idle') return false;
    if (!nextQuest) return false;
    if (!game.dialogueNpcId) return false;

    const mode = nextQuest.acceptMode ?? 'auto';
    if (mode !== 'auto') return false;

    const startNpcId = getStartStep(nextQuest)?.entityId;
    return game.dialogueNpcId === startNpcId;
  }, [game.questPhase, nextQuest, game.dialogueNpcId]);

  // ── 副作用 ───────────────────────────────────────────────────

  // 進入新步驟時，若該步驟有 introDialogue，自動啟動逐句對話
  useEffect(() => {
    if (currentIntroDialogue && introDialogueIndex < 0) {
      setIntroDialogueIndex(0);
    }
  }, [currentIntroDialogue, introDialogueIndex]);

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
  }, [game, game.mapId, game.completedQuestIds]);

  const handleAdvanceIntroDialogue = useCallback(() => {
    if (!currentIntroDialogue) return;
    const nextIndex = introDialogueIndex + 1;
    if (nextIndex >= currentIntroDialogue.length) {
      setSeenIntroDialogueSteps((prev) => new Set(prev).add(game.questStepIndex));
      setIntroDialogueIndex(-1);
    } else {
      setIntroDialogueIndex(nextIndex);
    }
  }, [currentIntroDialogue, introDialogueIndex, game.questStepIndex]);

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

    // 輔助函數：解析 onStepComplete 並應用動作
    const applyStepCompleteAction = (step: QuestStep | null | undefined, nextStepEntityId: string | undefined) => {
      const action = parseStepCompleteAction(step);
      // 收集 hideNpc/showNpc
      if (action.hideNpc) {
        result.hideNpc = Array.isArray(action.hideNpc) ? action.hideNpc : [action.hideNpc];
      }
      if (action.showNpc) {
        result.showNpc = Array.isArray(action.showNpc) ? action.showNpc : [action.showNpc];
      }
      // 判斷對話框行為
      if (action.dialogue === 'continue') {
        // 下一步與當前 NPC 相同，或是 complete 類型（無 entityId），則不關閉對話
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

    // interact_with 步驟：關閉對話時完成此步驟（推進到下一步）
    if (game.questPhase === 'accepted' && currentStep?.type === 'interact_with' && currentStep.entityId === game.dialogueNpcId) {
      // 確認 introDialogue 已看完（或沒有 introDialogue）
      const hasIntro = currentStep.introDialogue && currentStep.introDialogue.length > 0;
      const introFinished = !hasIntro || seenIntroDialogueSteps.has(game.questStepIndex);
      if (introFinished) {
        const nextStep = getStepByIndex(quest, game.questStepIndex + 1);
        applyStepCompleteAction(currentStep, getStepEntityId(nextStep));
        game.advanceQuestStep();
      }
    }

    // complete 步驟：關閉對話時才真正完成任務
    if (game.questPhase === 'accepted' && currentStep?.type === 'complete' && quest && game.selectedQuestId) {
      setCompletedQuestInfo({ name: quest.name });
      game.setQuestPhase('completed');
      game.recordQuestCompletion(game.selectedQuestId);
      playSound('success');
      setShowQuestCompleteCelebration(true);
    }

    // chained 模式：關閉對話時自動承接任務
    if (chainedPendingQuestId) {
      const chainedQuest = getQuest(chainedPendingQuestId);
      const startStep = getStartStep(chainedQuest);
      game.startQuest(chainedPendingQuestId);
      setChainedPendingQuestId(null);
      const nextStep = getStepByIndex(chainedQuest, 1);
      applyStepCompleteAction(startStep, getStepEntityId(nextStep));
    }

    // auto 模式：關閉對話時自動承接任務
    if (game.questPhase === 'idle' && nextQuest) {
      const mode = nextQuest.acceptMode ?? 'auto';
      if (mode === 'auto') {
        const startStep = getStartStep(nextQuest);
        const startNpcId = startStep?.entityId;
        if (game.dialogueNpcId === startNpcId) {
          game.startQuest(nextQuest.id);
          const nextStep = getStepByIndex(nextQuest, 1);
          applyStepCompleteAction(startStep, getStepEntityId(nextStep));
        }
      }
    }

    return result;
  }, [game, chainedPendingQuestId, currentStep, quest, nextQuest, game.questPhase, game.selectedQuestId, game.questStepIndex, seenForcedStartDialogue, seenIntroDialogueSteps]);

  const resetQuestState = useCallback(() => {
    setShowQuestCompleteCelebration(false);
    setCompletedQuestInfo(null);
    setChainedPendingQuestId(null);
    setSeenForcedStartDialogue(new Set());
    setSeenIntroDialogueSteps(new Set());
    setIntroDialogueIndex(-1);
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
    currentIntroDialogue,
    introDialogueIndex,
    displayBubbleLabel,
    handleCloseQuestCelebration,
    handleAdvanceIntroDialogue,
    handleAcceptQuest,
    handleQuestDialogueClose,
    resetQuestState,
  };
}
