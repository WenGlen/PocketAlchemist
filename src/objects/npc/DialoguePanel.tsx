//════════════════════════════════════════════════════════════════
// NPC 對話面板
//════════════════════════════════════════════════════════════════
// 顯示 NPC 對話、任務進度步驟
// MVP-02-4 簡化版：自動承接任務，不再顯示任務選擇列表

import { getDialogueLines } from './dialogueData';
import { getStartStep } from '../../quests/data/questData';
import type { QuestDef, QuestStep, QuestPhase, IntroDialogueLine } from '../../quests/data/questData';
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
  /** forced 模式：是否應顯示 start 對話（第一次與任務 NPC 對話時） */
  showForcedStartDialogue?: boolean;
  /** 當前步驟的 introDialogue（未看過時傳入，已看過傳 null） */
  introDialogue?: IntroDialogueLine[] | null;
  /** 當前 introDialogue 句子索引，-1 表示無 */
  introDialogueIndex?: number;
  /** 推進到下一句 introDialogue */
  onAdvanceIntroDialogue?: () => void;
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
  showForcedStartDialogue = false,
  introDialogue = null,
  introDialogueIndex = -1,
  onAdvanceIntroDialogue,
  deliveryErrorMessage = null,
}: DialoguePanelProps) {
  const lines = getDialogueLines(dialogueKey);

  // 取得任務開始步驟（用於顯示 acceptText）
  const startStep = getStartStep(quest);
  const isQuestGiverNpc = startStep?.entityId === dialogueNpcId;

  // 取得當前步驟的 dialogueByEntity 對話（優先於 acceptText）
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

  const showDeliveryZone =
    questPhase === 'accepted' &&
    currentStep?.type === 'deliver_to' &&
    currentStep.entityId === dialogueNpcId;

  // 判斷是否應顯示 acceptText
  // 條件：任務已承接 + 與任務發放 NPC 對話 + 當前步驟沒有專屬顯示邏輯
  // 排除：receive_from/deliver_to 步驟（它們有自己的顯示），以及有 dialogueByEntity 設定的情況
  // 排除：forced 模式第一次對話（由 showForcedStartDialogue 處理）
  const showAcceptText =
    questPhase === 'accepted' &&
    isQuestGiverNpc &&
    currentStep &&
    currentStep.type !== 'start' &&
    currentStep.type !== 'complete' &&
    !isReceiveStepForThisNpc &&
    !showDeliveryZone &&
    !showForcedStartDialogue &&
    !(Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0);

  // ── introDialogue 逐句對話模式 ────────────────────────────────
  const isPlayingIntroDialogue =
    introDialogue &&
    introDialogue.length > 0 &&
    introDialogueIndex >= 0 &&
    introDialogueIndex < introDialogue.length;

  // 取得當前對話句
  const currentIntroLine = isPlayingIntroDialogue ? introDialogue[introDialogueIndex] : null;

  // 取得說話者名稱：'player' 顯示「你」，其他用 entityId 查詢
  const getSpeakerName = (speaker: string): string => {
    if (speaker === 'player') return '你';
    const obj = getObject(speaker);
    return obj?.displayName ?? speaker;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-[100] bg-[var(--color-panel)] border-t-2 border-[var(--color-primary)] rounded-t-xl p-4 shadow-lg max-h-[45%] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-[var(--color-text-default)]">{npcName}</span>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded bg-[var(--color-btn-muted)] text-[var(--color-btn-muted-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
        >
          關閉
        </button>
      </div>
      <div className="flex-1 overflow-auto text-[var(--color-text-default)] text-sm space-y-2">
        {/* introDialogue 逐句對話模式 */}
        {isPlayingIntroDialogue && currentIntroLine && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span
                className={`text-xs font-medium ${
                  currentIntroLine.speaker === 'player'
                    ? 'text-[var(--color-text-muted)]'
                    : 'text-[var(--color-primary)]'
                }`}
              >
                {getSpeakerName(currentIntroLine.speaker)}
              </span>
              <p
                className={
                  currentIntroLine.speaker === 'player'
                    ? 'text-[var(--color-text-default)]'
                    : 'text-[var(--color-primary)]'
                }
              >
                {currentIntroLine.content}
              </p>
            </div>
            <button
              type="button"
              onClick={onAdvanceIntroDialogue}
              className="py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {introDialogueIndex < introDialogue.length - 1 ? '繼續' : '了解'}
            </button>
          </div>
        )}

        {/* complete 步驟：顯示完成訊息（accepted 狀態下的 complete 步驟） */}
        {!isPlayingIntroDialogue && !showForcedStartDialogue && questPhase === 'accepted' && currentStep?.type === 'complete' && completeMessage && (
          <p className="text-[var(--color-text-success)]">{completeMessage}</p>
        )}

        {/* completed 狀態：顯示完成訊息（舊邏輯，保留相容） */}
        {!isPlayingIntroDialogue && questPhase === 'completed' && completeMessage && (
          <p className="text-[var(--color-text-success)]">{completeMessage}</p>
        )}

        {/* accepted 狀態：顯示任務進度相關對話（排除 complete 步驟） */}
        {/* 優先顯示 dialogueByEntity（當前步驟設定的該 NPC 對話） */}
        {!isPlayingIntroDialogue && !showForcedStartDialogue && questPhase === 'accepted' && Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0 && (
          acceptedStepLines.map((line, i) => <p key={i}>{line}</p>)
        )}

        {/* 沒有 dialogueByEntity 時，與任務發放 NPC 對話顯示 acceptText 作為 fallback */}
        {!isPlayingIntroDialogue && showAcceptText && startStep?.acceptText && (
          <p className="text-[var(--color-primary)]">{startStep.acceptText}</p>
        )}

        {/* receive_from 步驟：顯示領取訊息和按鈕 */}
        {!isPlayingIntroDialogue && !showForcedStartDialogue && questPhase === 'accepted' && isReceiveStepForThisNpc && currentStep.type === 'receive_from' && (
          <>
            <p className="text-[var(--color-primary)]">
              {currentStep.receiveMessage ?? currentStep.message}
            </p>
            <button
              type="button"
              onClick={onReceiveFromStep}
              className="mt-2 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {currentStep.receiveButtonText ?? '領取'}
            </button>
          </>
        )}

        {/* 其他步驟顯示 message（非交付區、非領取步驟、非 acceptText 時） */}
        {!isPlayingIntroDialogue &&
          !showForcedStartDialogue &&
          questPhase === 'accepted' &&
          !showAcceptText &&
          !(Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0) &&
          !isReceiveStepForThisNpc &&
          !showDeliveryZone &&
          currentStep &&
          'message' in currentStep && (
          <p className="text-[var(--color-primary)]">{currentStep.message}</p>
        )}

        {/* deliver_to 步驟：顯示訊息（有錯誤時顯示錯誤訊息） */}
        {!isPlayingIntroDialogue && !showForcedStartDialogue && showDeliveryZone && currentStep?.type === 'deliver_to' && (
          <p className={deliveryErrorMessage ? 'text-[var(--color-text-error)]' : 'text-[var(--color-primary)]'}>
            {deliveryErrorMessage ?? currentStep.message}
          </p>
        )}

        {/* idle 狀態：manual 模式顯示任務說明和接受按鈕 */}
        {!isPlayingIntroDialogue && questPhase === 'idle' && isManualAcceptMode && isQuestGiverNpc && startStep && (
          <>
            <p className="text-[var(--color-primary)]">{startStep.acceptText}</p>
            <button
              type="button"
              onClick={onAcceptQuest}
              className="mt-3 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              接受任務
            </button>
          </>
        )}
        {/* idle 狀態：chained 模式顯示任務說明（關閉對話時自動承接） */}
        {!isPlayingIntroDialogue && questPhase === 'idle' && isChainedPendingMode && isQuestGiverNpc && startStep && (
          <>
            <p className="text-[var(--color-primary)]">{startStep.acceptText}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">（關閉對話即承接任務）</p>
          </>
        )}
        {/* accepted 狀態：forced 模式第一次對話顯示 start 的 acceptText（無按鈕） */}
        {!isPlayingIntroDialogue && questPhase === 'accepted' && showForcedStartDialogue && startStep && (
          <p className="text-[var(--color-primary)]">{startStep.acceptText}</p>
        )}
        {/* idle 狀態：非 manual、chained 時顯示一般對話 */}
        {!isPlayingIntroDialogue && questPhase === 'idle' && !isManualAcceptMode && !isChainedPendingMode && (
          <>
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </>
        )}

        {/* 交付區域（introDialogue 播放時、forced start 對話時也隱藏） */}
        {!isPlayingIntroDialogue && !showForcedStartDialogue && showDeliveryZone && (
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
