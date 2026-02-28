import { getDialogueLines } from './dialogueData';
import type { QuestDef, QuestStep } from '../../quests/data/questData';

type QuestPhase = 'none' | 'accepted' | 'completed';

interface DialoguePanelProps {
  npcName: string;
  dialogueKey: string;
  onClose: () => void;
  questPhase: QuestPhase;
  quest: QuestDef | null;
  currentStep?: QuestStep | null;
  dialogueNpcId?: string | null;
  /** 只有此 entity 可承接任務；與他對話才顯示承接按鈕 */
  acceptFromEntityId?: string | null;
  /** 承接前說明文案（來自 start 步驟的 acceptText） */
  acceptText?: string | null;
  /** 任務完成時顯示的訊息（來自最後一步 completeMessage） */
  completeMessage?: string | null;
  onAcceptQuest: () => void;
  /** 在對話窗內點「領取」完成 receive_from 步驟時呼叫 */
  onReceiveFromStep?: () => void;
  deliveryZoneHighlight?: boolean;
}

export function DialoguePanel({
  npcName,
  dialogueKey,
  onClose,
  questPhase,
  quest,
  currentStep = null,
  dialogueNpcId = null,
  acceptFromEntityId = null,
  acceptText = null,
  completeMessage = null,
  onAcceptQuest,
  onReceiveFromStep,
  deliveryZoneHighlight = false,
}: DialoguePanelProps) {
  const lines = getDialogueLines(dialogueKey);
  const canAccept = questPhase === 'none' && dialogueNpcId === acceptFromEntityId && quest;
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
        {questPhase === 'completed' && completeMessage && (
          <p className="text-[var(--color-text-success)]">{completeMessage}</p>
        )}
        {questPhase === 'accepted' && Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0 && (
          acceptedStepLines.map((line, i) => <p key={i}>{line}</p>)
        )}
        {questPhase === 'accepted' && isReceiveStepForThisNpc && currentStep.type === 'receive_from' && (
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
        {questPhase === 'accepted' && !(Array.isArray(acceptedStepLines) && acceptedStepLines.length > 0) && !isReceiveStepForThisNpc && currentStep && 'message' in currentStep && (
          showDeliveryZone ? null : (
            <p className="text-[var(--color-primary)]">
              {currentStep.message}
            </p>
          )
        )}
        {showDeliveryZone && currentStep?.type === 'deliver_to' && (
          <p className="text-[var(--color-primary)]">{currentStep.message}</p>
        )}
        {questPhase === 'none' && (
          <>
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {canAccept && (
              <>
                <p className="text-[var(--color-primary)] mt-2">{acceptText ?? ''}</p>
                <button
                  type="button"
                  onClick={onAcceptQuest}
                  className="mt-2 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  承接任務：{quest.name}
                </button>
              </>
            )}
          </>
        )}
        {questPhase === 'none' && !quest && lines.map((line, i) => <p key={i}>{line}</p>)}
        {showDeliveryZone && (
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
