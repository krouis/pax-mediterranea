import type { ComponentType, ReactNode } from 'react';

/**
 * Stylized, symbolic portrait busts, 48x48 grid — not likenesses (none are historically
 * attested), per the brief's "clearly designed placeholders, not unlicensed artwork" guidance.
 * Codex-only: `leaders` exist today only as an i18n glossary (content:leaders.*), with no
 * game-state field or other UI hook — see docs/PLAYER-PERSONAS.md-style scoping note in
 * docs/ASSET-MANIFEST.md.
 */
function BustBase({ children }: { children?: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <circle cx="24" cy="18" r="10" fill="currentColor" />
      <path d="M8,46 Q8,30 24,30 Q40,30 40,46 Z" fill="currentColor" />
      {children}
    </svg>
  );
}

function Dido() {
  return (
    <BustBase>
      <polygon points="14,10 24,4 34,10 24,14" fill="#fff" opacity="0.85" />
    </BustBase>
  );
}

function HannibalBarca() {
  return (
    <BustBase>
      <path d="M12,10 Q24,0 36,10 L36,15 Q24,9 12,15 Z" fill="#fff" opacity="0.85" />
      <rect x="22" y="1" width="4" height="8" fill="#fff" opacity="0.85" />
    </BustBase>
  );
}

function HamilcarBarca() {
  return (
    <BustBase>
      <path d="M12,12 Q24,2 36,12 L34,16 Q24,8 14,16 Z" fill="#fff" opacity="0.85" />
    </BustBase>
  );
}

function HasdrubalBarca() {
  return (
    <BustBase>
      <path d="M8,46 Q8,32 24,32 Q40,32 40,46 L34,46 Q34,36 24,36 Q14,36 14,46 Z" fill="#fff" opacity="0.5" />
    </BustBase>
  );
}

const leaderPortraitComponents: Record<string, ComponentType> = {
  dido: Dido,
  'hannibal-barca': HannibalBarca,
  'hamilcar-barca': HamilcarBarca,
  'hasdrubal-barca': HasdrubalBarca,
};

export function LeaderPortrait({ leaderId, className = '' }: { leaderId: string; className?: string }) {
  const Component = leaderPortraitComponents[leaderId];
  if (!Component) return null;
  return (
    <span className={`leader-portrait-glyph ${className}`.trim()}>
      <Component />
    </span>
  );
}

export function PortraitFrame({ children }: { children: ReactNode }) {
  return <div className="portrait-frame">{children}</div>;
}
