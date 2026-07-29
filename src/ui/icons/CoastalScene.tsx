/**
 * Original hand-authored pixel-grid illustration: a stylized Carthaginian coastline (harbor,
 * ship, city silhouette, hills) against a banded sea. Built from flat rects/polygons on a small
 * logical grid so it reads as pixel art at any scale, not a copy of any commercial game's art.
 * Reused by the main-menu hero and the campaign intro (see docs/ART-DIRECTION.md).
 */
export function CoastalScene({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`coastal-scene ${className}`.trim()}
      viewBox="0 0 160 60"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {/* sky */}
      <rect x="0" y="0" width="160" height="40" fill="var(--color-carthage-dark)" opacity="0.35" />
      {/* sea bands */}
      <rect x="0" y="40" width="160" height="20" fill="var(--color-sea-deep)" />
      <rect x="0" y="40" width="160" height="3" fill="var(--color-sea-bright)" opacity="0.6" />
      <rect x="0" y="46" width="160" height="2" fill="var(--color-sea-foam)" opacity="0.35" />
      <rect x="0" y="52" width="160" height="2" fill="var(--color-sea-foam)" opacity="0.25" />

      {/* distant hills */}
      <polygon points="0,40 18,26 34,40" fill="var(--color-olive)" opacity="0.55" />
      <polygon points="20,40 40,22 62,40" fill="var(--color-olive)" opacity="0.7" />

      {/* city silhouette (crenellated skyline, right side) */}
      <g fill="var(--color-clay)">
        <rect x="96" y="24" width="8" height="16" />
        <rect x="96" y="20" width="3" height="4" />
        <rect x="101" y="20" width="3" height="4" />
        <rect x="106" y="18" width="10" height="22" />
        <rect x="106" y="14" width="3" height="4" />
        <rect x="111" y="14" width="3" height="4" />
        <rect x="116" y="26" width="7" height="14" />
        <rect x="124" y="16" width="12" height="24" />
        <rect x="124" y="12" width="3" height="4" />
        <rect x="129" y="12" width="3" height="4" />
        <rect x="134" y="12" width="3" height="4" />
        <rect x="138" y="22" width="8" height="18" />
      </g>
      {/* port tower with a bronze beacon */}
      <rect x="118" y="10" width="4" height="16" fill="var(--color-bronze)" />
      <rect x="116" y="7" width="8" height="4" fill="var(--color-gold-bright)" />

      {/* ship: hull + mast + sail (left side) */}
      <g>
        <polygon points="20,48 44,48 40,54 24,54" fill="var(--color-clay)" />
        <rect x="31" y="30" width="2" height="18" fill="var(--color-bronze)" />
        <polygon points="33,31 33,46 46,42" fill="var(--color-terracotta)" />
        <polygon points="31,31 31,44 22,41" fill="var(--color-ivory)" opacity="0.85" />
      </g>

      {/* wave accents under the ship */}
      <path
        d="M14,50 q6,-3 12,0 t12,0 t12,0"
        fill="none"
        stroke="var(--color-sea-foam)"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}
