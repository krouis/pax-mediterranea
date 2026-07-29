import type { ComponentType } from 'react';
import type { Terrain } from '../../game/engine/types';

/**
 * One 24x24 pixel-grid icon per Terrain value, replacing the Unicode glyphs previously used
 * in MapBoard. Icons use currentColor so callers control tint via CSS, matching the previous
 * .terrain-icon usage.
 */
function Plains() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="4" y="16" width="3" height="5" fill="currentColor" opacity="0.8" />
      <rect x="9" y="13" width="3" height="8" fill="currentColor" />
      <rect x="14" y="15" width="3" height="6" fill="currentColor" opacity="0.8" />
      <rect x="18" y="17" width="3" height="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function Hills() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="1,20 9,9 17,20" fill="currentColor" opacity="0.75" />
      <polygon points="10,20 17,11 24,20" fill="currentColor" />
    </svg>
  );
}

function Mountains() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="1,21 10,5 19,21" fill="currentColor" />
      <polygon points="7,21 14,9 21,21" fill="currentColor" opacity="0.7" />
      <polygon points="8,11 10,5 12,11" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function City() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="3" y="12" width="5" height="9" fill="currentColor" />
      <rect x="9" y="7" width="6" height="14" fill="currentColor" />
      <rect x="9" y="4" width="2" height="3" fill="currentColor" />
      <rect x="13" y="4" width="2" height="3" fill="currentColor" />
      <rect x="16" y="10" width="5" height="11" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function Port() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="11" y="3" width="2" height="6" fill="currentColor" />
      <rect x="8" y="4" width="8" height="2" fill="currentColor" />
      <circle cx="12" cy="14" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="9" width="2" height="10" fill="currentColor" />
      <polygon points="6,18 12,22 18,18" fill="currentColor" />
    </svg>
  );
}

function Sea() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path
        d="M2,10 q3,-3 6,0 t6,0 t6,0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.9"
      />
      <path
        d="M2,16 q3,-3 6,0 t6,0 t6,0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.6"
      />
    </svg>
  );
}

function Sacred() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" fill="currentColor" />
    </svg>
  );
}

const terrainIconComponents: Record<Terrain, ComponentType> = {
  plains: Plains,
  hills: Hills,
  mountains: Mountains,
  city: City,
  port: Port,
  sea: Sea,
  sacred: Sacred,
};

export function TerrainIcon({ terrain, className = '' }: { terrain: Terrain; className?: string }) {
  const Component = terrainIconComponents[terrain];
  return (
    <span className={`terrain-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}
