//════════════════════════════════════════════════════════════════
// NPC 對話面板
//════════════════════════════════════════════════════════════════
// 顯示 NPC 對話、任務進度步驟

import { getDialogueLines } from './dialogueData';
import { getStartStep } from '../../quests/data/questUtils';
import type { QuestDef, QuestStep, QuestPhase } from '../../quests/data/questData';
import { getObject } from '../data/objectsTable';

interface DialoguePanelProps {
  npcName: string;
  dialogueKey: string;
  onClose: () => void;
  questPhase: QuestPhase;
  quest: QuestDef | null;
  currentStep?: QuestStep | null;
  dialogueNpcId?: string | null;
  /** 任務完成時顯示的訊息（來自最後一步 completeMessage） */
  completeMessage?: string | null;
  /** 在對話窗內點「領取」完成 receive_from 步驟時呼叫 */
  onReceiveFromStep?: () => void;
  deliveryZoneHighlight?: boolean;
  /** manual 模式時，點「接受任務」按鈕呼叫 */
  onAcceptQuest?: () => void;
  /** 是否為 manual 承接模式 */
  isManualAcceptMode?: boolean;
  /** 是否為 chained 待承接模式（顯示 acceptText，關閉時自動承接） */
  isChainedPendingMode?: boolean;
  /** 是否為 auto 承接模式（顯示 acceptText，關閉時自動承接） */
  isAutoAcceptMode?: boolean;
  /** forced 模式：是否應顯示 start 對話（第一次與任務 NPC 對話時） */
  showForcedStartDialogue?: boolean;
  /**
   * 「點擊推進」模式：true 時顯示 › 箭頭，tap 面板推進（不可關閉）
   * 涵蓋 talk_to 逐句 及 start 步驟承接中（auto/chained/forced）
   */
  isAdvancingDialogue?: boolean;
  /** 推進對話（talk_to 下一句 / start 承接任務） */
  onAdvance?: () => void;
  /** talk_to 步驟的對話行（當前步驟為 talk_to 且對話對象正確時傳入） */
  talkToLines?: { speaker: string; content: string }[] | null;
  /** 當前 talk_to 句子索引 */
  talkToLineIndex?: number;
  /** 確認 interact_with 步驟完成 */
  onConfirmInteract?: () => void;
  /** 交付錯誤道具時的錯誤訊息 */
  deliveryErrorMessage?: string | null;
}

