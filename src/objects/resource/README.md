# 資源點與互動特效

本目錄為**物件範疇 > 資源點系統**，負責地圖上資源節點的取得方式、次數條件、特效編號與靠近泡泡的統一管理。

## 取得方式（一致邏輯，不同動態效果）

- **tap**：點擊直接獲得（茶樹、藥草）；設 `acquisitionType: 'tap'`、`gatherItemId`。
- **exchange**：給予道具後交換（湖：玻璃瓶→裝水的玻璃瓶）；設 `acquisitionType: 'exchange'`、`requireItemId`、`resultItemId`。
- **tool**：使用工具取得（預留，如十字鎬敲礦區得鐵礦石）。

## 次數與條件

- `gatherLimitByMap: Record<mapId, number>`：依地圖綁定可採次數；未列出的地圖為無限。
  - 例：水無限＝不設；茶葉僅第一關 3 次＝`{ 'MAP-field-001': 3 }`。

## 特效編號與回饋型別

- `resourceEffectRegistry.ts`：同時定義 `LastResourceFeedback` 型別（遊戲狀態用）與特效編號對照表（如 `shake_float`、`ripple_float`）；節點以 `gatherEffectId` / `requireItemEffectId` 引用。
- 採集／交換成功時的浮動文字：`gatherFloatText`、`exchangeFloatText` 在 `objectsTable` 設定。

## 靠近泡泡

- `proximityBubbleText`：靠近可取得資源時，節點上方顯示與可接任務同風格的泡泡，文案在 `objectsTable` 設定（如「可採集茶葉」「拖曳玻璃瓶至此裝水」）。

## 新增資源

1. 在 `objectsTable.ts` 新增節點：`acquisitionType`、`gatherItemId` 或 `requireItemId`/`resultItemId`、`gatherLimitByMap`（可選）、`gatherEffectId`/`requireItemEffectId`、`gatherFloatText`/`exchangeFloatText`、`proximityBubbleText`。
2. 若為新特效，在 `resourceEffectRegistry.ts` 的編號對照表註冊。
3. 不需改 `ResourceNodeView` 或 `MapArea`，邏輯與特效會依節點定義自動套用。
