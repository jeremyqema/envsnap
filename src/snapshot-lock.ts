import * as fs from "fs";
import * as path from "path";

export interface LockIndex {
  locked: Record<string, { reason: string; lockedAt: string }>;
}

export function emptyLockIndex(): LockIndex {
  return { locked: {} };
}

export function loadLocks(indexPath: string): LockIndex {
  if (!fs.existsSync(indexPath)) return emptyLockIndex();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as LockIndex;
}

export function saveLocks(indexPath: string, index: LockIndex): void {
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export function lockSnapshot(
  index: LockIndex,
  label: string,
  reason: string
): LockIndex {
  if (index.locked[label]) {
    throw new Error(`Snapshot "${label}" is already locked.`);
  }
  return {
    ...index,
    locked: {
      ...index.locked,
      [label]: { reason, lockedAt: new Date().toISOString() },
    },
  };
}

export function unlockSnapshot(index: LockIndex, label: string): LockIndex {
  if (!index.locked[label]) {
    throw new Error(`Snapshot "${label}" is not locked.`);
  }
  const { [label]: _removed, ...rest } = index.locked;
  return { ...index, locked: rest };
}

export function isLocked(index: LockIndex, label: string): boolean {
  return Boolean(index.locked[label]);
}

export function getLock(
  index: LockIndex,
  label: string
): { reason: string; lockedAt: string } | undefined {
  return index.locked[label];
}

export function listLocks(
  index: LockIndex
): Array<{ label: string; reason: string; lockedAt: string }> {
  return Object.entries(index.locked).map(([label, meta]) => ({
    label,
    ...meta,
  }));
}
