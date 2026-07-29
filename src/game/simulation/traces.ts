import type { TraceEntry, SimulationTrace } from './types';

export class TraceRecorder {
  private entries: TraceEntry[] = [];
  private turnEndReasons: Record<string, string> = {};

  constructor(private readonly enabled: boolean) {}

  record(entry: TraceEntry): void {
    if (!this.enabled) return;
    this.entries.push(entry);
  }

  recordTurnEndReason(key: string, reason: string): void {
    if (!this.enabled) return;
    this.turnEndReasons[key] = reason;
  }

  finalize(): SimulationTrace | undefined {
    if (!this.enabled) return undefined;
    return { entries: this.entries, turnEndReasons: this.turnEndReasons };
  }
}
