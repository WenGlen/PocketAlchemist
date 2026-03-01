import type { SelfTestConfig } from "../core/types";

/**
 * MVP-01 自測題
 *
 * 對應版本：MVP-01.xx
 * 測試重點：interactionConfig 互動矩陣（proximity/tap/drag）、
 *           視覺辨識、怪物壓力感、任務方向感、整體爽感。
 *
 * 切換時機：版本號升至 MVP-02.01 後，改用 mvp02aSelfTest.ts。
 */
export const mvp01SelfTestConfig: SelfTestConfig = {
  questions: [
    {
      id: "m01_q1",
      order: 1,
      title: "採集道具的準確度",
      description:
        "點擊茶樹 / 拖曳玻璃瓶取水 / 採集藥草時，有沒有「想做沒做到」的感覺？",
      options: [
        { value: "每次都準確", label: "每次都準確" },
        { value: "偶爾需要重試", label: "偶爾需要重試" },
        { value: "常常沒反應", label: "常常沒反應" },
        { value: "根本做不到", label: "根本做不到" },
      ],
    },
    {
      id: "m01_q2",
      order: 2,
      title: "靠近觸發（proximity）的自然度",
      description:
        "走到資源點或 NPC 旁邊，提示泡泡出現的時機——有沒有在對的距離才跳出？",
      options: [
        { value: "剛剛好", label: "剛剛好，走到就跳" },
        { value: "觸發太早", label: "觸發太早（還沒走到就跳出）" },
        { value: "觸發太晚", label: "觸發太晚（站在上面才跳）" },
        { value: "沒觸發", label: "根本沒有觸發" },
      ],
    },
    {
      id: "m01_q3",
      order: 3,
      title: "拖曳道具交付的手感",
      description:
        "把道具從背包拖到 NPC 交付區或合成槽時，落點準不準？有沒有「明明放對了卻沒反應」的情況？",
      options: [
        { value: "順暢且準確", label: "順暢且準確" },
        { value: "順暢但常放錯", label: "順暢但常放錯位置" },
        { value: "卡頓或延遲", label: "拖動時卡頓或延遲" },
        { value: "很難完成", label: "很難做到" },
      ],
    },
    {
      id: "m01_q4",
      order: 4,
      title: "怪物帶來的壓力感",
      description:
        "護巢野豬的攻擊範圍和冷卻節奏，有沒有讓你感受到「需要閃避」的壓力？",
      options: [
        { value: "恰到好處", label: "恰到好處，有威脅但不崩潰" },
        { value: "壓力太大", label: "壓力太大，扣血太快" },
        { value: "壓力太弱", label: "壓力太弱，根本不在乎" },
        { value: "沒注意到怪物", label: "全程沒注意到怪物的存在" },
      ],
    },
    {
      id: "m01_q5",
      order: 5,
      title: "任務過程中的方向感",
      description:
        "任何時間點，有沒有清楚知道「下一步要去哪裡、對誰做什麼」？",
      options: [
        { value: "全程清楚", label: "全程清楚" },
        { value: "偶爾搞不清楚", label: "偶爾需要想一下" },
        { value: "常常不知道", label: "常常不知道下一步" },
        { value: "完全不知道", label: "完全不知道在幹嘛" },
      ],
    },
    {
      id: "m01_q6",
      order: 6,
      title: "地圖上物件的辨識度",
      description:
        "進入地圖後，能不能快速分辨 NPC（👨‍💼）/ 資源點（🌳💧）/ 怪物（🐗）/ 地形（毒沼澤、藤蔓）？",
      options: [
        { value: "一眼看清", label: "一眼就能分辨所有物件" },
        { value: "需靠近才清楚", label: "靠近後才能辨識" },
        { value: "很難分辨", label: "很難分辨哪個是哪個" },
        { value: "看不出來", label: "完全看不出來" },
      ],
    },
    {
      id: "m01_q7",
      order: 7,
      title: "這局的整體爽感",
      description: "完成（或失敗）這一局後，你的第一個念頭是什麼？",
      options: [
        { value: "很爽想繼續", label: "很爽，馬上想再玩一局" },
        { value: "還可以", label: "還可以，不排斥再玩" },
        { value: "普通", label: "普通，做完就停了" },
        { value: "不想再玩", label: "不太想再玩第二局" },
      ],
    },
  ],
};
