//════════════════════════════════════════════════════════════════
// 地圖基底
//════════════════════════════════════════════════════════════════
// 僅負責視埠、鏡頭、移動操作與點擊座標轉換
// 不控管任何內容物（NPC／資源／怪物／障礙物）；內容由 useMapContent 產出，以 children 傳入
//════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from 'react';
import { interactionConfig } from '../interactionConfig';
import { getMap } from '../../maps/data/mapsTable';
import { DEFAULT_VIEWPORT_SIZE } from '../../maps/mapConstants';
import { OBJ_ROLE_001 } from '../../objects/data/objectsTable';
import { ObjectView } from '../../objects/shared/ObjectView';
import { debugConfig } from '../../objects/objectsConstants';
import { ControlRing } from '../controls/ControlRing';
import type { HitTestTargets, MapEntityType } from './useMapContent';

export type { MapEntityType };

// ========== 工具函數 ==========

function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function hitTest(worldX: number, worldY: number, targets: { id: string; x: number; y: number; radius: number }[]): string | null {
  for (const t of targets) {
    if (Math.hypot(worldX - t.x, worldY - t.y) <= t.radius) return t.id;
  }
  return null;
}

// ========== Props ==========

export interface MapAreaProps {
  mapId: string;
  playerPosition: { x: number; y: number };
  controlRing: { visible: boolean; screenX: number; screenY: number };
  mapLocked: boolean;
  moveDirection: { x: number; y: number };
  onShowControlRing: (screenX: number, screenY: number) => void;
  onHideControlRing: () => void;
  onMoveDirection: (dir: { x: number; y: number }) => void;
  hitTestTargets: HitTestTargets;  // 點擊判定用：依 type 順序 npc → resource → monster → terrain 做 hit test
  onTap: (type: MapEntityType, id: string) => void;
  children: React.ReactNode;
  screenToWorldRef?: React.MutableRefObject<((clientX: number, clientY: number) => { x: number; y: number }) | null>;  // 外部傳入的 ref，供拖曳等非地圖事件使用
}

