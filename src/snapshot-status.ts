import { loadTtlIndex, isExpired } from './snapshot-ttl';
import { loadLocks, isLocked } from './snapshot-lock';
import { loadArchiveIndex, isArchived } from './snapshot-archive';
import { loadPins, getPin } from './pin';

export interface SnapshotStatus {
  label: string;
  locked: boolean;
  archived: boolean;
  pinned: boolean;
  expired: boolean;
  ttlExpiresAt?: string;
  pinnedAs?: string;
}

export async function getSnapshotStatus(
  label: string,
  storageDir: string
): Promise<SnapshotStatus> {
  const [ttlIndex, locks, archiveIndex, pins] = await Promise.all([
    loadTtlIndex(storageDir),
    loadLocks(storageDir),
    loadArchiveIndex(storageDir),
    loadPins(storageDir),
  ]);

  const ttlEntry = ttlIndex[label];
  const expired = ttlEntry ? isExpired(ttlEntry) : false;
  const pinEntry = getPin(pins, label);

  return {
    label,
    locked: isLocked(locks, label),
    archived: isArchived(archiveIndex, label),
    pinned: pinEntry !== undefined,
    expired,
    ttlExpiresAt: ttlEntry?.expiresAt,
    pinnedAs: pinEntry?.alias,
  };
}

export function formatStatus(status: SnapshotStatus): string {
  const flags: string[] = [];
  if (status.locked) flags.push('locked');
  if (status.archived) flags.push('archived');
  if (status.pinned) flags.push(`pinned${status.pinnedAs ? `:${status.pinnedAs}` : ''}`);
  if (status.expired) flags.push('expired');
  if (status.ttlExpiresAt && !status.expired) flags.push(`expires:${status.ttlExpiresAt}`);

  const flagStr = flags.length > 0 ? `  [${flags.join(', ')}]` : '  [active]';
  return `${status.label}${flagStr}`;
}

export async function formatStatusBatch(
  labels: string[],
  storageDir: string
): Promise<string> {
  const statuses = await Promise.all(
    labels.map((label) => getSnapshotStatus(label, storageDir))
  );
  return statuses.map(formatStatus).join('\n');
}
