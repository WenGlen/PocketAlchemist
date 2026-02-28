import { useState, useCallback, useRef, useEffect } from 'react';
import { objectTable, npcsByMap, resourceNodes, resourceNodesByMap, labTerrains, labMonsters, getInitialResourceRemainingForMap, getBlockingTerrainsForMap } from '../objects/data/objectsTable';
import type { LastResourceFeedback } from '../objects/resource/resourceEffectRegistry';
import { interactionConfig } from '../config/interactionConfig';
import { getMap } from '../env/map/data/maps';

const PLAYER_SPEED = 200;
const PLAYER_RADIUS = 20;
const SPAWN = { x: 400, y: 300 };
const HP_MAX = 100;
const PROXIMITY_TICK_MS = 100;

function getSpawnForMap(_mapId: string) {
  return SPAWN;
}

function getObstaclesForMap(
  mapId: string,
  terrainClearedIds: Record<string, boolean>
): { x: number; y: number; radius: number }[] {
  const npcs = npcsByMap[mapId] ?? Object.values(objectTable);
  const nodes = resourceNodesByMap[mapId] ?? resourceNodes;
  const list = [
    ...npcs.map((n) => ({ x: n.x, y: n.y, radius: n.radius ?? 24 })),
    ...nodes.map((n) => ({ x: n.x, y: n.y, radius: n.radius })),
    ...getBlockingTerrainsForMap(mapId, terrainClearedIds),
  ];
  return list;
}

