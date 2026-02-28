import type { SelfTestConfig } from "../core/types";

/** 預設自測題題目，掛到遊戲時可改為自己的 config 或從此檔複製修改 */
export const defaultSelfTestConfig: SelfTestConfig = {
  questions: [
    {
      id: "q1",
      order: 1,
      title: "本輪操作手感",
      options: [
        { value: "流暢", label: "流暢" },
        { value: "偶爾卡頓", label: "偶爾卡頓" },
        { value: "常誤觸", label: "常誤觸" },
        { value: "需優化", label: "需優化" },
      ],
    },
    {
      id: "q2",
      order: 2,
      title: "畫面與效能",
      options: [
        { value: "正常", label: "正常" },
        { value: "掉幀", label: "掉幀" },
        { value: "閃退", label: "閃退" },
        { value: "其他", label: "其他" },
      ],
    },
  ],
};