export function MapArea({
  mapId,
  playerPosition,
  controlRing,
  mapLocked,
  moveDirection,
  onShowControlRing,
  onHideControlRing,
  onMoveDirection,
  hitTestTargets,
  onTap,
  children,
  screenToWorldRef,
}: MapAreaProps) {
  // ── 狀態與 Refs ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointerDown, setPointerDown] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [ringShownThisGesture, setRingShownThisGesture] = useState(false);
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT_SIZE);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setViewportSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mapData = getMap(mapId);
  if (!mapData) return null;

  const { width: mapW, height: mapH } = mapData;
  const cameraX = Math.max(
    0,
    Math.min(mapW - viewportSize.w, playerPosition.x - viewportSize.w / 2)
  );
  const cameraY = Math.max(
    0,
    Math.min(mapH - viewportSize.h, playerPosition.y - viewportSize.h / 2)
  );

  const getRect = useCallback(() => containerRef.current?.getBoundingClientRect(), []);
  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = getRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: clientX - rect.left + cameraX,
        y: clientY - rect.top + cameraY,
      };
    },
    [cameraX, cameraY, getRect]
  );
  // 每次 render 都即時更新，讓外部拖曳等事件也能拿到最新的座標換算函數
  if (screenToWorldRef) screenToWorldRef.current = screenToWorld;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mapLocked) return;
      const rect = getRect();
      if (!rect) return;
      if (controlRing.visible) onHideControlRing();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPointerDown({ x, y, screenX: x, screenY: y });
      setRingShownThisGesture(false);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [mapLocked, getRect, controlRing.visible, onHideControlRing]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDown) return;
      const rect = getRect();
      if (!rect) return;
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dx = curX - pointerDown.x;
      const dy = curY - pointerDown.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= interactionConfig.tapMoveThreshold) {
        if (!ringShownThisGesture) {
          onShowControlRing(pointerDown.x, pointerDown.y);
          setRingShownThisGesture(true);
        }
        const vx = curX - pointerDown.x;
        const vy = curY - pointerDown.y;
        const dir = normalize(vx, vy);
        const maxR = interactionConfig.controlRingRadius;
        const factor = Math.min(Math.hypot(vx, vy) / maxR, 1);
        onMoveDirection({ x: dir.x * factor, y: dir.y * factor });
      }
    },
    [pointerDown, ringShownThisGesture, onShowControlRing, onMoveDirection, getRect]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDown) return;
      const rect = getRect();
      if (!rect) return;
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dist = Math.hypot(curX - pointerDown.x, curY - pointerDown.y);

      if (ringShownThisGesture) {
        onHideControlRing();
        onMoveDirection({ x: 0, y: 0 });
      } else if (dist < interactionConfig.tapMoveThreshold) {
        const world = screenToWorld(e.clientX, e.clientY);
        const npcId = hitTest(world.x, world.y, hitTestTargets.npcs);
        if (npcId) {
          onTap('npc', npcId);
        } else {
          const resourceId = hitTest(world.x, world.y, hitTestTargets.resources);
          if (resourceId) {
            onTap('resource', resourceId);
          } else {
            const monsterId = hitTest(world.x, world.y, hitTestTargets.monsters);
            if (monsterId) {
              onTap('monster', monsterId);
            } else {
              const terrainId = hitTest(world.x, world.y, hitTestTargets.terrains);
              if (terrainId) onTap('terrain', terrainId);
            }
          }
        }
      }

      setPointerDown(null);
      setRingShownThisGesture(false);
    },
    [pointerDown, ringShownThisGesture, getRect, screenToWorld, hitTestTargets, onHideControlRing, onMoveDirection, onTap]
  );

  const handleRingPointerDown = (e: React.PointerEvent) => e.stopPropagation();
  const handleRingPointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const vx = curX - controlRing.screenX;
    const vy = curY - controlRing.screenY;
    const dist = Math.hypot(vx, vy);
    if (dist < 1e-3) {
      onMoveDirection({ x: 0, y: 0 });
      return;
    }
    const dir = normalize(vx, vy);
    const maxR = interactionConfig.controlRingRadius;
    const factor = Math.min(dist / maxR, 1);
    onMoveDirection({ x: dir.x * factor, y: dir.y * factor });
  };
  const handleRingPointerUp = () => {
    onHideControlRing();
    onMoveDirection({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 min-h-[200px] overflow-hidden bg-[var(--color-map-bg)]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{
          width: mapW,
          height: mapH,
          transform: `translate(${-cameraX}px, ${-cameraY}px)`,
          background: 'var(--color-map-bg)',
        }}
      >
        {mapData.texture && (() => {
          const { overlayUrl, overlayOpacity = 1, gradientColors } = mapData.texture;
          const parts: string[] = [];
          const repeats: string[] = [];
          const sizes: string[] = [];
          if (overlayUrl) {
            parts.push(`url("${overlayUrl}")`);
            repeats.push('repeat');
            sizes.push('auto');
          }
          if (gradientColors) {
            parts.push(`linear-gradient(180deg, ${gradientColors.top} 0%, ${gradientColors.mid} 50%, ${gradientColors.bottom} 100%)`);
            repeats.push('no-repeat');
            sizes.push('100% 100%');
          }
          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: parts.join(', '),
                backgroundRepeat: repeats.join(', '),
                backgroundSize: sizes.join(', '),
                opacity: overlayOpacity,
              }}
            />
          );
        })()}
        <ObjectView
          x={playerPosition.x}
          y={playerPosition.y}
          width={OBJ_ROLE_001.hitbox?.width ?? 40}
          height={OBJ_ROLE_001.hitbox?.height ?? OBJ_ROLE_001.hitbox?.width ?? 40}
          emoji={OBJ_ROLE_001.emoji}
          ringBgColor="var(--color-player-bg)"
          ringBorderColor="var(--color-player-border)"
          ringBorderWidth={3}
          ringShadow="0 0 0 2px var(--color-player-glow)"
          containerZIndex={3}
          title="主角"
        />
        {/* ── Debug：主角中心點（青色十字準心）─── */}
        {debugConfig.showHitbox && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{ left: playerPosition.x - 10, top: playerPosition.y - 1, width: 20, height: 2, background: 'var(--color-primary)', zIndex: 25 }}
              aria-hidden
            />
            <div
              className="absolute pointer-events-none"
              style={{ left: playerPosition.x - 1, top: playerPosition.y - 10, width: 2, height: 20, background:'var(--color-primary)', zIndex: 25 }}
              aria-hidden
            />
          </>
        )}
        {children}
      </div>

      <ControlRing
        visible={controlRing.visible}
        screenX={controlRing.screenX}
        screenY={controlRing.screenY}
        onPointerDown={handleRingPointerDown}
        onPointerMove={handleRingPointerMove}
        onPointerUp={handleRingPointerUp}
        onPointerCancel={handleRingPointerUp}
        moveDir={moveDirection}
      />
    </div>
  );
}
