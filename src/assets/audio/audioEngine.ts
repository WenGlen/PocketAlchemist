//════════════════════════════════════════════════════════════════
// 音效引擎
//════════════════════════════════════════════════════════════════
// 使用 Web Audio API 即時合成，無需外部音頻檔案
// 所有音效 ID 與觸發時機集中定義於此，不散落至各元件
// 靜音狀態透過 setMuted() 切換，持久化於 localStorage
// damage 音效內建防疊播冷卻（DAMAGE_COOLDOWN_MS），適用頻繁扣血場景

// ========== 型別定義 ==========

export type SoundId = 'gather' | 'synthesize' | 'damage' | 'success' | 'fail' | 'stun';

// ========== 內部狀態 ==========

let _ctx: AudioContext | null = null;

function getMuted(): boolean {
  try {
    return localStorage.getItem('pa_audio_muted') === 'true';
  } catch {
    return false;
  }
}

let _muted: boolean = getMuted();

let _lastDamageTime = 0;  // damage 音效最後播放時間（防疊播用）
const DAMAGE_COOLDOWN_MS = 400;

function getCtx(): AudioContext | null {
  if (_muted) return null;
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

// ========== 內部工具 ==========

// 播放單音：oscillator 掃頻 + 線性 gain envelope
// startOffset：相對 ctx.currentTime 的秒數延遲，用於連音合成
function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  duration: number,
  gain: number,
  startOffset = 0
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime + startOffset;
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== freqStart) {
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
  }
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + 0.005);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.005);
}

// ========== 靜音控制 ==========

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(value: boolean): void {
  _muted = value;
  try {
    localStorage.setItem('pa_audio_muted', String(value));
  } catch {}
}

// ========== 音效播放 ==========

// 播放音效。在任何元件或 hook 中均可直接呼叫（非 React hook，無 stale closure 問題）
// 音效對應語意：
//   gather     : 採集素材 / 拖曳交換完成
//   synthesize : 合成成功
//   damage     : 怪物攻擊或地形扣血（含 400ms 防疊播）
//   success    : 任務完成
//   fail       : HP 歸零，遊戲失敗
//   stun       : 點擊怪物觸發暈眩
export function playSound(id: SoundId): void {
  if (_muted) return;

  if (id === 'damage') {
    const now = Date.now();
    if (now - _lastDamageTime < DAMAGE_COOLDOWN_MS) return;
    _lastDamageTime = now;
  }

  const ctx = getCtx();
  if (!ctx) return;

  switch (id) {
    case 'gather':
      // 明亮短促的採集提示音
      playTone(ctx, 'sine', 700, 950, 0.12, 0.28);
      break;

    case 'synthesize':
      // 兩音上行的合成完成音
      playTone(ctx, 'sine', 523, 523, 0.12, 0.22, 0);
      playTone(ctx, 'sine', 784, 784, 0.15, 0.22, 0.1);
      break;

    case 'damage':
      // 短促低沉的受傷衝擊音
      playTone(ctx, 'sawtooth', 190, 70, 0.09, 0.38);
      break;

    case 'success':
      // C5–E5–G5–C6 四音上行琶音，任務完成感
      playTone(ctx, 'sine', 523, 523, 0.12, 0.22, 0);
      playTone(ctx, 'sine', 659, 659, 0.12, 0.22, 0.1);
      playTone(ctx, 'sine', 784, 784, 0.14, 0.22, 0.2);
      playTone(ctx, 'sine', 1047, 1047, 0.2, 0.22, 0.32);
      break;

    case 'fail':
      // 下行衰退音，表現失敗氣氛
      playTone(ctx, 'sine', 360, 110, 0.45, 0.28);
      break;

    case 'stun':
      // 快速雙音「咚 → 叮」表現擊中怪物
      playTone(ctx, 'sawtooth', 380, 180, 0.06, 0.32, 0);
      playTone(ctx, 'sine', 620, 620, 0.07, 0.22, 0.07);
      break;
  }
}
