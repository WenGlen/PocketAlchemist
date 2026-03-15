import { forwardRef, useImperativeHandle, useState } from 'react';
import type { QuestStep, DialogueLine } from '../../../quests/data/questData';
import { EntitySelect } from '../EntitySelect';
import { BubbleEditor } from '../BubbleEditor';
import { DialogueByEntityEditor } from '../DialogueByEntityEditor';
import type { DialogueByEntity } from '../DialogueByEntityEditor';
import { StepCompleteEditor, DEFAULT_COMPLETE, parseOnStepComplete, buildOnStepComplete } from '../StepCompleteEditor';
import type { StepCompleteState } from '../StepCompleteEditor';
import { NpcOverrideEditor, recordToOverrideArray, arrayToOverrideRecord } from '../NpcOverrideEditor';
import type { NpcOverride } from '../NpcOverrideEditor';
import { NPC_OPTIONS } from '../../adminConstants';

type TalkToStep = Extract<QuestStep, { type: 'talk_to' }>;

export interface TalkToStepEditorHandle {
  getStep: () => TalkToStep;
}

interface Props {
  initialStep?: TalkToStep;
}

const INPUT = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const SELECT = 'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

// 說話者選項：主角 + 所有 NPC
const SPEAKER_OPTIONS = [
  { value: 'player', label: '你（主角）' },
  ...NPC_OPTIONS.map((n) => ({ value: n.id, label: `${n.emoji} ${n.name}` })),
];

function getSpeakerLabel(speaker: string): string {
  return SPEAKER_OPTIONS.find((o) => o.value === speaker)?.label ?? speaker;
}

