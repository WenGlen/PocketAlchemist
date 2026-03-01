//════════════════════════════════════════════════════════════════
// 遊戲狀態 Hook
//════════════════════════════════════════════════════════════════
// 管理玩家位置、血量、任務進度、怪物暈眩、地形清除等遊戲核心狀態
// 提供 selectMission、tryStunMonster、clearTerrain 等操作接口

import { useState, useCallback, useRef, useEffect } from 'react';
import { objectTable, npcsByMap, resourceNodes, resourceNodesByMap, objTerrains, objMonsters, getInitialResourceRemainingForMap, getBlockingTerrainsForMap, getLabMonster } from '../objects/data/objectsTable';
import type { LastResourceFeedback } from '../objects/resource/resourceEffectRegistry';
import { interactionConfig } from './interactionConfig';
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  DEFAULT_SPAWN,
  HP_MAX,
} from '../player/playerConstants';
import {
  PROXIMITY_TICK_MS,
  DEFAULT_MAP_WIDTH,
  DEFAULT_MAP_HEIGHT,
  DEFAULT_MAP_ID,
  DEFAULT_QUEST_ID,
} from '../maps/mapConstants';
import { DEFAULT_ENTITY_RADIUS, FEEDBACK_CLEAR_MS, STUN_FEEDBACK_CLEAR_MS } from '../objects/objectsConstants';
import { getMap } from '../maps/data/mapsTable';
import { playSound } from '../assets/audio';

// ========== 工具函數 ==========

function getSpawnForMap(mapId: string) {
  const mapData = getMap(mapId);
  return mapData?.spawnPoint ?? DEFAULT_SPAWN;
}

