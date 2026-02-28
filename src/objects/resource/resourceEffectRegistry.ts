/**
 * 資源點互動特效：型別 + 編號對照表，統一管理「採集／交換」的視覺回饋。
 * - LastResourceFeedback：遊戲狀態裡「最後一次觸發」的形狀（nodeId、effectId、label、key）
 * - 編號對照表：effectId → 晃動／漣漪／浮動文字顏色；objectsTable 的 gatherEffectId、requireItemEffectId 引用此編號
 * 未來新增效果（如礦鎬敲擊）只需在此註冊。
 */

/** 最後一次觸發的資源回饋（遊戲狀態用）；effectId 由此檔的編號對照表解析為實際動畫 */
export interface LastResourceFeedback {
  nodeId: string;
  effectId: string;
  label: string;
  key: number;
}

/** 單一特效編號對應的視覺行為 */
export interface ResourceEffectDef {
  /** 是否播放晃動動畫 */
  playShake: boolean;
  /** 是否播放漣漪動畫 */
  playRipple: boolean;
  /** 浮動文字顏色傾向：'success' 綠、「secondary」藍等 */
  floatTextVariant?: 'success' | 'secondary';
}

const registry: Record<string, ResourceEffectDef> = {
  shake_float: {
    playShake: true,
    playRipple: false,
    floatTextVariant: 'success',
  },
  ripple_float: {
    playShake: false,
    playRipple: true,
    floatTextVariant: 'secondary',
  },
};

export function getResourceEffect(effectId: string): ResourceEffectDef | undefined {
  return registry[effectId];
}

export function getResourceEffectOrDefault(effectId: string): ResourceEffectDef {
  return registry[effectId] ?? { playShake: false, playRipple: false, floatTextVariant: 'success' };
}
