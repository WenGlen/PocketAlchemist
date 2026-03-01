import type { NpcDef } from '../data/objectsTable';
import { getItem } from '../../items/data/itemsTable';
import { ObjectView } from '../shared/ObjectView';

interface NpcViewProps {
  npc: NpcDef;
  inRange?: boolean;
  /** 任務泡泡顯示道具（顯示道具名稱） */
  demandItemId?: string | null;
  /** 任務泡泡顯示文字（優先於 demandItemId） */
  demandLabel?: string | null;
  onBubbleClick?: () => void;
}

export function NpcView({ npc, inRange, demandItemId, demandLabel, onBubbleClick }: NpcViewProps) {
  const r = npc.radius ?? 24;
  const w = npc.hitbox?.width ?? r * 2;
  const h = npc.hitbox?.height ?? w;
  const bubbleText = demandLabel ?? (demandItemId ? getItem(demandItemId)?.name : null);

  const ringBgColor = inRange ? 'var(--color-secondary)' : 'var(--color-secondary-50)';
  const ringBorderColor = inRange ? 'var(--color-object-focus)' : 'var(--color-npc-normal)';
  const ringShadow = inRange ? '0 0 12px var(--color-primary-50)' : undefined;
  const ringOpacity = inRange ? 1 : 0.8;

  return (
    <ObjectView
      x={npc.x}
      y={npc.y}
      width={w}
      height={h}
      cornerRadius={npc.hitbox?.cornerRadius}
      emoji={npc.emoji}
      displayName={npc.displayName}
      ringBgColor={ringBgColor}
      ringBorderColor={ringBorderColor}
      ringShadow={ringShadow}
      ringOpacity={ringOpacity}
      bubbleText={inRange ? bubbleText : null}
      bubbleClickable
      onBubbleClick={onBubbleClick}
      title={inRange ? `${npc.displayName}（可互動）` : npc.displayName}
    />
  );
}
