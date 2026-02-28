/**
 * 地圖基底：僅負責視埠、鏡頭、移動操作與點擊座標轉換。
 * 不控管任何內容物（NPC／資源／怪物／障礙物）；內容由 useMapContent 產出，以 children 傳入。
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { interactionConfig } from '../../../config/interactionConfig';
import { getMap } from '../../map/data/maps';
import { ControlRing } from '../controls/ControlRing';
import type { HitTestTargets, MapEntityType } from './useMapContent';

export type { MapEntityType };

function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

function hitTest(worldX: number, worldY: number, targets: { id: string; x: number; y: number; radius: number }[]): string | null {
  for (const t of targets) {
    if (Math.hypot(worldX - t.x, worldY - t.y) <= t.radius) return t.id;
  }
  return null;
}

export interface MapAreaProps {
  mapId: string;
  playerPosition: { x: number; y: number };
  controlRing: { visible: boolean; screenX: number; screenY: number };
  mapLocked: boolean;
  moveDirection: { x: number; y: number };
  onShowControlRing: (screenX: number, screenY: number) => void;
  onHideControlRing: () => void;
  onMoveDirection: (dir: { x: number; y: number }) => void;
  /** 點擊判定用：依 type 順序 npc → resource → monster → terrain 做 hit test */
  hitTestTargets: HitTestTargets;
  onTap: (type: MapEntityType, id: string) => void;
  children: React.ReactNode;
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
}: MapAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointerDown, setPointerDown] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [ringShownThisGesture, setRingShownThisGesture] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: 400, h: 300 });

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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("https://www.transparenttextures.com/patterns/fresh-snow.png"), linear-gradient(180deg, var(--color-map-grass-top) 0%, var(--color-map-grass-mid) 50%, var(--color-map-grass-bottom) 100%)`,
            backgroundRepeat: 'repeat, no-repeat',
            backgroundSize: 'auto, 100% 100%',
            opacity: 0.25,
          }}
        />
        <div
          className="absolute rounded-full border-[3px] bg-[var(--color-player-bg)] border-[var(--color-player-border)]"
          style={{
            left: playerPosition.x - 20,
            top: playerPosition.y - 20,
            width: 40,
            height: 40,
            boxShadow: '0 0 0 2px var(--color-player-glow)',
          }}
          title="主角"
        />
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
