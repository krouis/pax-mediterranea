interface Props {
  playerName: string;
}

/** Brief sweep banner shown when a new turn begins (AI-resolved matches only — hotseat already
 * has its own dedicated pass-device overlay). Respects the existing reduced-motion mechanism
 * (`[data-motion='reduced']`/`prefers-reduced-motion`) automatically, since it only relies on
 * the `turn-banner-sweep` CSS animation those rules already neutralize. */
export function TurnBanner({ playerName }: Props) {
  return (
    <div className="turn-banner" role="status">
      {playerName}
    </div>
  );
}
