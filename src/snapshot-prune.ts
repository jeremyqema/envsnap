/**
 * snapshot-prune.ts
 *
 * Prune snapshots based on retention policies:
 *   - keep the N most recent snapshots
 *   - remove snapshots older than a given age (days)
 *   - dry-run mode to preview what would be removed
 */

import * as fs from "fs";
import * as path from "path";

export interface PruneOptions {
  /** Directory where snapshot files are stored */
  snapshotDir: string;
  /** Keep at most this many snapshots (most recent first). 0 = no limit */
  keepCount?: number;
  /** Remove snapshots older than this many days. 0 = no age limit */
  maxAgeDays?: number;
  /** If true, do not delete anything — only report what would be pruned */
  dryRun?: boolean;
}

export interface PruneEntry {
  label: string;
  file: string;
  mtimeMs: number;
}

export interface PruneResult {
  pruned: PruneEntry[];
  kept: PruneEntry[];
  dryRun: boolean;
}

/**
 * Collect all .json snapshot files in the given directory, sorted
 * newest-first by modification time.
 */
export function collectSnapshotEntries(snapshotDir: string): PruneEntry[] {
  if (!fs.existsSync(snapshotDir)) return [];

  return fs
    .readdirSync(snapshotDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const file = path.join(snapshotDir, f);
      const stat = fs.statSync(file);
      return {
        label: f.replace(/\.json$/, ""),
        file,
        mtimeMs: stat.mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs); // newest first
}

/**
 * Determine which entries should be pruned according to the supplied options.
 * Entries are evaluated after sorting newest-first:
 *   1. Any entry beyond `keepCount` is a candidate.
 *   2. Any entry older than `maxAgeDays` is a candidate.
 * An entry is pruned if it matches *either* condition (when both are set).
 */
export function selectForPruning(
  entries: PruneEntry[],
  keepCount: number,
  maxAgeDays: number
): { toKeep: PruneEntry[]; toPrune: PruneEntry[] } {
  const now = Date.now();
  const maxAgeMs = maxAgeDays > 0 ? maxAgeDays * 24 * 60 * 60 * 1000 : 0;

  const toKeep: PruneEntry[] = [];
  const toPrune: PruneEntry[] = [];

  entries.forEach((entry, index) => {
    const tooOld = maxAgeMs > 0 && now - entry.mtimeMs > maxAgeMs;
    const overCount = keepCount > 0 && index >= keepCount;

    if (tooOld || overCount) {
      toPrune.push(entry);
    } else {
      toKeep.push(entry);
    }
  });

  return { toKeep, toPrune };
}

/**
 * Run the prune operation according to the supplied options.
 * Returns a PruneResult describing what was (or would be) removed.
 */
export function pruneSnapshots(options: PruneOptions): PruneResult {
  const {
    snapshotDir,
    keepCount = 0,
    maxAgeDays = 0,
    dryRun = false,
  } = options;

  const entries = collectSnapshotEntries(snapshotDir);
  const { toKeep, toPrune } = selectForPruning(entries, keepCount, maxAgeDays);

  if (!dryRun) {
    for (const entry of toPrune) {
      fs.unlinkSync(entry.file);
    }
  }

  return { pruned: toPrune, kept: toKeep, dryRun };
}

/**
 * Format a PruneResult as a human-readable string for CLI output.
 */
export function formatPruneResult(result: PruneResult): string {
  const lines: string[] = [];
  const prefix = result.dryRun ? "[dry-run] would remove" : "removed";

  if (result.pruned.length === 0) {
    lines.push("Nothing to prune.");
  } else {
    lines.push(`${prefix} ${result.pruned.length} snapshot(s):`);
    for (const entry of result.pruned) {
      const age = Math.round((Date.now() - entry.mtimeMs) / (1000 * 60 * 60 * 24));
      lines.push(`  - ${entry.label}  (${age}d old)`);
    }
  }

  lines.push(`kept: ${result.kept.length} snapshot(s)`);
  return lines.join("\n");
}
