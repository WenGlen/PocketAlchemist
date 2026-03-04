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
  /** 處理關閉對話的任務邏輯，回傳 true 表示對話應該關閉 */
  handleQuestDialogueClose: () => boolean;

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

  const currentStep = useMemo(
    () => getCurrentStep(quest, game.questStepIndex),
    [quest, game.questStepIndex]
  );

  const bubble = useMemo(
    () => getBubbleDisplay(quest, game.questPhase, game.questStepIndex, currentStep),
    [quest, game.questPhase, game.questStepIndex, currentStep]
  );

  const interactableNpcId = useMemo(
    () => getInteractableNpcId(quest, game.questPhase, game.questStepIndex),
    [quest, game.questPhase, game.questStepIndex]
  );

  const completeMessage = useMemo(
    () => getCompleteMessage(quest),
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
   * @returns true 表示對話應該關閉，false 表示不應關閉（如 forced 模式第一次點擊）
   */
  const handleQuestDialogueClose = useCallback((): boolean => {
    // forced 模式：第一次點擊只是標記已看過，不關閉對話
    if (game.questPhase === 'accepted' && quest?.acceptMode === 'forced' && game.selectedQuestId) {
      const startNpcId = getStartStep(quest)?.entityId;
      if (game.dialogueNpcId === startNpcId && !seenForcedStartDialogue.has(game.selectedQuestId)) {
        setSeenForcedStartDialogue(prev => new Set(prev).add(game.selectedQuestId!));
        return false;
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
      game.startQuest(chainedPendingQuestId);
      setChainedPendingQuestId(null);
    }

    return true;
  }, [game, chainedPendingQuestId, currentStep?.type, quest, game.questPhase, game.selectedQuestId, seenForcedStartDialogue]);

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
