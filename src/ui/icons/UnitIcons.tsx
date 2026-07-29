import type { ComponentType } from 'react';
import type { UnitType } from '../../game/engine/types';

/**
 * One 24x24 pixel-grid icon per unit type, replacing the Unicode chess glyphs previously used
 * in MapBoard/App. Shapes are deliberately exaggerated (oversized shield, chunky horse, compact
 * hull) so each stays a distinct silhouette at small scale and in grayscale (brief §7). Icons use
 * currentColor so the surrounding .unit-p1/.unit-p2 owner tint applies without duplication.
 */
function Infantry() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon
        points="12,2 20,5 20,13 12,22 4,13 4,5"
        fill="currentColor"
        stroke="#fff"
        strokeWidth="0.6"
        opacity="0.95"
      />
      <rect x="10.5" y="7" width="3" height="8" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function Cavalry() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path
        d="M6,20 L6,15 L5,11 Q4,6 9,4 L15,4 L15,7 L18,7 L18,10 L15,10 L15,13 L18,20 L14,20 L13,15 L9,15 L9,20 Z"
        fill="currentColor"
        stroke="#fff"
        strokeWidth="0.6"
      />
      <rect x="15.5" y="6" width="2" height="2" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function Fleet() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="3,17 21,17 18,21 6,21" fill="currentColor" stroke="#fff" strokeWidth="0.6" />
      <rect x="11" y="3" width="2" height="14" fill="currentColor" />
      <polygon
        points="13,4 13,14 20,12"
        fill="currentColor"
        opacity="0.75"
        stroke="#fff"
        strokeWidth="0.4"
      />
    </svg>
  );
}

const unitIconComponents: Record<UnitType, ComponentType> = {
  infantry: Infantry,
  cavalry: Cavalry,
  fleet: Fleet,
};

export function UnitIcon({ type, className = '' }: { type: UnitType; className?: string }) {
  const Component = unitIconComponents[type];
  return (
    <span className={`unit-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}
