import { useState, useCallback, useEffect } from 'react';
import { getItem } from '../data/itemsTable';

export interface SlotItem {
  itemId: string;
  count: number;
}

export interface UseBackpackOptions {
  capacity?: number;
  initialSlots?: SlotItem[];
  /** 變更時將背包重置為 initialSlots（用於切換／重新開始任務） */
  resetKey?: number;
}

function getMaxStack(itemId: string): number {
  const def = getItem(itemId);
  if (def?.maxStack != null) return def.maxStack;
  return def?.stackable ? 99 : 1;
}

function fillSlots(capacity: number, initialSlots: SlotItem[]): (SlotItem | null)[] {
  const arr: (SlotItem | null)[] = Array(capacity).fill(null);
  initialSlots.forEach((s, i) => {
    if (i < capacity) arr[i] = s;
  });
  return arr;
}

export function useBackpack(options: UseBackpackOptions = {}) {
  const { capacity = 10, initialSlots = [], resetKey = 0 } = options;
  const [slots, setSlots] = useState<(SlotItem | null)[]>(() =>
    fillSlots(capacity, initialSlots)
  );

  useEffect(() => {
    setSlots(fillSlots(capacity, initialSlots));
    // 僅在 resetKey 變更時重置（切換／重新開始任務）
  }, [resetKey]);

  const addItem = useCallback((itemId: string, count: number = 1) => {
    const maxStack = getMaxStack(itemId);
    setSlots((prev) => {
      const next = prev.map((s) => (s ? { ...s } : null));
      let remaining = count;
      for (let i = 0; i < next.length && remaining > 0; i++) {
        if (next[i]?.itemId === itemId) {
          const current = next[i]!.count;
          const add = Math.min(remaining, maxStack - current);
          if (add > 0) {
            next[i] = { itemId, count: current + add };
            remaining -= add;
          }
        }
      }
      for (let i = 0; i < next.length && remaining > 0; i++) {
        if (!next[i]) {
          const cnt = Math.min(remaining, maxStack);
          next[i] = { itemId, count: cnt };
          remaining -= cnt;
        }
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number, amount: number = 1) => {
    setSlots((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return next;
      if (cur.count <= amount) next[index] = null;
      else next[index] = { ...cur, count: cur.count - amount };
      return next;
    });
  }, []);

  const moveSlot = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setSlots((prev) => {
      const next = [...prev];
      const from = next[fromIndex];
      const to = next[toIndex];
      next[fromIndex] = to;
      next[toIndex] = from;
      return next;
    });
  }, []);

  const hasItem = useCallback(
    (itemId: string) => slots.some((s) => s?.itemId === itemId),
    [slots]
  );

  /** 從背包移除第一個找到的該道具（用於湖邊消耗玻璃瓶等） */
  const removeFirstItem = useCallback((itemId: string, amount: number = 1) => {
    setSlots((prev) => {
      const next = [...prev];
      let remaining = amount;
      for (let i = 0; i < next.length && remaining > 0; i++) {
        if (next[i]?.itemId === itemId) {
          const take = Math.min(remaining, next[i]!.count);
          if (take >= next[i]!.count) next[i] = null;
          else next[i] = { ...next[i]!, count: next[i]!.count - take };
          remaining -= take;
        }
      }
      return next;
    });
  }, []);

  return { slots, capacity, addItem, removeItem, moveSlot, hasItem, removeFirstItem };
}
