import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDER_CODE = `// ═══════════════════════════════════════════════════════════════
// questData.ts  —  由後台自動生成
// 生成時間：${new Date().toLocaleString('zh-TW')}
// ═══════════════════════════════════════════════════════════════

export const QST_MAIN_001: QuestDef = {
  id: 'QST-main-001',
  name: '要喝茶',
  description: '茶攤老闆想喝茶。採茶葉、用玻璃瓶裝湖水、合成後交付。',
  steps: [
    { type: 'start', entityId: 'OBJ-npc-001', acceptText: '幫我弄一杯茶吧。去採茶葉、湖邊用玻璃瓶裝水，合成成茶再拿來。' },
    {
      type: 'deliver_to',
      entityId: 'OBJ-npc-001',
      itemId: 'ITM-pot-0001',
      wrongItemMessage: '不是這個，我要的是茶。',
      message: '請把茶交付給茶攤老闆。',
    },
    { type: 'complete', completeMessage: '你的茶不太好喝啊...但還是謝謝你的茶。' },
  ],
};

// ... (其他任務)

export const questTable: Record<string, QuestDef> = {
  [QST_MAIN_001.id]: QST_MAIN_001,
  // ...
};`;

export function CodePreviewModal({ open, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCopy = () => {
    if (textareaRef.current) {
      navigator.clipboard.writeText(textareaRef.current.value).catch(() => {
        textareaRef.current?.select();
        document.execCommand('copy');
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">匯出 questData.ts</h2>
            <p className="text-sm text-gray-500">複製以下內容並覆蓋 src/quests/data/questData.ts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
            >
              複製全部
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              關閉
            </button>
          </div>
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            ref={textareaRef}
            readOnly
            value={PLACEHOLDER_CODE}
            className="h-full w-full resize-none rounded-md border border-gray-200 bg-gray-950 px-4 py-3 font-mono text-xs text-green-400 focus:outline-none"
          />
        </div>

        {/* Warning */}
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-3">
          <p className="text-xs text-amber-700">
            ⚠ 請將此內容複製並覆蓋 <code className="rounded bg-amber-100 px-1">src/quests/data/questData.ts</code>
            ，覆蓋前請備份原始檔案。
          </p>
        </div>
      </div>
    </div>
  );
}
