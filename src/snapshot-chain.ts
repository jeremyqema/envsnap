import { loadSnapshot } from './snapshot';
import { diffSnapshots } from './diff';
import type { DiffResult } from './diff';

export interface ChainLink {
  label: string;
  timestamp: number;
  diff: DiffResult;
}

export interface SnapshotChain {
  labels: string[];
  links: ChainLink[];
}

/**
 * Build a chain of diffs across an ordered sequence of snapshot labels.
 * Each link represents the diff between consecutive snapshots.
 */
export async function buildChain(
  labels: string[],
  dir: string
): Promise<SnapshotChain> {
  if (labels.length < 2) {
    throw new Error('At least two snapshot labels are required to build a chain.');
  }

  const links: ChainLink[] = [];

  for (let i = 0; i < labels.length - 1; i++) {
    const fromLabel = labels[i];
    const toLabel = labels[i + 1];

    const from = await loadSnapshot(`${dir}/${fromLabel}.json`);
    const to = await loadSnapshot(`${dir}/${toLabel}.json`);

    const diff = diffSnapshots(from.env, to.env);

    links.push({
      label: `${fromLabel} → ${toLabel}`,
      timestamp: to.timestamp ?? Date.now(),
      diff,
    });
  }

  return { labels, links };
}

/**
 * Summarise how many adds/removes/changes occurred across the entire chain.
 */
export function summarizeChain(chain: SnapshotChain): {
  totalAdded: number;
  totalRemoved: number;
  totalChanged: number;
} {
  let totalAdded = 0;
  let totalRemoved = 0;
  let totalChanged = 0;

  for (const link of chain.links) {
    totalAdded += link.diff.added.length;
    totalRemoved += link.diff.removed.length;
    totalChanged += link.diff.changed.length;
  }

  return { totalAdded, totalRemoved, totalChanged };
}
