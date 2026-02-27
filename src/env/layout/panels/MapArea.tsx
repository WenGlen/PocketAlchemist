import { useRef, useState, useCallback, useEffect } from 'react';
import { interactionConfig } from '../../../config/interactionConfig';
import { getMap } from '../../map/data/maps';
import { ControlRing } from '../controls/ControlRing';
import { NpcView } from '../../../objects/npc/NpcView';
import { objectTable } from '../../../objects/data/objectTable';
import { resourceNodes } from '../../../objects/data/resourceNodes';
import { ResourceNodeView } from '../../../objects/resource/ResourceNodeView';

const MAP_NPCS = [objectTable['OBJ-npc-001']!];
const MAP_RESOURCES = resourceNodes;

function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

interface MapAreaProps {
  mapId: string;
  playerPosition: { x: number; y: number };
  controlRing: { visible: boolean; screenX: number; screenY: number };
  mapLocked: boolean;
  /** 目前移動向量（控制環 UI 使用） */
  moveDirection: { x: number; y: number };
  onShowControlRing: (screenX: number, screenY: number) => void;
  onHideControlRing: () => void;
  onMoveDirection: (dir: { x: number; y: number }) => void;
  onTapNpc: (npcId: string) => void;
  onTapResource?: (nodeId: string) => void;
  /** 茶樹剩餘可採次數（0 = 已採完，顯示 disabled） */
  teaTreeRemaining: number;
  /** 拖曳時游標下的資源點 id，用於高亮可放置 */
  dropTargetResourceId?: string | null;
  /** 每次採集茶葉時遞增，用於連續觸發晃動與浮動文字 */
  teaTreeGatherKey?: number;
  /** 剛裝水成功，湖播回饋 + 浮動文字 */
  lakeJustFilled?: boolean;
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
  onTapNpc,
  onTapResource,
  teaTreeRemaining,
  dropTargetResourceId = null,
  teaTreeGatherKey = 0,
  lakeJustFilled = false,
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

  const hitTestNpc = useCallback((worldX: number, worldY: number): string | null => {
    for (const npc of MAP_NPCS) {
      const r = npc.radius ?? 24;
      if (Math.hypot(worldX - npc.x, worldY - npc.y) <= r) return npc.id;
    }
    return null;
  }, []);

  const hitTestResource = useCallback((worldX: number, worldY: number): string | null => {
    for (const node of MAP_RESOURCES) {
      if (Math.hypot(worldX - node.x, worldY - node.y) <= node.radius) return node.id;
    }
    return null;
  }, []);

  const range = interactionConfig.interactionRange;
  const isNpcInRange = useCallback(
    (npc: (typeof MAP_NPCS)[number]) =>
      Math.hypot(playerPosition.x - npc.x, playerPosition.y - npc.y) <= range,
    [playerPosition.x, playerPosition.y, range]
  );
  const isResourceInRange = useCallback(
    (node: (typeof MAP_RESOURCES)[number]) =>
      Math.hypot(playerPosition.x - node.x, playerPosition.y - node.y) <= range,
    [playerPosition.x, playerPosition.y, range]
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
        const npcId = hitTestNpc(world.x, world.y);
        const resourceId = hitTestResource(world.x, world.y);
        const npc = npcId ? MAP_NPCS.find((n) => n.id === npcId) : null;
        const resource = resourceId ? MAP_RESOURCES.find((n) => n.id === resourceId) : null;
        const npcCanInteract = npc && isNpcInRange(npc);
        const resourceCanInteract =
          resource &&
          isResourceInRange(resource) &&
          (resource.kind !== 'tea_tree' || teaTreeRemaining > 0);
        if (npcId && npcCanInteract) onTapNpc(npcId);
        else if (resourceId && resourceCanInteract && onTapResource) onTapResource(resourceId);
      }

      setPointerDown(null);
      setRingShownThisGesture(false);
    },
    [
      pointerDown,
      ringShownThisGesture,
      getRect,
      screenToWorld,
      hitTestNpc,
      onHideControlRing,
      onMoveDirection,
      onShowControlRing,
      onTapNpc,
      onTapResource,
      hitTestResource,
      isNpcInRange,
      isResourceInRange,
      teaTreeRemaining,
    ]
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
      {/* 地圖世界層：固定 1600x1200，用 transform 做鏡頭位移 */}
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{
          width: mapW,
          height: mapH,
          transform: `translate(${-cameraX}px, ${-cameraY}px)`,
          background: `linear-gradient(180deg, var(--color-map-grass-top) 0%, var(--color-map-grass-mid) 50%, var(--color-map-grass-bottom) 100%)`,
        }}
      >
        {/* 主角：使用 index 預設 primary 色 + 外框 */}
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
        {MAP_NPCS.map((npc) => (
          <NpcView key={npc.id} npc={npc} inRange={isNpcInRange(npc)} />
        ))}
        {MAP_RESOURCES.map((node) => (
          <ResourceNodeView
            key={node.id}
            node={node}
            inRange={isResourceInRange(node)}
            disabled={node.kind === 'tea_tree' && teaTreeRemaining === 0}
            highlightAsDropTarget={dropTargetResourceId === node.id}
            playShake={node.kind === 'tea_tree' && teaTreeGatherKey > 0}
            shakeKey={node.kind === 'tea_tree' ? teaTreeGatherKey : 0}
            playRipple={node.kind === 'lake' && lakeJustFilled}
          />
        ))}
        {teaTreeGatherKey > 0 && (() => {
          const node = MAP_RESOURCES.find((n) => n.kind === 'tea_tree');
          if (!node) return null;
          return (
            <div
              key={teaTreeGatherKey}
              className="absolute pointer-events-none text-[var(--color-text-success)] text-sm font-medium animate-float-text whitespace-nowrap"
              style={{ left: node.x - 24, top: node.y - node.radius - 28 }}
            >
              +1 茶葉
            </div>
          );
        })()}
        {lakeJustFilled && (() => {
          const node = MAP_RESOURCES.find((n) => n.kind === 'lake');
          if (!node) return null;
          return (
            <div
              className="absolute pointer-events-none text-[var(--color-secondary)] text-sm font-medium animate-float-text whitespace-nowrap"
              style={{ left: node.x - 28, top: node.y - node.radius - 28 }}
            >
              裝水成功
            </div>
          );
        })()}
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
