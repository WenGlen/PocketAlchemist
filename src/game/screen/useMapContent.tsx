/**
 * 地圖「內容物」：依 mapId 取得實體清單、解析資源特效、產出 hitTestTargets 與實體視圖。
 * 由 GameScreen 使用，結果傳給 MapArea（基底＋移動）做擺放與點擊判定。
 */
import { useMemo } from 'react';
import {
  objectTable,
  npcsByMap,
  resourceNodesByMap,
  resourceNodes,
  objTerrains,
  objMonsters,
  getGatherLimitForNode,
} from '../../objects/data/objectsTable';
import { getResourceEffectOrDefault } from '../../objects/resource/resourceEffectRegistry';
import { NpcView } from '../../objects/npc/NpcView';
import { ResourceNodeView } from '../../objects/resource/ResourceNodeView';
import { TerrainView } from '../../objects/terrain/TerrainView';
import { MonsterView } from '../../objects/monster/MonsterView';

export interface HitTestTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface HitTestTargets {
  npcs: HitTestTarget[];
  resources: HitTestTarget[];
  monsters: HitTestTarget[];
  terrains: HitTestTarget[];
}

export interface MapContentState {
  mapId: string;
  playerPosition: { x: number; y: number };
  interactionRange: number;
  resourceRemaining: Record<string, number>;
  lastResourceFeedback: { nodeId: string; effectId: string; label: string; key: number } | null;
  dropTargetResourceId: string | null;
  dropTargetTerrainId: string | null;
  terrainClearedIds: Record<string, boolean>;
  monsterPositions: Record<string, { x: number; y: number }>;
  monsterLastHitTimes: Record<string, number>;
  monsterCooldownResetTimes: Record<string, number>;
  monsterStunned: boolean;
  monsterStunUntil: number;
  lastStunFeedback: { monsterId: string; label: string; key: number } | null;
  acceptFromEntityId: string | null;
  questPhase: 'none' | 'accepted' | 'completed';
  bubbleEntityId: string | null;
  bubbleItemId: string | null;
  bubbleLabel: string | null;
}

export type MapEntityType = 'npc' | 'resource' | 'monster' | 'terrain';

export interface UseMapContentOptions {
  onTap: (type: MapEntityType, id: string) => void;
}

