import { getDialogueLines } from './dialogueData';
import type { QuestDef } from '../../quests/data/questData';

type QuestPhase = 'none' | 'accepted' | 'need_deliver' | 'completed';

interface DialoguePanelProps {
  npcName: string;
  dialogueKey: string;
  onClose: () => void;
  questPhase: QuestPhase;
  quest: QuestDef | null;
  onAcceptQuest: () => void;
  /** 拖曳道具到交付區上時高亮 */
  deliveryZoneHighlight?: boolean;
}

export function DialoguePanel({
  npcName,
  dialogueKey,
  onClose,
  questPhase,
  quest,
  onAcceptQuest,
  deliveryZoneHighlight = false,
}: DialoguePanelProps) {
  const lines = getDialogueLines(dialogueKey);

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
        {questPhase === 'completed' && quest && (
          <p className="text-[var(--color-text-success)]">任務完成！謝謝你的茶。</p>
        )}
        {questPhase === 'accepted' && quest && (
          <p className="text-[var(--color-primary)]">{quest.acceptText}</p>
        )}
        {questPhase === 'none' && quest && (
          <>
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <button
              type="button"
              onClick={onAcceptQuest}
              className="mt-2 py-2 px-4 rounded bg-[var(--color-btn-emphasized)] text-[var(--color-btn-emphasized-text)] text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              承接任務：{quest.name}
            </button>
          </>
        )}
        {questPhase === 'accepted' && quest && (
          <div className="mt-2">
            <p className="text-[var(--color-text-muted)] text-xs mb-1">交付道具（拖曳到此）：</p>
            <div
              data-delivery-zone
              className={`min-h-[48px] rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-all duration-150 ${
                deliveryZoneHighlight
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-25)] text-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary-50)]'
                  : 'border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)]'
              }`}
            >
              拖曳「不好喝的茶」到這裡
            </div>
          </div>
        )}
        {questPhase === 'none' && !quest && lines.map((line, i) => <p key={i}>{line}</p>)}
      </div>
    </div>
  );
}