export const TalkToStepEditor = forwardRef<TalkToStepEditorHandle, Props>(
  function TalkToStepEditor({ initialStep }, ref) {
    const [entityId, setEntityId] = useState(initialStep?.entityId ?? '');
    const [lines, setLines] = useState<DialogueLine[]>(initialStep?.lines ?? []);
    const [message, setMessage] = useState(initialStep?.message ?? '');
    const [bubble, setBubble] = useState({
      bubbleEntityId: initialStep?.bubbleEntityId ?? '',
      bubbleItemId: '',
      bubbleLabel: initialStep?.bubbleLabel ?? '',
    });
    const [dialogueByEntity, setDialogueByEntity] = useState<DialogueByEntity>(
      initialStep?.dialogueByEntity ?? {}
    );
    const [onComplete, setOnComplete] = useState<StepCompleteState>(() =>
      parseOnStepComplete(initialStep?.onStepComplete)
    );
    const [npcOverrides, setNpcOverrides] = useState<NpcOverride[]>(() =>
      recordToOverrideArray(initialStep?.npcPositionOverrides)
    );
    const [npcOverrideOpen, setNpcOverrideOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      getStep: () => {
        const stepComplete = buildOnStepComplete(onComplete);
        const overrides = arrayToOverrideRecord(npcOverrides);
        return {
          type: 'talk_to',
          entityId,
          lines,
          ...(message && { message }),
          ...(bubble.bubbleEntityId && { bubbleEntityId: bubble.bubbleEntityId }),
          ...(bubble.bubbleLabel && { bubbleLabel: bubble.bubbleLabel }),
          ...(Object.keys(dialogueByEntity).length > 0 && { dialogueByEntity }),
          ...(stepComplete !== undefined && { onStepComplete: stepComplete }),
          ...(overrides && { npcPositionOverrides: overrides }),
        };
      },
    }));

    // ── 對話行操作 ───────────────────────────────────────────────

    const addLine = () => {
      setLines((prev) => [...prev, { speaker: entityId || 'player', content: '' }]);
    };

    const updateLine = (idx: number, patch: Partial<DialogueLine>) => {
      setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    };

    const deleteLine = (idx: number) => {
      setLines((prev) => prev.filter((_, i) => i !== idx));
    };

    const moveLine = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= lines.length) return;
      setLines((prev) => {
        const next = [...prev];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      });
    };

    return (
      <div className="space-y-4">
        {/* 對話目標 NPC */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            對話目標 NPC <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">entityId</span>
          </label>
          <EntitySelect value={entityId} onChange={setEntityId} />
        </div>

        {/* 對話行編輯 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              對話內容 <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400 text-xs">lines</span>
            </label>
            <span className="text-xs text-gray-400">{lines.length} 句 ── 玩家依序點擊讀完後步驟自動完成</span>
          </div>

          <div className="space-y-2">
            {lines.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                尚無對話行，點下方按鈕新增
              </div>
            )}
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5"
              >
                {/* 序號 */}
                <span className="mt-1.5 w-5 shrink-0 text-center text-xs font-bold text-gray-400">{idx + 1}</span>

                {/* 說話者 */}
                <select
                  value={line.speaker}
                  onChange={(e) => updateLine(idx, { speaker: e.target.value })}
                  className={`${SELECT} w-40 shrink-0`}
                >
                  {SPEAKER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* 台詞內容 */}
                <textarea
                  value={line.content}
                  onChange={(e) => updateLine(idx, { content: e.target.value })}
                  rows={2}
                  placeholder="輸入台詞…"
                  className={`${INPUT} flex-1`}
                />

                {/* 操作按鈕 */}
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveLine(idx, -1)}
                    disabled={idx === 0}
                    title="上移"
                    className="rounded p-1 text-xs text-gray-400 hover:bg-gray-200 disabled:opacity-25"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveLine(idx, 1)}
                    disabled={idx === lines.length - 1}
                    title="下移"
                    className="rounded p-1 text-xs text-gray-400 hover:bg-gray-200 disabled:opacity-25"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => deleteLine(idx)}
                    title="刪除"
                    className="rounded p-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="mt-2 w-full rounded-lg border border-dashed border-sky-300 py-2 text-sm text-sky-600 hover:border-sky-400 hover:bg-sky-50"
          >
            + 新增對話行
          </button>

          {/* 預覽 */}
          {lines.length > 0 && (
            <div className="mt-3 rounded-lg bg-sky-50 p-3">
              <p className="mb-2 text-xs font-medium text-sky-700">預覽順序</p>
              <ol className="space-y-1">
                {lines.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-sky-800">
                    <span className="w-4 shrink-0 font-bold text-sky-500">{i + 1}.</span>
                    <span className="font-medium text-sky-600 shrink-0">{getSpeakerLabel(l.speaker)}：</span>
                    <span className="text-gray-700">{l.content || '（空台詞）'}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* 任務追蹤提示 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            任務追蹤提示
            <span className="ml-1 font-normal text-gray-400 text-xs">message</span>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例：去找茶攤老闆說話。"
            className={INPUT}
          />
          <p className="mt-1 text-xs text-gray-400">顯示於任務追蹤 UI</p>
        </div>

        <StepCompleteEditor value={onComplete} onChange={setOnComplete} npcOnly />
        <BubbleEditor value={bubble} onChange={setBubble} entityIdDefault={entityId} />
        <DialogueByEntityEditor value={dialogueByEntity} onChange={setDialogueByEntity} />

        <div className="rounded-md border border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setNpcOverrideOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>
              此步驟 NPC 位置覆蓋（npcPositionOverrides）
              {npcOverrides.length > 0 && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">{npcOverrides.length}</span>
              )}
            </span>
            <span className="text-gray-400">{npcOverrideOpen ? '▲' : '▼'}</span>
          </button>
          {npcOverrideOpen && (
            <div className="border-t border-gray-200 px-4 pb-4 pt-3">
              <NpcOverrideEditor value={npcOverrides} onChange={setNpcOverrides} />
            </div>
          )}
        </div>

        <div className="rounded-md bg-sky-50 px-4 py-3 text-sm text-sky-700">
          <strong>talk_to</strong>：純對話步驟。玩家點擊目標 NPC 後逐句播放台詞，跑完所有台詞後步驟<strong>自動銜接</strong>到下一步，無法中途關閉。
          若需要在對話結束後顯示/隱藏某個 NPC，使用上方的「步驟完成後 NPC 變化」。
        </div>
      </div>
    );
  }
);

export { DEFAULT_COMPLETE };