export function useMapContent(
  state: MapContentState,
  options: UseMapContentOptions
): { hitTestTargets: HitTestTargets; content: React.ReactNode } {
  const { onTap } = options;
  const {
    mapId,
    playerPosition,
    interactionRange,
    resourceRemaining,
    lastResourceFeedback,
    dropTargetResourceId,
    dropTargetTerrainId,
    terrainClearedIds,
    monsterPositions,
    monsterLastHitTimes,
    monsterCooldownResetTimes,
    monsterStunned,
    monsterStunUntil,
    lastStunFeedback,
    acceptFromEntityId,
    questPhase,
    bubbleEntityId,
    bubbleItemId,
    bubbleLabel,
  } = state;

  const rawNpcs = npcsByMap[mapId] ?? [objectTable['OBJ-npc-001']!];
  // 依 positionByMap 覆蓋 NPC 座標，確保跨地圖複用時顯示在正確位置
  const npcs = rawNpcs.map((n) => {
    const override = n.positionByMap?.[mapId];
    return override ? { ...n, x: override.x, y: override.y } : n;
  });
  const resources = (resourceNodesByMap[mapId] ?? resourceNodes).filter((n) => !n.hidden);

  const hitTestTargets: HitTestTargets = useMemo(
    () => ({
      npcs: npcs.map((n) => {
        const w = n.hitbox?.width ?? (n.radius ?? 24) * 2;
        const h = n.hitbox?.height ?? w;
        return { id: n.id, x: n.x, y: n.y, radius: Math.min(w, h) / 2 };
      }),
      resources: resources.map((r) => {
        const w = r.hitbox?.width ?? r.radius * 2;
        const h = r.hitbox?.height ?? w;
        return { id: r.id, x: r.x, y: r.y + h * 0.25, radius: Math.min(w, h) };
      }),
      monsters:
        mapId === 'MAP-field-001'
          ? objMonsters.map((m) => {
              const pos = monsterPositions[m.id] ?? { x: m.x, y: m.y };
              const w = m.hitbox?.width ?? m.radius * 2;
              const h = m.hitbox?.height ?? w;
              return { id: m.id, x: pos.x, y: pos.y + h * 0.25, radius: Math.min(w, h) * 0.75 };
            })
          : [],
      terrains:
        mapId === 'MAP-field-001'
          ? objTerrains
              .filter((t) => !(t.requiredItemId && terrainClearedIds[t.id]))
              .map((t) => ({ id: t.id, x: t.x, y: t.y, radius: t.radius }))
          : [],
    }),
    [mapId, npcs, resources, terrainClearedIds, monsterPositions]
  );

  const content = useMemo(() => {
    const isNpcInRange = (npc: (typeof npcs)[number]) =>
      Math.hypot(playerPosition.x - npc.x, playerPosition.y - npc.y) <= interactionRange;
    const isResourceInRange = (node: (typeof resources)[number]) =>
      Math.hypot(playerPosition.x - node.x, playerPosition.y - node.y) <= interactionRange;

    return (
      <>
        {npcs.map((npc) => {
          const inRange = isNpcInRange(npc);
          const canInteract =
            questPhase !== 'completed' &&
            (!acceptFromEntityId || questPhase !== 'none' || npc.id === acceptFromEntityId);
          return (
            <NpcView
              key={npc.id}
              npc={npc}
              inRange={inRange && canInteract}
              demandItemId={npc.id === bubbleEntityId ? bubbleItemId : null}
              demandLabel={npc.id === bubbleEntityId ? bubbleLabel : null}
              onBubbleClick={() => onTap('npc', npc.id)}
            />
          );
        })}
        {resources.map((node) => {
          const limit = getGatherLimitForNode(node, mapId);
          const remaining = limit != null ? (resourceRemaining[node.id] ?? limit) : undefined;
          const disabled = limit != null && (remaining ?? 0) <= 0;
          const fb = lastResourceFeedback?.nodeId === node.id ? lastResourceFeedback : null;
          const effectDef = fb ? getResourceEffectOrDefault(fb.effectId) : null;
          return (
            <ResourceNodeView
              key={node.id}
              node={node}
              inRange={isResourceInRange(node)}
              disabled={disabled}
              highlightAsDropTarget={dropTargetResourceId === node.id}
              playShake={effectDef?.playShake ?? false}
              shakeKey={effectDef?.playShake ? (fb?.key ?? 0) : 0}
              playRipple={effectDef?.playRipple ?? false}
              proximityBubbleText={node.proximityBubbleText}
              onTap={() => onTap('resource', node.id)}
            />
          );
        })}
        {lastResourceFeedback && (() => {
          const node = resources.find((n) => n.id === lastResourceFeedback.nodeId);
          if (!node) return null;
          const effectDef = getResourceEffectOrDefault(lastResourceFeedback.effectId);
          const colorClass =
            effectDef.floatTextVariant === 'secondary'
              ? 'text-[var(--color-secondary)]'
              : 'text-[var(--color-text-success)]';
          return (
            <div
              key={lastResourceFeedback.key}
              className={`absolute pointer-events-none text-sm font-medium animate-float-text whitespace-nowrap ${colorClass}`}
              style={{ left: node.x - 28, top: node.y - node.radius - 50 }}
            >
              {lastResourceFeedback.label}
            </div>
          );
        })()}
        {mapId === 'MAP-field-001' && (
          <>
            {objTerrains.map((t) => {
              const terrainInRange =
                t.damagePerTick != null &&
                Math.hypot(playerPosition.x - t.x, playerPosition.y - t.y) <= t.radius;
              return (
                <TerrainView
                  key={t.id}
                  terrain={t}
                  cleared={!!terrainClearedIds[t.id]}
                  highlightAsDropTarget={dropTargetTerrainId === t.id}
                  playerInRange={terrainInRange}
                />
              );
            })}
            {objMonsters.map((m) => (
              <MonsterView
                key={m.id}
                monster={m}
                position={monsterPositions[m.id]}
                stunned={monsterStunned}
                monsterStunUntil={monsterStunUntil}
                lastHitTime={monsterLastHitTimes[m.id] ?? 0}
                lastCooldownResetTime={monsterCooldownResetTimes[m.id] ?? 0}
              />
            ))}
            {lastStunFeedback && (() => {
              const m = objMonsters.find((mon) => mon.id === lastStunFeedback.monsterId);
              if (!m) return null;
              const pos = monsterPositions[m.id] ?? { x: m.x, y: m.y };
              return (
                <div
                  key={lastStunFeedback.key}
                  className="absolute pointer-events-none text-sm font-bold animate-float-text whitespace-nowrap text-[var(--color-monster-attack)]"
                  style={{ left: pos.x - 28, top: pos.y - m.radius - 28 }}
                >
                  {lastStunFeedback.label}
                </div>
              );
            })()}
          </>
        )}
      </>
    );
  }, [
    mapId,
    npcs,
    resources,
    playerPosition,
    interactionRange,
    resourceRemaining,
    lastResourceFeedback,
    dropTargetResourceId,
    dropTargetTerrainId,
    terrainClearedIds,
    monsterPositions,
    monsterLastHitTimes,
    monsterCooldownResetTimes,
    monsterStunned,
    monsterStunUntil,
    lastStunFeedback,
    questPhase,
    acceptFromEntityId,
    bubbleEntityId,
    bubbleItemId,
    bubbleLabel,
    onTap,
  ]);

  return { hitTestTargets, content };
}
