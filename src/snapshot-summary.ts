import { Snapshot } from './snapshot';
import { DiffResult } from './diff';

export interface SnapshotSummary {
  label: string;
  keyCount: number;
  redactedCount: number;
  emptyValueCount: number;
  topKeys: string[];
  capturedAt: string;
}

export interface ComparativeSummary {
  base: SnapshotSummary;
  target: SnapshotSummary;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  unchangedCount: number;
  changeRatio: number;
}

export function summarizeSnapshot(label: string, snap: Snapshot): SnapshotSummary {
  const keys = Object.keys(snap.env);
  const redactedCount = keys.filter(k => snap.env[k] === '[REDACTED]').length;
  const emptyValueCount = keys.filter(k => snap.env[k] === '').length;
  const topKeys = keys.slice(0, 5);
  return {
    label,
    keyCount: keys.length,
    redactedCount,
    emptyValueCount,
    topKeys,
    capturedAt: snap.capturedAt ?? new Date().toISOString(),
  };
}

export function buildComparativeSummary(
  baseLabel: string,
  base: Snapshot,
  targetLabel: string,
  target: Snapshot,
  diff: DiffResult[]
): ComparativeSummary {
  const added = diff.filter(d => d.type === 'added').length;
  const removed = diff.filter(d => d.type === 'removed').length;
  const changed = diff.filter(d => d.type === 'changed').length;
  const total = Object.keys(base.env).length + added;
  const unchanged = total - added - removed - changed;
  const changeRatio = total > 0 ? parseFloat(((added + removed + changed) / total).toFixed(4)) : 0;
  return {
    base: summarizeSnapshot(baseLabel, base),
    target: summarizeSnapshot(targetLabel, target),
    addedCount: added,
    removedCount: removed,
    changedCount: changed,
    unchangedCount: Math.max(0, unchanged),
    changeRatio,
  };
}

export function formatComparativeSummary(summary: ComparativeSummary): string {
  const lines: string[] = [];
  lines.push(`=== Snapshot Summary ==`);
  lines.push(`Base   : ${summary.base.label} (${summary.base.keyCount} keys, captured ${summary.base.capturedAt})`);
  lines.push(`Target : ${summary.target.label} (${summary.target.keyCount} keys, captured ${summary.target.capturedAt})`);
  lines.push(`Changes: +${summary.addedCount} added, -${summary.removedCount} removed, ~${summary.changedCount} changed, ${summary.unchangedCount} unchanged`);
  lines.push(`Change ratio: ${(summary.changeRatio * 100).toFixed(2)}%`);
  if (summary.base.redactedCount > 0 || summary.target.redactedCount > 0) {
    lines.push(`Redacted: base=${summary.base.redactedCount}, target=${summary.target.redactedCount}`);
  }
  return lines.join('\n');
}
