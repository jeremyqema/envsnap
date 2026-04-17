import { Snapshot } from './snapshot';

export interface MergeOptions {
  prefer?: 'base' | 'override';
  includeNull?: boolean;
}

/**
 * Merge two snapshots, with override taking precedence by default.
 * Keys present in only one snapshot are included unless the value is null/undefined
 * and includeNull is false.
 */
export function mergeSnapshots(
  base: Snapshot,
  override: Snapshot,
  options: MergeOptions = {}
): Snapshot {
  const { prefer = 'override', includeNull = true } = options;

  const merged: Record<string, string> = {};

  const primary = prefer === 'override' ? override : base;
  const secondary = prefer === 'override' ? base : override;

  for (const [key, value] of Object.entries(secondary.env)) {
    if (!includeNull && (value === null || value === undefined)) continue;
    merged[key] = value;
  }

  for (const [key, value] of Object.entries(primary.env)) {
    if (!includeNull && (value === null || value === undefined)) continue;
    merged[key] = value;
  }

  return {
    timestamp: new Date().toISOString(),
    env: merged,
  };
}

/**
 * Merge multiple snapshots in order, each overriding the previous.
 */
export function mergeAll(
  snapshots: Snapshot[],
  options: MergeOptions = {}
): Snapshot {
  if (snapshots.length === 0) {
    return { timestamp: new Date().toISOString(), env: {} };
  }
  return snapshots.reduce((acc, snap) => mergeSnapshots(acc, snap, options));
}
