//════════════════════════════════════════════════════════════════
// 資源點互動特效
//════════════════════════════════════════════════════════════════
// 型別 + 編號對照表，統一管理「採集／交換」的視覺回饋
// effectId → 晃動／漣漪／浮動文字顏色；objectsTable 的 gatherEffectId、requireItemEffectId 引用此編號

// ========== 型別定義 ==========

// 最後一次觸發的資源回饋（遊戲狀態用）
export interface LastResourceFeedback {
  nodeId: string;
  effectId: string;
  label: string;
  key: number;
}

// 單一特效編號對應的視覺行為
export interface ResourceEffectDef {
  playShake: boolean;  // 是否播放晃動動畫
  playRipple: boolean;  // 是否播放漣漪動畫
  floatTextVariant?: 'success' | 'secondary';  // 浮動文字顏色傾向
}

// ========== 特效註冊表 ==========

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
