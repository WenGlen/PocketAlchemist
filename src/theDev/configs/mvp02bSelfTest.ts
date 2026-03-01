import type { SelfTestConfig } from "../core/types";

/**
 * MVP-02.B 自測題 — 第二張地圖 + 三任務串鏈
 *
 * 對應版本：MVP-02.02（MAP-field-002 與 QST-main-003/004/005 完成後啟用）
 * 測試重點：任務解鎖感、新地圖第一印象、三任務故事連貫感、
 *           物件密度、NPC 複用辨識度、整體爽感。
 *
 * 前提：此 config 需在 B.e（選單 UI 完成）後才有意義測試。
 * 保留規則：本檔不刪除，供歷史數據比對。
 */
export const mvp02bSelfTestConfig: SelfTestConfig = {
  questions: [
    {
      id: "m02b_q1",
      order: 1,
      title: "完成任務後的解鎖感",
      description:
        "完成一個任務後，在選單裡看到下一個任務從鎖定變為可選的那一刻，有沒有「解鎖了！」的成就感？",
      options: [
        { value: "很有成就感", label: "很清楚，有明確的成就感" },
        { value: "看得到但平淡", label: "看得到變化，但感覺平淡" },
        { value: "需要自己去找", label: "要主動去開選單才發現" },
        { value: "完全沒感覺", label: "完全沒感受到解鎖" },
      ],
    },
    {
      id: "m02b_q2",
      order: 2,
      title: "進入山丘小鎮的第一印象",
      description:
        "剛進入 MAP-field-002（山丘小鎮），5 秒內能不能一眼看清「所有互動點在哪裡」？",
      options: [
        { value: "一眼清楚", label: "一眼就清楚，知道要去哪裡" },
        { value: "看了一下才清楚", label: "看了幾秒才搞清楚" },
        { value: "需要四處走才找到", label: "要到處走才能找到所有互動點" },
        { value: "完全不知道", label: "完全不知道要幹嘛" },
      ],
    },
    {
      id: "m02b_q3",
      order: 3,
      title: "新地圖與舊地圖的差異感",
      description:
        "山丘小鎮（MAP-field-002）跟野外初生地（MAP-field-001）相比，感覺有沒有明顯不同？",
      options: [
        { value: "明顯不同", label: "明顯不同，像是新的世界區域" },
        { value: "有點不同", label: "有一點不同，但不強烈" },
        { value: "差不多", label: "感覺差不多，像換皮" },
        { value: "更差", label: "新地圖比舊的更難搞清楚" },
      ],
    },
    {
      id: "m02b_q4",
      order: 4,
      title: "003 → 004 → 005 三任務的連貫感",
      description:
        "連玩三個串鏈任務後，有沒有感覺「這三個任務是同一個故事的一部分」？",
      options: [
        { value: "很連貫", label: "很連貫，像是同一段旅程" },
        { value: "有一點關聯", label: "有一點關聯，但不強烈" },
        { value: "像獨立任務", label: "感覺像三個互不相干的任務" },
        { value: "完全沒關聯", label: "完全感受不到任何關聯" },
      ],
    },
    {
      id: "m02b_q5",
      order: 5,
      title: "地圖上的物件密度",
      description:
        "山丘小鎮地圖上的物件數量，是否「剛好夠用」而不讓視線混亂？",
      options: [
        { value: "剛好清爽", label: "剛好清爽，一眼看清" },
        { value: "稍多但還好", label: "稍微多了一點，但還可以接受" },
        { value: "有點擁擠", label: "有點擁擠，視線有點混亂" },
        { value: "太擠了", label: "太多了，不知道該看哪裡" },
      ],
    },
    {
      id: "m02b_q6",
      order: 6,
      title: "NPC 在新地圖的辨識度",
      description:
        "山丘小鎮裡的 NPC（複用舊角色），位置和大小是否讓你感覺「這個角色在這裡是合理的」？",
      options: [
        { value: "很合理", label: "位置合理，很自然" },
        { value: "還可以", label: "還可以，不算奇怪" },
        { value: "位置奇怪", label: "NPC 的位置感覺有點奇怪" },
        { value: "根本找不到", label: "找了很久才找到 NPC" },
      ],
    },
    {
      id: "m02b_q7",
      order: 7,
      title: "這局（串鏈任務）的整體爽感",
      description:
        "連玩完 003 → 004 → 005 三個任務後，整體體驗如何？",
      options: [
        { value: "很爽想繼續", label: "很爽，想繼續看後續任務" },
        { value: "還可以", label: "還可以，有完成感" },
        { value: "普通", label: "普通，沒有特別感受" },
        { value: "不想再玩", label: "任務串鏈讓體驗變差了" },
      ],
    },
  ],
};
