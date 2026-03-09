//════════════════════════════════════════════════════════════════
// 裝備欄 Hook
//════════════════════════════════════════════════════════════════
// 管理手持裝備槽（2 格），支援放入與取出

import { useState, useCallback, useEffect } from 'react';
import type { SlotItem } from '../inventory/useBackpack';

export const EQUIP_SLOT_COUNT = 2;

interface UseEquipSlotsOptions {
  initialSlots?: (SlotItem | null)[];
  resetKey?: string | number;
}

export function useEquipSlots({ initialSlots, resetKey }: UseEquipSlotsOptions = {}) {
  const [slots, setSlots] = useState<(SlotItem | null)[]>(() => {
    const base = Array<SlotItem | null>(EQUIP_SLOT_COUNT).fill(null);
    if (initialSlots) initialSlots.forEach((s, i) => { if (i < EQUIP_SLOT_COUNT) base[i] = s; });
    return base;
  });

  useEffect(() => {
    const base = Array<SlotItem | null>(EQUIP_SLOT_COUNT).fill(null);
    if (initialSlots) initialSlots.forEach((s, i) => { if (i < EQUIP_SLOT_COUNT) base[i] = s; });
    setSlots(base);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const setSlot = useCallback((index: number, item: SlotItem | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
  }, []);

  return { slots, setSlot };
}
