import type { ComponentType } from 'react';

/**
 * Symbolic (not literal) faction emblems, 32x32 grid. Carthage and Rome are real, wired into
 * FactionBadge. Greek and Egyptian are ROADMAP-only placeholders (see docs/ROADMAP.md item 4) —
 * neither faction exists in game content today; both render only inside the Codex screen, never
 * implying they are playable.
 */
function CarthageEmblem() {
  return (
    <svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="13" r="4" fill="currentColor" />
      <path d="M9,21 Q16,27 23,21" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function RomeEmblem() {
  return (
    <svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon
        points="16,2 29,9 29,23 16,30 3,23 3,9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect x="14.5" y="8" width="3" height="16" fill="currentColor" />
      <polygon points="7,14 14.5,17 7,20" fill="currentColor" />
      <polygon points="25,14 17.5,17 25,20" fill="currentColor" />
    </svg>
  );
}

function GreekEmblem() {
  return (
    <svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14.5" y="6" width="3" height="20" fill="currentColor" />
      <polygon points="8,10 14.5,14 8,18" fill="currentColor" />
      <polygon points="24,10 17.5,14 24,18" fill="currentColor" />
    </svg>
  );
}

function EgyptEmblem() {
  return (
    <svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="14.5" y="15" width="3" height="10" fill="currentColor" />
      <rect x="10" y="19" width="12" height="3" fill="currentColor" />
    </svg>
  );
}

const factionEmblemComponents: Record<string, ComponentType> = {
  carthage: CarthageEmblem,
  rome: RomeEmblem,
  greek: GreekEmblem,
  egyptian: EgyptEmblem,
};

export function FactionEmblem({
  factionId,
  className = '',
}: {
  factionId: string;
  className?: string;
}) {
  const Component = factionEmblemComponents[factionId] ?? CarthageEmblem;
  return (
    <span className={`faction-emblem-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}
