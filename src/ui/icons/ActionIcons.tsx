import type { ComponentType } from 'react';

/** Original pixel-grid action/HUD icons, 20x20 grid, replacing remaining Unicode glyphs. */
function Coins() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="7" cy="13" r="6" fill="currentColor" />
      <circle
        cx="12"
        cy="7"
        r="6"
        fill="currentColor"
        opacity="0.85"
        stroke="#0003"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function Favor() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="10,1 12,8 19,10 12,12 10,19 8,12 1,10 8,8" fill="currentColor" />
    </svg>
  );
}

function Pax() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d="M4,18 Q4,9 10,4 Q16,9 16,18" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="10" r="1.6" fill="currentColor" />
      <circle cx="14" cy="10" r="1.6" fill="currentColor" />
      <circle cx="5" cy="15" r="1.6" fill="currentColor" />
      <circle cx="15" cy="15" r="1.6" fill="currentColor" />
    </svg>
  );
}

function Settings() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="2.4" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <rect
          key={angle}
          x="9"
          y="0"
          width="2"
          height="4"
          fill="currentColor"
          transform={`rotate(${angle} 10 10)`}
        />
      ))}
    </svg>
  );
}

function Save() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="16" height="16" fill="currentColor" />
      <rect x="5" y="2" width="10" height="6" fill="#fff" opacity="0.85" />
      <rect x="5" y="12" width="10" height="6" fill="#fff" opacity="0.4" />
    </svg>
  );
}

function EndTurn() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="2" y="9" width="11" height="2" fill="currentColor" />
      <polygon points="12,4 12,16 19,10" fill="currentColor" />
    </svg>
  );
}

function AttackBoost() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="2,18 8,12 11,15 5,19" fill="currentColor" />
      <rect x="9" y="2" width="2" height="9" fill="currentColor" transform="rotate(45 10 6)" />
      <polygon points="14,2 18,2 18,6 16,4" fill="currentColor" />
    </svg>
  );
}

function Refresh() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d="M4,10 a6,6 0 1 1 2,4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <polygon points="2,10 6,10 4,15" fill="currentColor" />
    </svg>
  );
}

function History() {
  return (
    <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="5" width="2" height="6" fill="currentColor" />
      <rect x="10" y="10" width="5" height="2" fill="currentColor" />
    </svg>
  );
}

const actionIconComponents: Record<string, ComponentType> = {
  coins: Coins,
  favor: Favor,
  pax: Pax,
  settings: Settings,
  save: Save,
  endTurn: EndTurn,
  history: History,
  attackBoost: AttackBoost,
  refresh: Refresh,
};

export function ActionIcon({ name, className = '' }: { name: string; className?: string }) {
  const Component = actionIconComponents[name];
  if (!Component) return null;
  return (
    <span className={`action-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}
