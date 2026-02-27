import { useState, useCallback, useRef, useEffect } from 'react';
import { objectTable } from '../objects/data/objectTable';
import { resourceNodes } from '../objects/data/resourceNodes';

const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 20;

const OBSTACLES: { x: number; y: number; radius: number }[] = [
  ...Object.values(objectTable).map((n) => ({ x: n.x, y: n.y, radius: n.radius ?? 24 })),
  ...resourceNodes.map((n) => ({ x: n.x, y: n.y, radius: n.radius })),
];

function wouldOverlap(x: number, y: number): boolean {
  return OBSTACLES.some(
    (o) => Math.hypot(x - o.x, y - o.y) < PLAYER_RADIUS + o.radius
  );
}

export interface ControlRingState {
  visible: boolean;
  screenX: number;
  screenY: number;
}

const KEY_TO_DIR: Record<string, { x: number; y: number }> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function useGameState() {
  const [mapId] = useState('MAP-field-001');
  const [playerPosition, setPlayerPosition] = useState({ x: 400, y: 300 });
  const [controlRing, setControlRing] = useState<ControlRingState>({
    visible: false,
    screenX: 0,
    screenY: 0,
  });
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueNpcId, setDialogueNpcId] = useState<string | null>(null);
  /** 主線任務：none | accepted | need_deliver | completed */
  const [questPhase, setQuestPhase] = useState<'none' | 'accepted' | 'need_deliver' | 'completed'>('none');
  /** 茶樹剩餘可採次數（0 = 已採完） */
  const [teaTreeRemaining, setTeaTreeRemaining] = useState(3);
  const lastTime = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const mapLocked = dialogueOpen;

  const showControlRing = useCallback((screenX: number, screenY: number) => {
    setControlRing({ visible: true, screenX, screenY });
  }, []);

  const hideControlRing = useCallback(() => {
    setControlRing((c) => ({ ...c, visible: false }));
    setMoveDirection((d) => (d.x !== 0 || d.y !== 0 ? { x: 0, y: 0 } : d));
  }, []);

  const openDialogue = useCallback((npcId: string) => {
    setDialogueNpcId(npcId);
    setDialogueOpen(true);
  }, []);

  const closeDialogue = useCallback(() => {
    setDialogueOpen(false);
    setDialogueNpcId(null);
  }, []);

  const acceptQuest = useCallback(() => setQuestPhase('accepted'), []);
  const completeQuest = useCallback(() => setQuestPhase('completed'), []);
  const tryGatherTea = useCallback(() => {
    setTeaTreeRemaining((n) => (n > 0 ? n - 1 : 0));
  }, []);
  const getTeaTreeRemaining = useCallback(() => teaTreeRemaining, [teaTreeRemaining]);

  // 鍵盤方向鍵 / WASD：桌機兼容
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.code];
      if (!dir) return;
      e.preventDefault();
      keysPressed.current.add(e.code);
      setMoveDirection(() => {
        let x = 0;
        let y = 0;
        for (const code of keysPressed.current) {
          const d = KEY_TO_DIR[code];
          if (d) {
            x += d.x;
            y += d.y;
          }
        }
        const len = Math.hypot(x, y);
        if (len > 1) return { x: x / len, y: y / len };
        return { x, y };
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.code];
      if (!dir) return;
      e.preventDefault();
      keysPressed.current.delete(e.code);
      setMoveDirection(() => {
        let x = 0;
        let y = 0;
        for (const code of keysPressed.current) {
          const d = KEY_TO_DIR[code];
          if (d) {
            x += d.x;
            y += d.y;
          }
        }
        const len = Math.hypot(x, y);
        if (len > 1) return { x: x / len, y: y / len };
        return { x, y };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 每幀根據 moveDirection 更新玩家位置
  useEffect(() => {
    let rafId: number;
    const tick = (time: number) => {
      const dt = lastTime.current ? (time - lastTime.current) / 1000 : 0;
      lastTime.current = time;
      setPlayerPosition((pos) => {
        if (Math.abs(moveDirection.x) < 0.01 && Math.abs(moveDirection.y) < 0.01)
          return pos;
        const dx = moveDirection.x * PLAYER_SPEED * dt;
        const dy = moveDirection.y * PLAYER_SPEED * dt;
        let nx = Math.max(0, Math.min(1600, pos.x + dx));
        let ny = Math.max(0, Math.min(1200, pos.y + dy));
        if (wouldOverlap(nx, ny)) return pos;
        return { x: nx, y: ny };
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [moveDirection]);

  return {
    mapId,
    playerPosition,
    setPlayerPosition,
    controlRing,
    showControlRing,
    hideControlRing,
    moveDirection,
    setMoveDirection,
    dialogueOpen,
    dialogueNpcId,
    openDialogue,
    closeDialogue,
    mapLocked,
    questPhase,
    acceptQuest,
    completeQuest,
    tryGatherTea,
    getTeaTreeRemaining,
  };
}