function wouldOverlap(
  x: number,
  y: number,
  mapId: string,
  terrainClearedIds: Record<string, boolean>
): boolean {
  return getObstaclesForMap(mapId, terrainClearedIds).some(
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

export type GameOutcome = 'playing' | 'success' | 'fail';

export function useGameState() {
  const [mapId, setMapId] = useState('MAP-field-001');
  const mapData = getMap(mapId);
  const boundsW = mapData?.width ?? 1600;
  const boundsH = mapData?.height ?? 1200;
  const [playerPosition, setPlayerPosition] = useState(() => getSpawnForMap(mapId));
  const [controlRing, setControlRing] = useState<ControlRingState>({
    visible: false,
    screenX: 0,
    screenY: 0,
  });
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueNpcId, setDialogueNpcId] = useState<string | null>(null);
  /** 主線任務：none | accepted | completed；進行中時用 questStepIndex 對應 steps[i] */
  const [questPhase, setQuestPhase] = useState<'none' | 'accepted' | 'completed'>('none');
  /** 當前步驟索引（0-based），僅在 questPhase === 'accepted' 時有效 */
  const [questStepIndex, setQuestStepIndex] = useState(0);
  /** 資源點剩餘可採次數（僅有 maxGather 的節點），key = nodeId */
  const [resourceRemaining, setResourceRemaining] = useState<Record<string, number>>(() =>
    getInitialResourceRemainingForMap('MAP-field-001')
  );
  /** 最後一次觸發的資源互動特效（晃動+浮動文字 或 漣漪+浮動文字），由 MapArea 驅動動畫 */
  const [lastResourceFeedback, setLastResourceFeedback] = useState<LastResourceFeedback | null>(null);
  /** MVP-01：血量（僅 lab 使用） */
  const [hp, setHp] = useState(HP_MAX);
  /** MVP-01：成功 / 失敗 / 進行中 */
  const [gameOutcome, setGameOutcome] = useState<GameOutcome>('playing');
  /** MVP-01：怪物暈眩結束時間戳 */
  const [monsterStunUntil, setMonsterStunUntil] = useState(0);
  /** MVP-01：tap 使用地形（需藥劑清除）時，選中的藥劑 itemId */
  const [selectedPotionItemId, setSelectedPotionItemId] = useState<string | null>(null);
  /** 已清除的地形 id（passable=false + requiredItemId 的地形用藥劑清除後記錄） */
  const [terrainClearedIds, setTerrainClearedIds] = useState<Record<string, boolean>>({});
  /** 當前選中的任務 ID（選單切換任務時更新） */
  const [selectedQuestId, setSelectedQuestId] = useState('QST-main-001');
  /** 選單切換／重新開始時遞增，供背包等重置 */
  const [missionResetKey, setMissionResetKey] = useState(0);
  /** 怪物即時位置（有 patrol 的會隨時間更新；key = monsterId） */
  const [monsterPositions, setMonsterPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(labMonsters.map((m) => [m.id, { x: m.x, y: m.y }]))
  );
  /** 巡邏方向 1 | -1，僅用 ref 在 RAF 內更新，不觸發 re-render */
  const monsterPatrolDirectionRef = useRef<Record<string, 1 | -1>>(
    Object.fromEntries(labMonsters.filter((m) => m.patrol).map((m) => [m.id, 1]))
  );
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

  const acceptQuest = useCallback(() => {
    setQuestPhase('accepted');
    setQuestStepIndex((i) => i + 1);
  }, []);
  const completeQuest = useCallback(() => setQuestPhase('completed'), []);
  const advanceQuestStep = useCallback(() => setQuestStepIndex((i) => i + 1), []);

  /** 資源點：取得剩餘可採次數（無 maxGather 的節點回傳 undefined，視為無限） */
  const getResourceRemaining = useCallback(
    (nodeId: string) => resourceRemaining[nodeId],
    [resourceRemaining]
  );
  /** 資源點：記錄一次採集／交換並觸發對應特效；若有 gatherLimit 會扣剩餘次數 */
  const recordResourceGather = useCallback(
    (nodeId: string, options: { effectId: string; label: string; gatherLimit?: number }) => {
      const { effectId, label, gatherLimit } = options;
      setResourceRemaining((prev) => {
        if (gatherLimit == null) return prev;
        const cur = prev[nodeId] ?? gatherLimit;
        if (cur <= 0) return prev;
        return { ...prev, [nodeId]: cur - 1 };
      });
      setLastResourceFeedback((prev) => ({
        nodeId,
        effectId,
        label,
        key: (prev?.key ?? 0) + 1,
      }));
    },
    []
  );

  /** MVP-01：點擊怪物暈眩 */
  const tryStunMonster = useCallback(() => {
    if (interactionConfig.monsterTapEffect !== 'stun') return;
    setMonsterStunUntil(Date.now() + interactionConfig.monsterStunMs);
  }, []);

  /** 用藥劑清除地形（drag 或 tap 成功後呼叫） */
  const clearTerrain = useCallback((terrainId: string) => {
    setTerrainClearedIds((prev) => ({ ...prev, [terrainId]: true }));
  }, []);

  /** MVP-01：選中藥劑（tap 模式點障礙物時使用） */
  const setSelectedPotion = useCallback((itemId: string | null) => {
    setSelectedPotionItemId(itemId);
  }, []);

  // 互動特效：浮動文字播完後清掉，以便同一節點可再次觸發
  useEffect(() => {
    if (!lastResourceFeedback) return;
    const t = setTimeout(() => setLastResourceFeedback(null), 700);
    return () => clearTimeout(t);
  }, [lastResourceFeedback]);

  /** 選單：選擇任務（切換或重新開始）；傳入該任務的 mapId 與 questId */
  const selectMission = useCallback((nextMapId: string, nextQuestId: string) => {
    setPlayerPosition(getSpawnForMap(nextMapId));
    setMapId(nextMapId);
    setSelectedQuestId(nextQuestId);
    setDialogueOpen(false);
    setDialogueNpcId(null);
    setQuestPhase('none');
    setQuestStepIndex(0);
    setHp(HP_MAX);
    setGameOutcome('playing');
    setMonsterStunUntil(0);
    setSelectedPotionItemId(null);
    setTerrainClearedIds({});
    setResourceRemaining(getInitialResourceRemainingForMap(nextMapId));
    setMonsterPositions(Object.fromEntries(labMonsters.map((m) => [m.id, { x: m.x, y: m.y }])));
    monsterPatrolDirectionRef.current = Object.fromEntries(
      labMonsters.filter((m) => m.patrol).map((m) => [m.id, 1])
    );
    lastTerrainDamageRef.current = {};
    setMissionResetKey((k) => k + 1);
  }, []);

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
        const nx = Math.max(0, Math.min(boundsW, pos.x + dx));
        const ny = Math.max(0, Math.min(boundsH, pos.y + dy));
        if (!wouldOverlap(nx, ny, mapId, terrainClearedIds)) return { x: nx, y: ny };
        if (!wouldOverlap(nx, pos.y, mapId, terrainClearedIds)) return { x: nx, y: pos.y };
        if (!wouldOverlap(pos.x, ny, mapId, terrainClearedIds)) return { x: pos.x, y: ny };
        const halfX = Math.max(0, Math.min(boundsW, pos.x + dx * 0.5));
        const halfY = Math.max(0, Math.min(boundsH, pos.y + dy * 0.5));
        if (!wouldOverlap(halfX, pos.y, mapId, terrainClearedIds)) return { x: halfX, y: pos.y };
        if (!wouldOverlap(pos.x, halfY, mapId, terrainClearedIds)) return { x: pos.x, y: halfY };
        return pos;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [moveDirection, mapId, boundsW, boundsH, terrainClearedIds]);

  // 怪物巡邏：有 patrol 的怪物每幀更新位置（左右或上下來回）
  useEffect(() => {
    if (mapId !== 'MAP-field-001') return;
    let rafId: number;
    let last = 0;
    const tick = (time: number) => {
      const dt = last ? (time - last) / 1000 : 0;
      last = time;
      setMonsterPositions((prev) => {
        const next: Record<string, { x: number; y: number }> = {};
        const dirs = monsterPatrolDirectionRef.current;
        for (const m of labMonsters) {
          if (!m.patrol) {
            next[m.id] = prev[m.id] ?? { x: m.x, y: m.y };
            continue;
          }
          const { axis, range, speed } = m.patrol;
          const baseX = m.x;
          const baseY = m.y;
          const pos = prev[m.id] ?? { x: m.x, y: m.y };
          const offset = axis === 'x' ? pos.x - baseX : pos.y - baseY;
          let dir = dirs[m.id] ?? 1;
          let newOffset = offset + dir * speed * dt;
          if (newOffset >= range) {
            newOffset = range;
            dirs[m.id] = -1;
          } else if (newOffset <= -range) {
            newOffset = -range;
            dirs[m.id] = 1;
          }
          next[m.id] =
            axis === 'x'
              ? { x: baseX + newOffset, y: baseY }
              : { x: baseX, y: baseY + newOffset };
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mapId]);

  const playerPositionRef = useRef(playerPosition);
  playerPositionRef.current = playerPosition;
  const monsterPositionsRef = useRef<Record<string, { x: number; y: number }>>(monsterPositions);
  monsterPositionsRef.current = monsterPositions;
  const monsterLastAttackRef = useRef<Record<string, number>>({});
  const lastTerrainDamageRef = useRef<Record<string, number>>({});

  // MVP-01：proximity 節流 — 地形持續扣血、怪物間隔攻擊（任務完成由 quest complete 步驟觸發）
  useEffect(() => {
    if (mapId !== 'MAP-field-001' || gameOutcome !== 'playing') return;
    const interval = setInterval(() => {
      const pos = playerPositionRef.current;
      const now = Date.now();

      // 地形：範圍內持續扣血（有 damagePerTick 的地形，依 damageIntervalMs 節流）
      for (const terrain of labTerrains) {
        if (terrain.damagePerTick == null) continue;
        const inRange = Math.hypot(pos.x - terrain.x, pos.y - terrain.y) <= terrain.radius;
        const terrainInterval = terrain.damageIntervalMs ?? 100;
        const last = lastTerrainDamageRef.current[terrain.id] ?? 0;
        if (inRange && now - last >= terrainInterval) {
          lastTerrainDamageRef.current[terrain.id] = now;
          setHp((h) => {
            const next = Math.max(0, h - terrain.damagePerTick!);
            if (next <= 0) setGameOutcome('fail');
            return next;
          });
        }
      }

      // 怪物：每隔 attackIntervalMs 攻擊一次，暈眩期間不攻擊（位置以 monsterPositions 為準）
      if (now >= monsterStunUntil) {
        for (const monster of labMonsters) {
          const mpos = monsterPositionsRef.current[monster.id] ?? { x: monster.x, y: monster.y };
          const inRange = Math.hypot(pos.x - mpos.x, pos.y - mpos.y) <= monster.radius;
          const last = monsterLastAttackRef.current[monster.id] ?? 0;
          if (inRange && now - last >= monster.attackIntervalMs) {
            monsterLastAttackRef.current[monster.id] = now;
            setHp((h) => {
              const next = Math.max(0, h - monster.attackDamage);
              if (next <= 0) setGameOutcome('fail');
              return next;
            });
          }
        }
      }
    }, PROXIMITY_TICK_MS);
    return () => clearInterval(interval);
  }, [mapId, gameOutcome, monsterStunUntil]);

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
    questStepIndex,
    setQuestPhase,
    acceptQuest,
    completeQuest,
    advanceQuestStep,
    resourceRemaining,
    getResourceRemaining,
    lastResourceFeedback,
    recordResourceGather,
    hp,
    hpMax: HP_MAX,
    gameOutcome,
    dismissOutcome: useCallback(() => setGameOutcome('playing'), []),
    monsterStunUntil,
    tryStunMonster,
    selectedPotionItemId,
    setSelectedPotion,
    terrainClearedIds,
    clearTerrain,
    monsterPositions,
    selectMission,
    selectedQuestId,
    missionResetKey,
  };
}
