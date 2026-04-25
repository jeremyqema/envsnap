import * as fs from 'fs/promises';
import * as path from 'path';
import { loadTtlIndex, saveTtlIndex, getExpired, removeTtl } from './snapshot-ttl';

export interface PurgeResult {
  purged: string[];
  errors: { label: string; error: string }[];
}

/**
 * Purge expired snapshots from the given snapshot directory.
 * Removes snapshot files and clears their TTL entries.
 */
export async function purgeExpired(
  snapshotDir: string,
  ttlIndexFile: string
): Promise<PurgeResult> {
  let index = await loadTtlIndex(ttlIndexFile);
  const expired = getExpired(index);
  const result: PurgeResult = { purged: [], errors: [] };

  for (const label of expired) {
    const snapshotFile = path.join(snapshotDir, `${label}.json`);
    try {
      await fs.unlink(snapshotFile);
      index = removeTtl(index, label);
      result.purged.push(label);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // File already gone — still clean up TTL entry
        index = removeTtl(index, label);
        result.purged.push(label);
      } else {
        result.errors.push({ label, error: err.message });
      }
    }
  }

  await saveTtlIndex(ttlIndexFile, index);
  return result;
}

/**
 * Format a PurgeResult for human-readable CLI output.
 */
export function formatPurgeResult(result: PurgeResult): string {
  const lines: string[] = [];
  if (result.purged.length === 0 && result.errors.length === 0) {
    lines.push('Nothing to purge — no expired snapshots found.');
  } else {
    if (result.purged.length > 0) {
      lines.push(`Purged ${result.purged.length} expired snapshot(s):`);
      for (const label of result.purged) {
        lines.push(`  ✓ ${label}`);
      }
    }
    if (result.errors.length > 0) {
      lines.push(`Failed to purge ${result.errors.length} snapshot(s):`);
      for (const { label, error } of result.errors) {
        lines.push(`  ✗ ${label}: ${error}`);
      }
    }
  }
  return lines.join('\n');
}
