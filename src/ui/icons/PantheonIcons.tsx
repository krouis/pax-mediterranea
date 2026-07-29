import type { ComponentType } from 'react';

/**
 * Symbolic (not literal) patron icons, 24x24 grid. baal-hammon/tanit/jupiter/juno are real
 * patrons wired into the favor UI. melqart is the one already-documented (LOCALIZATION-AR-TN.md
 * glossary) but currently unused placeholder, Codex-only — no other deities are invented here.
 */
function BaalHammon() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <rect
          key={angle}
          x="11"
          y="1"
          width="2"
          height="4"
          fill="currentColor"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}

function Tanit() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="12" cy="4" r="3" fill="currentColor" />
      <rect x="11" y="8" width="2" height="6" fill="currentColor" />
      <polygon points="12,13 20,22 4,22" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Jupiter() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <polygon points="13,1 5,13 11,13 9,23 19,10 13,10" fill="currentColor" />
    </svg>
  );
}

function Juno() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path
        d="M4,20 L4,14 Q12,6 20,14 L20,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="4" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="7" r="2.5" fill="currentColor" />
      <circle cx="20" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

function Melqart() {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect x="5" y="3" width="4" height="18" fill="currentColor" />
      <rect x="15" y="3" width="4" height="18" fill="currentColor" />
      <rect x="4" y="3" width="16" height="3" fill="currentColor" />
    </svg>
  );
}

const pantheonIconComponents: Record<string, ComponentType> = {
  'baal-hammon': BaalHammon,
  tanit: Tanit,
  jupiter: Jupiter,
  juno: Juno,
  melqart: Melqart,
};

export function PantheonIcon({
  patronId,
  className = '',
}: {
  patronId: string;
  className?: string;
}) {
  const Component = pantheonIconComponents[patronId];
  if (!Component) return null;
  return (
    <span className={`pantheon-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}
