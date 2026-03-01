import type { SelfTestConfig } from "../core/types";

/**
 * MVP-02.A 自測題 — 音效系統初版
 *
 * 對應版本：MVP-02.01（音效 `src/audio/` 模組完成後啟用）
 * 測試重點：音效與動作的對應準確度、音效對手感的提升感、
 *           連續觸發時的表現、靜音開關易用度。
 *
 * 切換時機：版本號升至 MVP-02.02 後，改用 mvp02bSelfTest.ts。
 * 保留規則：本檔不刪除，供歷史數據比對。
 */
export const mvp02aSelfTestConfig: SelfTestConfig = {
  questions: [
    {
      id: "m02a_q1",
      order: 1,
      title: "音效與動作的對應準確度",
      description:
        "採集道具、完成合成、受到怪物攻擊時，音效有沒有在「對的瞬間」響起？",
      options: [
        { value: "完全準確", label: "每個動作都有對應，時機精準" },
        { value: "大多準確", label: "大多準確，偶爾有一點延遲" },
        { value: "對不上動作", label: "音效和動作有點對不上" },
        { value: "完全對不上", label: "完全對不上，或根本沒聲音" },
      ],
    },
    {
      id: "m02a_q2",
      order: 2,
      title: "音效對遊戲手感的提升感",
      description:
        "和沒有音效的版本相比，加上音效後整體感覺有沒有更好？",
      options: [
        { value: "明顯更有感", label: "明顯更有感，手感飛躍" },
        { value: "有一點差別", label: "有一點差別，但不大" },
        { value: "幾乎沒差", label: "幾乎沒差，感受不到" },
        { value: "反而干擾", label: "音效反而讓人分心或覺得煩" },
      ],
    },
    {
      id: "m02a_q3",
      order: 3,
      title: "連續快速採集時的音效表現",
      description:
        "連續快速點擊茶樹或採集多個資源時，音效是否自然、不會堆疊爆音？",
      options: [
        { value: "自然不堆疊", label: "自然，不會堆疊爆音" },
        { value: "偶爾堆疊", label: "偶爾有點堆疊感" },
        { value: "明顯堆疊", label: "明顯堆疊，有點刺耳" },
        { value: "沒聲音", label: "連續觸發後直接沒聲音了" },
      ],
    },
    {
      id: "m02a_q4",
      order: 4,
      title: "受傷音效的緊張感",
      description:
        "進入怪物或毒沼澤範圍持續扣血時，音效是否強化了「趕快離開」的緊張感？",
      options: [
        { value: "很有緊張感", label: "很有緊張感，讓人想趕快閃" },
        { value: "稍有提示", label: "有聽到但緊張感不強" },
        { value: "沒感覺", label: "聽到了但沒有特別感覺" },
        { value: "反效果", label: "音效很奇怪或反而讓人不在意" },
      ],
    },
    {
      id: "m02a_q5",
      order: 5,
      title: "靜音開關的易用性",
      description:
        "TopBar 右上角的靜音按鈕，能不能快速找到並切換？切換後是否立即生效？",
      options: [
        { value: "很好用", label: "一眼找到，切換立即生效" },
        { value: "找到但麻煩", label: "找到了但位置不順手" },
        { value: "不太容易找", label: "需要找一下才看到" },
        { value: "根本找不到", label: "根本不知道在哪裡" },
      ],
    },
    {
      id: "m02a_q6",
      order: 6,
      title: "這局的整體爽感（含音效）",
      description: "和之前沒有音效的版本相比，這局玩起來感覺如何？",
      options: [
        { value: "明顯更爽", label: "明顯更爽，有加分" },
        { value: "差不多", label: "差不多，音效沒有特別影響" },
        { value: "音效有點問題", label: "音效有點問題，但遊戲本身還可以" },
        { value: "不如預期", label: "比沒有音效更糟" },
      ],
    },
  ],
};