export function DialoguePanel({
  npcName,
  dialogueKey,
  onClose,
  questPhase,
  quest,
  currentStep = null,
  dialogueNpcId = null,
  completeMessage = null,
  onReceiveFromStep,
  deliveryZoneHighlight = false,
  onAcceptQuest,
  isManualAcceptMode = false,
  isChainedPendingMode = false,
  isAutoAcceptMode = false,
  showForcedStartDialogue = false,
  isAdvancingDialogue = false,
  onAdvance,
  talkToLines = null,
  talkToLineIndex = 0,
  onConfirmInteract,
  deliveryErrorMessage = null,
}: DialoguePanelProps) {
  const lines = getDialogueLines(dialogueKey);

  const startStep = getStartStep(quest);
  const isQuestGiverNpc = startStep?.entityId === dialogueNpcId;

  const acceptedStepLines =
    questPhase === 'accepted' &&
    currentStep &&
    dialogueNpcId &&
    'dialogueByEntity' in currentStep &&
    currentStep.dialogueByEntity?.[dialogueNpcId];

  const isReceiveStepForThisNpc =
    questPhase === 'accepted' &&
    currentStep?.type === 'receive_from' &&
    currentStep.entityId === dialogueNpcId;

  const isInteractStepForThisNpc =
    questPhase === 'accepted' &&
    currentStep?.type === 'interact_with' &&
    currentStep.entityId === dialogueNpcId;

  const showDeliveryZone =
    questPhase === 'accepted' &&
    currentStep?.type === 'deliver_to' &&
    currentStep.entityId === dialogueNpcId;

  const showAcceptText =
    questPhase === 'accepted' &&
    isQuestGiverNpc &&
    currentStep &&
    currentStep.type !== 'start' &&
    currentStep.type !== 'complete' &&
    !isReceiveStepForThisNpc &&
    !isInteractStepForThisNpc &&
    !showDeliveryZone &&
    !showForcedStartDialogue &&
    !(Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0);

  // talk_to 逐句對話模式
  const isPlayingTalkTo =
    talkToLines &&
    talkToLines.length > 0 &&
    talkToLineIndex >= 0 &&
    talkToLineIndex < talkToLines.length;

  const currentTalkToLine = isPlayingTalkTo ? talkToLines[talkToLineIndex] : null;

  const getSpeakerName = (speaker: string): string => {
    if (speaker === 'player') return '你';
    const obj = getObject(speaker);
    return obj?.displayName ?? speaker;
  };

  // talk_to 中 header 顯示當前說話者的名字
  // 主角說話 → header 左側顯示「你」（與 › 同高），內容靠右
  // NPC 說話 → header 左側顯示 NPC 名，內容靠左
  const isPlayerSpeaking = isPlayingTalkTo && currentTalkToLine?.speaker === 'player';
  const headerName = isPlayingTalkTo
    ? getSpeakerName(currentTalkToLine!.speaker)  // 「你」或 NPC 名
    : npcName;

  return (
    // 推進模式（talk_to 或 start 承接中）：點擊整個面板推進
    <div
      className={`absolute inset-x-0 bottom-0 z-[100] bg-[var(--color-panel)] border-t-2 border-[var(--color-primary)] rounded-t-xl p-4 shadow-lg max-h-[45%] flex flex-col${isAdvancingDialogue ? ' cursor-pointer select-none' : ''}`}
      onClick={isAdvancingDialogue ? onAdvance : undefined}
    >
      <div className="flex justify-between items-center mb-2">
        {/* 左側：NPC 名稱（主角說話時空白） */}
        <span className="font-semibold text-yellow-400">
          {isPlayerSpeaking ? '' : headerName}
        </span>
        {/* 右側：主角說話時顯示「你」，緊接推進/關閉按鈕 */}
        <div className="flex items-center gap-2">
          {isPlayerSpeaking && (
            <span className="font-semibold text-yellow-400">你</span>
          )}
          {isAdvancingDialogue ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdvance?.(); }}
              className="text-[var(--color-text-muted)] text-xl leading-none hover:text-[var(--color-text-default)] active:scale-95 transition-all px-1"
              aria-label="繼續"
            >
              ›
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-[var(--color-btn-muted)] text-[var(--color-btn-muted-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              關閉
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto text-sm space-y-2">

        {/* talk_to 步驟：逐句對話模式 */}
        {isPlayingTalkTo && currentTalkToLine && (
          isPlayerSpeaking ? (
            // 主角台詞：內容靠右，名稱「你」已在 header 左側
            <p className="text-white text-right">{currentTalkToLine.content}</p>
          ) : (
            // NPC 台詞：左對齊，名稱已顯示在 header
            <p className="text-white">{currentTalkToLine.content}</p>
          )
        )}

        {/* complete 步驟：顯示完成訊息 */}
        {!isPlayingTalkTo && !showForcedStartDialogue && questPhase === 'accepted' && currentStep?.type === 'complete' && completeMessage && (
          <p className="text-white">{completeMessage}</p>
        )}

        {/* completed 狀態：顯示完成訊息（保留相容） */}
        {!isPlayingTalkTo && questPhase === 'completed' && completeMessage && (
          <p className="text-white">{completeMessage}</p>
        )}

        {/* accepted 狀態：dialogueByEntity 提示台詞 */}
        {!isPlayingTalkTo && !showForcedStartDialogue && questPhase === 'accepted' && Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0 && (
          acceptedStepLines.map((line, i) => <p key={i} className="text-white">{line}</p>)
        )}

        {/* accepted 狀態：無 dialogueByEntity 時顯示 acceptText 作為 fallback */}
        {!isPlayingTalkTo && showAcceptText && startStep?.acceptText && (
          <p className="text-white">{startStep.acceptText}</p>
        )}

        {/* receive_from 步驟：顯示 npcMessage 和領取按鈕 */}
        {!isPlayingTalkTo && !showForcedStartDialogue && questPhase === 'accepted' && isReceiveStepForThisNpc && currentStep.type === 'receive_from' && (
          <>
            <p className="text-white">
              {currentStep.npcMessage ?? currentStep.message}
            </p>
            <button
              type="button"
              onClick={onReceiveFromStep}
              className="mt-2 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {currentStep.actionButtonText ?? '領取'}
            </button>
          </>
        )}

        {/* interact_with 步驟：顯示 npcMessage 和確認按鈕 */}
        {!isPlayingTalkTo && !showForcedStartDialogue && questPhase === 'accepted' && isInteractStepForThisNpc && currentStep.type === 'interact_with' && (
          <>
            {currentStep.npcMessage && (
              <p className="text-white">{currentStep.npcMessage}</p>
            )}
            <button
              type="button"
              onClick={onConfirmInteract}
              className="mt-2 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {currentStep.confirmButtonText ?? '確認'}
            </button>
          </>
        )}

        {/* 其他步驟顯示 message */}
        {!isPlayingTalkTo &&
          !showForcedStartDialogue &&
          questPhase === 'accepted' &&
          !showAcceptText &&
          !(Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0) &&
          !isReceiveStepForThisNpc &&
          !isInteractStepForThisNpc &&
          !showDeliveryZone &&
          currentStep &&
          'message' in currentStep && (
          <p className="text-white">{currentStep.message}</p>
        )}

        {/* deliver_to 步驟：顯示訊息（有錯誤時顯示錯誤訊息） */}
        {!isPlayingTalkTo && !showForcedStartDialogue && showDeliveryZone && currentStep?.type === 'deliver_to' && (
          <p className={deliveryErrorMessage ? 'text-[var(--color-text-error)]' : 'text-white'}>
            {deliveryErrorMessage ?? (currentStep.npcMessage ?? currentStep.message)}
          </p>
        )}

        {/* idle 狀態：manual 模式 */}
        {!isPlayingTalkTo && questPhase === 'idle' && isManualAcceptMode && isQuestGiverNpc && startStep && (
          <>
            <p className="text-white">{startStep.acceptText}</p>
            <button
              type="button"
              onClick={onAcceptQuest}
              className="mt-3 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              接受任務
            </button>
          </>
        )}
        {/* idle 狀態：chained 模式 */}
        {!isPlayingTalkTo && questPhase === 'idle' && isChainedPendingMode && isQuestGiverNpc && startStep && (
          <p className="text-white">{startStep.acceptText}</p>
        )}
        {/* idle 狀態：auto 模式 */}
        {!isPlayingTalkTo && questPhase === 'idle' && isAutoAcceptMode && isQuestGiverNpc && startStep && (
          <p className="text-white">{startStep.acceptText}</p>
        )}
        {/* accepted 狀態：forced 模式第一次對話 */}
        {!isPlayingTalkTo && questPhase === 'accepted' && showForcedStartDialogue && startStep && (
          <p className="text-white">{startStep.acceptText}</p>
        )}
        {/* idle 狀態：非任務承接模式時顯示一般對話 */}
        {!isPlayingTalkTo && questPhase === 'idle' && !isManualAcceptMode && !isChainedPendingMode && !isAutoAcceptMode && (
          <>
            {lines.map((line, i) => (
              <p key={i} className="text-white">{line}</p>
            ))}
          </>
        )}

        {/* 交付區域 */}
        {!isPlayingTalkTo && !showForcedStartDialogue && showDeliveryZone && (
          <div className="mt-2">
            <div
              data-delivery-zone
              className={`min-h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-all duration-150 ${
                deliveryZoneHighlight
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] text-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary-50)]'
                  : 'border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)]'
              }`}
            >
              請把要交付道具拖移至此
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
