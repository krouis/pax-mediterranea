/**
 * Illustrated landmass/sea backdrop for the game map. Uses the same viewBox="0 0 100 100"
 * percentage coordinate space as the territory positions in src/content/gameContent.ts and the
 * connection-line overlay in MapBoard, so landmasses line up under the (unchanged) territory
 * buttons without any coordinate translation. Purely decorative — the territory graph and
 * topology are not touched.
 */
export function MapBackground() {
  return (
    <svg
      className="map-background"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Iberia, top-left peninsula */}
      <polygon className="landmass" points="-5,22 19,14 24,34 17,55 -5,58" />
      {/* North Africa: Carthage + Numidia coastal strip */}
      <polygon className="landmass" points="11,64 51,58 57,74 50,100 4,100 -2,80" />
      {/* Sardinia + Corsica, connected island chain */}
      <polygon className="landmass" points="39,21 53,25 51,45 41,49 35,36" />
      {/* Sicily */}
      <polygon className="landmass" points="47,57 63,52 67,63 56,69 45,64" />
      {/* Italian peninsula: Latium / Campania / Magna Graecia */}
      <polygon className="landmass" points="54,18 69,18 74,33 69,44 74,52 66,59 58,50 51,34" />
      {/* Epirus / Hellas */}
      <polygon className="landmass" points="69,39 93,44 91,63 78,66 69,55" />

      {/* Sea texture bands */}
      <path className="sea-band" d="M0,50 q10,-4 20,0 t20,0 t20,0 t20,0 t20,0" />
      <path className="sea-band" d="M0,68 q10,-4 20,0 t20,0 t20,0 t20,0 t20,0" />
      <path className="sea-band" d="M0,20 q10,-4 20,0 t20,0 t20,0 t20,0 t20,0" />
    </svg>
  );
}
