import { useState, useCallback } from 'react';
import { isMuted, setMuted } from './audioEngine';

/**
 * 提供靜音狀態與切換函式給 UI 元件使用。
 * 內部狀態與 audioEngine 的 module-level 旗標保持同步。
 */
export function useAudioMute(): [boolean, () => void] {
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  const toggle = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
  }, []);

  return [muted, toggle];
}
