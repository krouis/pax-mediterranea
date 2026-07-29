import type { ExperimentDefinition, ExperimentMatchRecord } from '../experiment-runner';
import type { AggregateMetrics } from './aggregate';
import type { MatchupCell } from './matchup-matrix';
import type { MdaRow } from './mda';
import { worstSeverity, type ComparisonFinding } from './regression';

export interface MarkdownReportInput {
  definition: ExperimentDefinition;
  matches: ExperimentMatchRecord[];
  metrics: AggregateMetrics;
  matchupMatrix: MatchupCell[];
  mda: MdaRow[];
  comparison?: ComparisonFinding[];
  wallClockMs: number;
  gitCommit?: string;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function num(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function table(header: string[], rows: string[][]): string {
  const headerRow = `| ${header.join(' | ')} |`;
  const separator = `| ${header.map(() => '---').join(' | ')} |`;
  const bodyRows = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerRow, separator, ...bodyRows].join('\n');
}

function structuralHealthSection(
  metrics: AggregateMetrics,
  matches: ExperimentMatchRecord[],
): string {
  const illegal = matches.filter(
    (match) => match.telemetry.terminationClassification === 'illegal-action',
  ).length;
  const errors = matches.filter(
    (match) => match.telemetry.terminationClassification === 'simulation-error',
  ).length;
  return [
    '## Structural Health',
    '',
    table(
      ['Check', 'Result'],
      [
        ['Matches simulated', String(metrics.matchCount)],
        ['Illegal actions produced', String(illegal)],
        ['Simulation errors', String(errors)],
        ['Rejected action reasons', illegal + errors === 0 ? 'none' : 'see outliers below'],
      ],
    ),
    '',
  ].join('\n');
}

function completionSection(metrics: AggregateMetrics): string {
  return [
    '## Match Completion',
    '',
    table(
      ['Metric', 'Value'],
      [
        ['Any winner determined', pct(metrics.completionRate)],
        ['Natural/scenario victory (not a forced tie-break)', pct(metrics.naturalCompletionRate)],
        ['Stalemate (stable-frontier / repeated-state / no-progress)', pct(metrics.stalemateRate)],
        ['Repeated-state cycle detected', pct(metrics.repeatedStateRate)],
      ],
    ),
    '',
    '**Termination classification breakdown:**',
    '',
    table(
      ['Classification', 'Rate'],
      Object.entries(metrics.terminationRate).map(([key, value]) => [key, pct(value ?? 0)]),
    ),
    '',
  ].join('\n');
}

function winRatesSection(metrics: AggregateMetrics): string {
  return [
    '## Win Rates',
    '',
    '**By faction:**',
    '',
    table(
      ['Faction', 'Win rate'],
      Object.entries(metrics.victoryRateByFaction).map(([faction, rate]) => [faction, pct(rate)]),
    ),
    '',
    '**By seat (turn order):**',
    '',
    table(
      ['Seat', 'Win rate'],
      [
        ['p1 (acts first each round)', pct(metrics.victoryRateBySeat.p1)],
        ['p2', pct(metrics.victoryRateBySeat.p2)],
      ],
    ),
    '',
    '**By persona (of matches that persona played, any seat):**',
    '',
    table(
      ['Persona', 'Matches played', 'Win rate'],
      Object.entries(metrics.matchesByPersona).map(([persona, played]) => [
        persona,
        String(played),
        pct(
          metrics.victoryRateByPersona[persona as keyof typeof metrics.victoryRateByPersona] ?? 0,
        ),
      ]),
    ),
    '',
  ].join('\n');
}

function durationSection(metrics: AggregateMetrics): string {
  return [
    '## Match Duration',
    '',
    table(
      ['Metric', 'Value (turns)'],
      [
        ['Mean', num(metrics.meanTurns)],
        ['Median', num(metrics.medianTurns)],
        ['p10', num(metrics.turnPercentiles.p10)],
        ['p25', num(metrics.turnPercentiles.p25)],
        ['p50', num(metrics.turnPercentiles.p50)],
        ['p75', num(metrics.turnPercentiles.p75)],
        ['p90', num(metrics.turnPercentiles.p90)],
      ],
    ),
    '',
  ].join('\n');
}

function activitySection(metrics: AggregateMetrics): string {
  return [
    '## Activity and Stagnation',
    '',
    table(
      ['Metric', 'Value'],
      [
        ['Mean idle-half-turn rate', pct(metrics.meanIdleHalfTurnRate)],
        ['Median idle-half-turn rate', pct(metrics.medianIdleHalfTurnRate)],
        ['Mean lead changes per match', num(metrics.meanLeadChanges)],
        ['Comeback rate (fell behind then led)', pct(metrics.comebackRate)],
      ],
    ),
    '',
    '"Idle" means no meaningful board/economy change (territory ownership, units, or Pax) — see ',
    'docs/SIMULATION-METRICS.md for the exact definition and why coins are deliberately excluded.',
    '',
  ].join('\n');
}

function combatSection(metrics: AggregateMetrics): string {
  return [
    '## Combat',
    '',
    table(
      ['Metric', 'Value'],
      [
        ['Mean combats per match', num(metrics.combatRatePerMatch)],
        [
          'Mean turn of first combat',
          metrics.meanTimeToFirstCombat === null
            ? 'n/a (no combat)'
            : num(metrics.meanTimeToFirstCombat),
        ],
      ],
    ),
    '',
  ].join('\n');
}

function territorySection(metrics: AggregateMetrics): string {
  return [
    '## Territory Control',
    '',
    table(
      ['Metric', 'Value'],
      [['Mean territory churn (captures + losses) per match', num(metrics.meanTerritoryChurn)]],
    ),
    '',
  ].join('\n');
}

function economySection(metrics: AggregateMetrics): string {
  return [
    '## Economy',
    '',
    table(
      ['Metric', 'Value (coins)'],
      [
        ['Average earned per player', num(metrics.averageCoinsEarned)],
        ['Average spent per player', num(metrics.averageCoinsSpent)],
        ['Average retained (unspent) at match end', num(metrics.averageCoinsRetained)],
      ],
    ),
    '',
    table(['Metric', 'Value'], [['Average final Pax per player', num(metrics.averageFinalPax)]]),
    '',
  ].join('\n');
}

function recruitmentSection(metrics: AggregateMetrics): string {
  return [
    '## Unit Recruitment',
    '',
    table(
      ['Unit type', 'Share of all recruits'],
      [
        ['Infantry', pct(metrics.recruitmentMixByType.infantry)],
        ['Cavalry', pct(metrics.recruitmentMixByType.cavalry)],
        ['Fleet', pct(metrics.recruitmentMixByType.fleet)],
      ],
    ),
    '',
    table(
      ['Metric', 'Value'],
      [['Matches that recruited at least one fleet', pct(metrics.fleetUsageRate)]],
    ),
    '',
  ].join('\n');
}

function cardsAndFavorsSection(metrics: AggregateMetrics): string {
  return [
    '## Cards and Favors',
    '',
    '**Card usage rate (share of matches that played the card at least once):**',
    '',
    table(
      ['Card', 'Usage rate'],
      Object.entries(metrics.cardUsageRate).map(([cardId, rate]) => [cardId, pct(rate)]),
    ),
    '',
    '**Favor usage rate (share of matches that invoked the patron favor at least once):**',
    '',
    table(
      ['Patron', 'Usage rate'],
      Object.entries(metrics.favorUsageRateByFavor).map(([favorId, rate]) => [favorId, pct(rate)]),
    ),
    '',
    `Matches invoking any favor: ${pct(metrics.favorUsageRate)}`,
    '',
  ].join('\n');
}

function matchupSection(matrix: MatchupCell[]): string {
  return [
    '## Persona Matchups',
    '',
    table(
      ['Persona A', 'Persona B', 'Mirror', 'Matches', 'A wins', 'B wins', 'Draws', 'A win rate'],
      matrix.map((cell) => [
        cell.personaA,
        cell.personaB,
        cell.isMirror ? 'yes' : 'no',
        String(cell.matches),
        String(cell.winsA),
        String(cell.winsB),
        String(cell.draws),
        pct(cell.winRateA),
      ]),
    ),
    '',
    'Mirror rows (a persona against itself) report a single win-rate that conflates "won as p1" and',
    '"won as p2" — read them only as "someone won", not as evidence about seat advantage.',
    '',
  ].join('\n');
}

function contentReachabilitySection(metrics: AggregateMetrics): string {
  const lines = [
    '## Content Reachability',
    '',
    `Cards never played in this batch: ${metrics.unusedCardIds.length === 0 ? 'none' : metrics.unusedCardIds.join(', ')}`,
    '',
    `Favors never invoked in this batch: ${metrics.unusedFavorIds.length === 0 ? 'none' : metrics.unusedFavorIds.join(', ')}`,
    '',
  ];
  return lines.join('\n');
}

function outliersSection(matches: ExperimentMatchRecord[]): string {
  const outliers = matches.filter((match) => match.outlierTrace);
  if (outliers.length === 0) {
    return [
      '## Outliers',
      '',
      'No illegal-action or simulation-error outliers in this batch.',
      '',
    ].join('\n');
  }
  const rows = outliers.map((match) => [
    match.matchId,
    match.telemetry.terminationClassification,
    String(match.telemetry.turns),
    String(match.outlierTrace?.entries.length ?? 0),
  ]);
  return [
    '## Outliers',
    '',
    `${outliers.length} match(es) in this batch were classified illegal-action or simulation-error and were re-run once with full tracing:`,
    '',
    table(['Match', 'Classification', 'Turns', 'Trace entries'], rows),
    '',
  ].join('\n');
}

function baselineComparisonSection(comparison: ComparisonFinding[] | undefined): string {
  if (!comparison) {
    return ['## Baseline Comparison', '', 'No baseline was provided for this report.', ''].join(
      '\n',
    );
  }
  const severity = worstSeverity(comparison);
  const rows = comparison.map((finding) => [
    finding.metric,
    num(finding.baselineValue, 3),
    num(finding.currentValue, 3),
    num(finding.delta, 3),
    finding.severity,
  ]);
  return [
    '## Baseline Comparison',
    '',
    `**Overall result: ${severity}**`,
    '',
    table(['Metric', 'Baseline', 'Current', 'Delta', 'Severity'], rows),
    '',
    ...comparison
      .filter((finding) => finding.severity !== 'pass')
      .map((finding) => `- **${finding.metric}** (${finding.severity}): ${finding.message}`),
    '',
  ].join('\n');
}

function mdaSection(mda: MdaRow[]): string {
  if (mda.length === 0) {
    return [
      '## MDA Interpretation',
      '',
      'No metric in this batch crossed a threshold that generates an MDA hypothesis. This does not mean the game is "fine" — it means this particular batch did not trigger this pass\'s specific, documented checks; see docs/MDA-EVALUATION.md.',
      '',
    ].join('\n');
  }
  const rows = mda.map((row) => [
    row.mechanics,
    row.measuredDynamic,
    row.aestheticHypothesis,
    row.confidence,
    'yes',
  ]);
  return [
    '## MDA Interpretation',
    '',
    table(
      [
        'Mechanics',
        'Measured dynamics',
        'Aesthetic hypothesis',
        'Confidence',
        'Human validation needed',
      ],
      rows,
    ),
    '',
    '"Confidence" refers to confidence in the *measured dynamic* (sample size and effect size), never to',
    'certainty about how a human would feel playing. Every hypothesis above requires structured human',
    'playtesting to confirm or refute — see docs/MDA-EVALUATION.md.',
    '',
  ].join('\n');
}

export function buildMarkdownReport(input: MarkdownReportInput): string {
  const { definition, matches, metrics, matchupMatrix, mda, comparison, wallClockMs, gitCommit } =
    input;
  return [
    '# Simulation Report',
    '',
    '## Experiment',
    '',
    `**ID:** \`${definition.id}\`  `,
    `**Description:** ${definition.description}`,
    '',
    '## Build and Seed Information',
    '',
    table(
      ['Field', 'Value'],
      [
        ['Git commit', gitCommit ?? 'unknown'],
        ['Node.js version', process.version],
        [
          'Seed range',
          `${definition.seeds.start}..${definition.seeds.start + definition.seeds.count - 1} (${definition.seeds.count} seeds)`,
        ],
        ['Max turns', String(definition.maxTurns)],
        ['Maps', definition.maps.join(', ')],
        ['Scenarios', definition.scenarios.map((scenario) => scenario ?? 'none').join(', ')],
        ['Matches simulated', String(matches.length)],
        [
          'Wall-clock time',
          `${wallClockMs}ms (${(matches.length / Math.max(1, wallClockMs / 1000)).toFixed(1)} matches/sec)`,
        ],
      ],
    ),
    '',
    '## Executive Summary',
    '',
    metrics.sampleWarning
      ? `> ⚠️ ${metrics.sampleWarning}`
      : "> Sample size meets this project's reliability threshold for the rates below.",
    '',
    `This batch simulated ${metrics.matchCount} match(es). ${pct(metrics.naturalCompletionRate)} reached a natural or ` +
      `scenario victory; ${pct(metrics.stalemateRate)} ended in a detected stalemate (stable frontier, repeated-state ` +
      `cycle, or no-progress at the turn cap). Mean match length was ${num(metrics.meanTurns)} turns with a mean ` +
      `idle-half-turn rate of ${pct(metrics.meanIdleHalfTurnRate)}. See Structural Health below for correctness ` +
      'signals and MDA Interpretation for design-hypothesis readouts. This summary reports what was measured; it ' +
      'does not conclude the game is balanced, fun, or ready for release — see Limitations.',
    '',
    structuralHealthSection(metrics, matches),
    completionSection(metrics),
    winRatesSection(metrics),
    durationSection(metrics),
    activitySection(metrics),
    combatSection(metrics),
    territorySection(metrics),
    economySection(metrics),
    recruitmentSection(metrics),
    cardsAndFavorsSection(metrics),
    matchupSection(matchupMatrix),
    contentReachabilitySection(metrics),
    outliersSection(matches),
    baselineComparisonSection(comparison),
    mdaSection(mda),
    '## Limitations',
    '',
    '- This report measures the deterministic simulation personas defined in `src/game/simulation/personas`, not',
    '  live human players, and not necessarily the same heuristic as the in-game default AI',
    '  (`src/game/ai/ai.ts`), which is deliberately simpler for real-time play.',
    '- Patron win-rate only reflects explicitly-configured patrons in the experiment; profiles that omit `patronId`',
    '  use the engine default and are not attributed to a specific patron.',
    '- Mirror matchups (a persona against itself) report a single conflated win-rate — see the Persona Matchups',
    '  section.',
    '- Player enjoyment and emotional engagement are not measured here and cannot be inferred from these',
    '  statistics alone; every MDA row above is a hypothesis requiring human playtesting, not a conclusion.',
    '',
  ].join('\n');
}
