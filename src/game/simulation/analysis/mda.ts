import { MIN_RELIABLE_SAMPLE } from './distributions';
import type { AggregateMetrics } from './aggregate';

export type MdaConfidence = 'low' | 'medium' | 'high';

export interface MdaRow {
  mechanics: string;
  measuredDynamic: string;
  aestheticHypothesis: string;
  /** Confidence in the *measured dynamic* (sample size and effect size), never a claim about
   * how a human would feel. See docs/MDA-EVALUATION.md. */
  confidence: MdaConfidence;
  humanValidationNeeded: true;
}

function confidenceFor(matchCount: number, effectSize: number): MdaConfidence {
  if (matchCount < MIN_RELIABLE_SAMPLE) return 'low';
  if (matchCount >= 50 && effectSize >= 0.3) return 'high';
  return 'medium';
}

/**
 * Turns measured aggregate metrics into labeled Mechanics -> Dynamics -> Aesthetic-hypothesis
 * rows. Every row here is gated by a real threshold on a real metric — this function does not
 * contain hand-written verdicts about whether the game is fun; it only fires when the data
 * crosses a documented line, and even then only ever proposes a hypothesis requiring human
 * playtesting, per docs/MDA-EVALUATION.md.
 */
export function generateMdaHypotheses(metrics: AggregateMetrics): MdaRow[] {
  const rows: MdaRow[] = [];

  if (metrics.stalemateRate >= 0.3) {
    rows.push({
      mechanics: 'Deterministic combat, terrain defense bonuses, compact territory graph',
      measuredDynamic: `${(metrics.stalemateRate * 100).toFixed(0)}% of matches in this batch ended classified stable-frontier, repeated-state-cycle, or no-progress rather than a natural or scenario victory (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players may experience a clear opening followed by declining tension and a muted climax once a defensive frontier stabilizes.',
      confidence: confidenceFor(metrics.matchCount, metrics.stalemateRate),
      humanValidationNeeded: true,
    });
  }

  if (metrics.fleetUsageRate < 0.25) {
    rows.push({
      mechanics: 'Fleets, ports, sea-route movement',
      measuredDynamic: `Fleets were recruited in only ${(metrics.fleetUsageRate * 100).toFixed(0)}% of matches in this batch (n=${metrics.matchCount}), including runs with the naval-strategist persona weighted toward them.`,
      aestheticHypothesis:
        'Players may perceive naval play as thematically present but strategically optional relative to land expansion.',
      confidence: confidenceFor(metrics.matchCount, 1 - metrics.fleetUsageRate),
      humanValidationNeeded: true,
    });
  }

  if (metrics.meanIdleHalfTurnRate >= 0.4) {
    rows.push({
      mechanics: 'Turn structure (income, draw, recruit, act, favor), candidate scoring',
      measuredDynamic: `An average of ${(metrics.meanIdleHalfTurnRate * 100).toFixed(0)}% of half-turns in this batch produced no meaningful board/economy change (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players may experience stretches of the match as unresponsive or repetitive, whether the idle turns belong to them or their opponent.',
      confidence: confidenceFor(metrics.matchCount, metrics.meanIdleHalfTurnRate),
      humanValidationNeeded: true,
    });
  }

  if (metrics.combatRatePerMatch < 1) {
    rows.push({
      mechanics: 'ATTACK action, deterministic combat preview',
      measuredDynamic: `Matches in this batch averaged only ${metrics.combatRatePerMatch.toFixed(2)} combats each (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players may rarely experience the tactical combat system directly, relying instead on uncontested capture of neutral/undefended territory.',
      confidence: confidenceFor(metrics.matchCount, 1 - Math.min(1, metrics.combatRatePerMatch)),
      humanValidationNeeded: true,
    });
  }

  if (metrics.unusedCardIds.length > 0) {
    rows.push({
      mechanics: 'Faction cards',
      measuredDynamic: `${metrics.unusedCardIds.length} card(s) were never played in any match in this batch: ${metrics.unusedCardIds.join(', ')} (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players may never discover or value these cards, effectively reducing the card pool below its designed size.',
      confidence: confidenceFor(metrics.matchCount, 1),
      humanValidationNeeded: true,
    });
  }

  if (metrics.unusedFavorIds.length > 0) {
    rows.push({
      mechanics: 'Patron favors',
      measuredDynamic: `${metrics.unusedFavorIds.length} patron favor(s) were never invoked in any match in this batch: ${metrics.unusedFavorIds.join(', ')} (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players choosing these patrons may feel their choice has no in-match mechanical expression.',
      confidence: confidenceFor(metrics.matchCount, 1),
      humanValidationNeeded: true,
    });
  }

  if (metrics.matchCount >= MIN_RELIABLE_SAMPLE && metrics.comebackRate < 0.05) {
    rows.push({
      mechanics: 'Territory capture, Pax scoring, no rubber-banding mechanic',
      measuredDynamic: `Only ${(metrics.comebackRate * 100).toFixed(0)}% of matches in this batch showed a player recovering from a Pax deficit to eventually lead (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players who fall behind early may disengage, expecting the deficit to be effectively decisive.',
      confidence: confidenceFor(metrics.matchCount, 1 - metrics.comebackRate),
      humanValidationNeeded: true,
    });
  }

  const seatGap = Math.abs(metrics.victoryRateBySeat.p1 - metrics.victoryRateBySeat.p2);
  if (metrics.matchCount >= MIN_RELIABLE_SAMPLE && seatGap >= 0.2) {
    rows.push({
      mechanics: 'Turn order (p1 acts first each round)',
      measuredDynamic: `Seat win rates diverged by ${(seatGap * 100).toFixed(0)} percentage points in this batch (p1 ${(metrics.victoryRateBySeat.p1 * 100).toFixed(0)}% vs p2 ${(metrics.victoryRateBySeat.p2 * 100).toFixed(0)}%, n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Whichever seat is disadvantaged may feel the outcome was partly decided by matchmaking rather than play.',
      confidence: confidenceFor(metrics.matchCount, seatGap),
      humanValidationNeeded: true,
    });
  }

  if (metrics.naturalCompletionRate < 0.3) {
    rows.push({
      mechanics: 'Victory conditions (Pax threshold, scenario objective), turn cap',
      measuredDynamic: `Only ${(metrics.naturalCompletionRate * 100).toFixed(0)}% of matches in this batch reached a natural or scenario victory before the turn cap or a detected stagnation condition (n=${metrics.matchCount}).`,
      aestheticHypothesis:
        'Players may frequently experience matches as ending inconclusively rather than at a decisive climax.',
      confidence: confidenceFor(metrics.matchCount, 1 - metrics.naturalCompletionRate),
      humanValidationNeeded: true,
    });
  }

  return rows;
}