function getObstaclesForMap(
  mapId: string,
  terrainClearedIds: Record<string, boolean>
): { x: number; y: number; radius: number }[] {
  const npcs = npcsByMap[mapId] ?? Object.values(objectTable);
  const nodes = resourceNodesByMap[mapId] ?? resourceNodes;
  const list = [
    // NPC 碰撞以 positionByMap 優先，確保切換地圖後碰撞體在正確位置
    ...npcs.map((n) => {
      const pos = n.positionByMap?.[mapId];
      return { x: pos?.x ?? n.x, y: pos?.y ?? n.y, radius: n.radius ?? DEFAULT_ENTITY_RADIUS };
    }),
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

// ========== 型別定義 ==========

export interface ControlRingState {
  visible: boolean;
  screenX: number;
  screenY: number;
}

// 鍵盤方向對映
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

// ========== 主 Hook ==========

export function useGameState() {
  // ── 核心狀態 ────────────────────────────────────────────────────
  const [mapId, setMapId] = useState(DEFAULT_MAP_ID);
  const mapData = getMap(mapId);
  const boundsW = mapData?.width ?? DEFAULT_MAP_WIDTH;
  const boundsH = mapData?.height ?? DEFAULT_MAP_HEIGHT;
  const [playerPosition, setPlayerPosition] = useState(() => getSpawnForMap(mapId));
  const [controlRing, setControlRing] = useState<ControlRingState>({
    visible: false,
    screenX: 0,
    screenY: 0,
  });
  const [moveDirection, setMoveDirection] = useState({ x: 0, y: 0 });
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueNpcId, setDialogueNpcId] = useState<string | null>(null);
  const [questPhase, setQuestPhase] = useState<'none' | 'accepted' | 'completed'>('none');  // 主線任務：none | accepted | completed
  const [questStepIndex, setQuestStepIndex] = useState(0);  // 當前步驟索引（0-based）
  const [resourceRemaining, setResourceRemaining] = useState<Record<string, number>>(() =>
    getInitialResourceRemainingForMap(DEFAULT_MAP_ID)
  );  // 資源點剩餘可採次數（key = nodeId）
  const [lastResourceFeedback, setLastResourceFeedback] = useState<LastResourceFeedback | null>(null);  // 最後觸發的資源互動特效
  const [hp, setHp] = useState(HP_MAX);  // MVP-01：血量
  const hpRef = useRef(HP_MAX);  // 同步追蹤 hp 的 ref，供 RAF / setInterval 判斷音效
  const [gameOutcome, setGameOutcome] = useState<GameOutcome>('playing');  // MVP-01：成功 / 失敗 / 進行中
  const [monsterStunUntil, setMonsterStunUntil] = useState(0);  // MVP-01：怪物暈眩結束時間戳
  const monsterStunUntilRef = useRef(0);  // patrol RAF 內讀取暈眩時間用
  const gameOutcomeRef = useRef<GameOutcome>('playing');  // patrol RAF 內讀取遊戲結果用
  gameOutcomeRef.current = gameOutcome;
  const [selectedPotionItemId, setSelectedPotionItemId] = useState<string | null>(null);  // tap 使用地形時選中的藥劑
  const [terrainClearedIds, setTerrainClearedIds] = useState<Record<string, boolean>>({});  // 已清除的地形 id
  const [selectedQuestId, setSelectedQuestId] = useState(DEFAULT_QUEST_ID);  // 當前選中的任務 ID
  const [missionResetKey, setMissionResetKey] = useState(0);  // 選單切換時遞增，供背包等重置
  const [monsterLastHitTimes, setMonsterLastHitTimes] = useState<Record<string, number>>({});  // 怪物攻擊時間戳（用於閃光動畫）
  const [monsterCooldownResetTimes, setMonsterCooldownResetTimes] = useState<Record<string, number>>({});  // 冷卻圈起始時間戳
  const [lastStunFeedback, setLastStunFeedback] = useState<{ monsterId: string; label: string; key: number } | null>(null);  // 最後一次暈眩觸發
  const [monsterPositions, setMonsterPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(objMonsters.map((m) => [m.id, { x: m.x, y: m.y }]))
  );  // 怪物即時位置
  const monsterPatrolDirectionRef = useRef<Record<string, 1 | -1>>(
    Object.fromEntries(objMonsters.filter((m) => m.patrol).map((m) => [m.id, 1]))
  );  // 巡邏方向 1 | -1
  const lastTime = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const mapLocked = dialogueOpen;

  // ── 控制環操作 ──────────────────────────────────────────────────

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

  // ── 任務操作 ─────────────────────────────────────────────────────

  const acceptQuest = useCallback(() => {
    setQuestPhase('accepted');
    setQuestStepIndex((i) => i + 1);
  }, []);
  const completeQuest = useCallback(() => setQuestPhase('completed'), []);
  const advanceQuestStep = useCallback(() => setQuestStepIndex((i) => i + 1), []);

  // ── 資源點操作 ──────────────────────────────────────────────────

  // 取得剩餘可採次數（無 maxGather 的節點回傳 undefined，視為無限）
  const getResourceRemaining = useCallback(
    (nodeId: string) => resourceRemaining[nodeId],
    [resourceRemaining]
  );
  // 記錄一次採集／交換並觸發對應特效；若有 gatherLimit 會扣剩餘次數
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

  // ── 怪物暈眩操作 ────────────────────────────────────────────────

  // MVP-01：點擊怪物暈眩（依各怪物 stunDurationMs）；連點重置倒計時並重播提示
  const tryStunMonster = useCallback((monsterId: string) => {
    if (interactionConfig.monsterTapEffect !== 'stun') return;
    const monster = getLabMonster(monsterId);
    if (!monster?.stunDurationMs) return;
    playSound('stun');
    const until = Date.now() + monster.stunDurationMs;
    monsterStunUntilRef.current = until;
    // 把 ref 重置為暈眩結束時間，確保解除暈眩後不會立即攻擊
    monsterLastAttackRef.current[monsterId] = until;
    setMonsterStunUntil(until);
    // 冷卻圈從暈眩結束時間開始計，不觸發閃光
    setMonsterCooldownResetTimes((prev) => ({ ...prev, [monsterId]: until }));
    setLastStunFeedback((prev) => ({
      monsterId,
      label: '★ 暈眩！',
      key: (prev?.key ?? 0) + 1,
    }));
  }, []);

  // ── 地形操作 ─────────────────────────────────────────────────────

  // 用藥劑清除地形（drag 或 tap 成功後呼叫）
  const clearTerrain = useCallback((terrainId: string) => {
    setTerrainClearedIds((prev) => ({ ...prev, [terrainId]: true }));
  }, []);

  // MVP-01：選中藥劑（tap 模式點障礙物時使用）
  const setSelectedPotion = useCallback((itemId: string | null) => {
    setSelectedPotionItemId(itemId);
  }, []);

  // 互動特效：浮動文字播完後清掉，以便同一節點可再次觸發
  useEffect(() => {
    if (!lastResourceFeedback) return;
    const t = setTimeout(() => setLastResourceFeedback(null), FEEDBACK_CLEAR_MS);
    return () => clearTimeout(t);
  }, [lastResourceFeedback]);

  // 暈眩浮動文字：播完後清掉
  useEffect(() => {
    if (!lastStunFeedback) return;
    const t = setTimeout(() => setLastStunFeedback(null), STUN_FEEDBACK_CLEAR_MS);
    return () => clearTimeout(t);
  }, [lastStunFeedback]);

  // ── 任務完成紀錄 ────────────────────────────────────────────────
  // 持久化於 localStorage，供串鏈前置條件判斷與 UI 鎖定顯示
  // 只新增不刪除，玩家重複完成同一任務不會影響其他任務的解鎖狀態
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pa_completed_quests');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  // 記錄任務完成，去重後寫入 localStorage
  const recordQuestCompletion = useCallback((questId: string) => {
    setCompletedQuestIds((prev) => {
      if (prev.includes(questId)) return prev;
      const next = [...prev, questId];
      try {
        localStorage.setItem('pa_completed_quests', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // ── 任務選擇 ─────────────────────────────────────────────────────

  // 選單：選擇任務（切換或重新開始）；傳入該任務的 mapId 與 questId
  const selectMission = useCallback((nextMapId: string, nextQuestId: string) => {
    setPlayerPosition(getSpawnForMap(nextMapId));
    setMapId(nextMapId);
    setSelectedQuestId(nextQuestId);
    setDialogueOpen(false);
    setDialogueNpcId(null);
    setQuestPhase('none');
    setQuestStepIndex(0);
    setHp(HP_MAX);
    hpRef.current = HP_MAX;
    setGameOutcome('playing');
    setMonsterStunUntil(0);
    monsterStunUntilRef.current = 0;
    setSelectedPotionItemId(null);
    setTerrainClearedIds({});
    setResourceRemaining(getInitialResourceRemainingForMap(nextMapId));
    setMonsterPositions(Object.fromEntries(objMonsters.map((m) => [m.id, { x: m.x, y: m.y }])));
    monsterPatrolDirectionRef.current = Object.fromEntries(
      objMonsters.filter((m) => m.patrol).map((m) => [m.id, 1])
    );
    lastTerrainDamageRef.current = {};
    monsterLastAttackRef.current = Object.fromEntries(objMonsters.map((m) => [m.id, 0]));
    setMonsterLastHitTimes({});
    setMonsterCooldownResetTimes({});
    setMissionResetKey((k) => k + 1);
  }, []);

  // ── 鍵盤控制 ─────────────────────────────────────────────────────

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

  // ── 移動與碰撞 ───────────────────────────────────────────────────

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

  // ── 怪物巡邏與攻擊 ───────────────────────────────────────────────

  // 怪物巡邏：有 patrol 的怪物每幀更新位置（左右或上下來回）
  useEffect(() => {
    if (!mapData?.features?.hasMonsters) return;
    let rafId: number;
    let last = 0;
    const tick = (time: number) => {
      const dt = last ? (time - last) / 1000 : 0;
      last = time;
      setMonsterPositions((prev) => {
        const next: Record<string, { x: number; y: number }> = {};
        const dirs = monsterPatrolDirectionRef.current;
        const isStunned = monsterStunUntilRef.current > Date.now();
        for (const m of objMonsters) {
          if (!m.patrol || isStunned) {
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

      // 怪物攻擊：在 RAF 裡以 ~16ms 精度觸發，確保與冷卻動畫同步
      if (gameOutcomeRef.current === 'playing' && monsterStunUntilRef.current <= Date.now()) {
        const now = Date.now();
        const pos = playerPositionRef.current;
        for (const m of objMonsters) {
          const mpos = monsterPositionsRef.current[m.id] ?? { x: m.x, y: m.y };
          const mw = m.hitbox?.width ?? m.radius * 2;
          const mh = m.hitbox?.height ?? mw;
          const inRange = Math.hypot(pos.x - mpos.x, pos.y - (mpos.y + mh * 0.25)) <= Math.min(mw, mh) * 0.75;
          const last = monsterLastAttackRef.current[m.id] ?? 0;
          if (inRange && now - last >= m.attackIntervalMs) {
            monsterLastAttackRef.current[m.id] = now;
            // 命中時間（閃光 / 晃動）與冷卻圈起始時間同時更新
            setMonsterLastHitTimes((prev) => ({ ...prev, [m.id]: now }));
            setMonsterCooldownResetTimes((prev) => ({ ...prev, [m.id]: now }));
            // 用 hpRef 在 setHp 之前決定播 damage 還是 fail
            const nextHp = Math.max(0, hpRef.current - m.attackDamage);
            hpRef.current = nextHp;
            playSound(nextHp <= 0 ? 'fail' : 'damage');
            setHp(nextHp);
            if (nextHp <= 0) setGameOutcome('fail');
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mapId]);

  // ── Refs（供 RAF / setInterval 讀取） ────────────────────────────

  const playerPositionRef = useRef(playerPosition);
  playerPositionRef.current = playerPosition;
  const monsterPositionsRef = useRef<Record<string, { x: number; y: number }>>(monsterPositions);
  monsterPositionsRef.current = monsterPositions;
  const monsterLastAttackRef = useRef<Record<string, number>>(  // 怪物上次攻擊時間戳，初始 0 代表冷卻完畢
    Object.fromEntries(objMonsters.map((m) => [m.id, 0]))
  );
  const lastTerrainDamageRef = useRef<Record<string, number>>({});

  // ── 地形傷害 ─────────────────────────────────────────────────────

  // MVP-01：proximity 節流 — 地形持續扣血（怪物攻擊已移入 RAF 以確保動畫同步）
  useEffect(() => {
    if (!mapData?.features?.hasTerrainDamage || gameOutcome !== 'playing') return;
    const interval = setInterval(() => {
      const pos = playerPositionRef.current;
      const now = Date.now();

      // 地形：範圍內持續扣血（有 damagePerTick 的地形，依 damageIntervalMs 節流）
      for (const terrain of objTerrains) {
        if (terrain.damagePerTick == null) continue;
        const inRange = Math.hypot(pos.x - terrain.x, pos.y - terrain.y) <= terrain.radius;
        const terrainInterval = terrain.damageIntervalMs ?? 100;
        const last = lastTerrainDamageRef.current[terrain.id] ?? 0;
        if (inRange && now - last >= terrainInterval) {
          lastTerrainDamageRef.current[terrain.id] = now;
          const nextHp = Math.max(0, hpRef.current - terrain.damagePerTick!);
          hpRef.current = nextHp;
          playSound(nextHp <= 0 ? 'fail' : 'damage');
          setHp(nextHp);
          if (nextHp <= 0) setGameOutcome('fail');
        }
      }
    }, PROXIMITY_TICK_MS);
    return () => clearInterval(interval);
  }, [mapId, gameOutcome]);

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
    lastStunFeedback,
    selectedPotionItemId,
    setSelectedPotion,
    terrainClearedIds,
    clearTerrain,
    monsterPositions,
    monsterLastHitTimes,
    monsterCooldownResetTimes,
    selectMission,
    selectedQuestId,
    missionResetKey,
    completedQuestIds,
    recordQuestCompletion,
  };
}
