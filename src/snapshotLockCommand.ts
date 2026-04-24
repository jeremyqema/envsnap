import * as path from "path";
import {
  loadLocks,
  saveLocks,
  lockSnapshot,
  unlockSnapshot,
  getLock,
  listLocks,
} from "./snapshot-lock";

const DEFAULT_INDEX = path.join(".envsnap", "locks.json");

export function cmdLockUsage(): void {
  console.log(`Usage:
  envsnap lock add <label> --reason <text>   Lock a snapshot
  envsnap lock remove <label>                Unlock a snapshot
  envsnap lock show <label>                  Show lock details
  envsnap lock list                          List all locked snapshots`);
}

export function cmdLockAdd(
  label: string,
  reason: string,
  indexPath = DEFAULT_INDEX
): void {
  if (!label) throw new Error("Label is required.");
  if (!reason) throw new Error("--reason is required.");
  const index = loadLocks(indexPath);
  const updated = lockSnapshot(index, label, reason);
  saveLocks(indexPath, updated);
  console.log(`Locked snapshot "${label}": ${reason}`);
}

export function cmdLockRemove(label: string, indexPath = DEFAULT_INDEX): void {
  if (!label) throw new Error("Label is required.");
  const index = loadLocks(indexPath);
  const updated = unlockSnapshot(index, label);
  saveLocks(indexPath, updated);
  console.log(`Unlocked snapshot "${label}".`);
}

export function cmdLockShow(label: string, indexPath = DEFAULT_INDEX): void {
  if (!label) throw new Error("Label is required.");
  const index = loadLocks(indexPath);
  const lock = getLock(index, label);
  if (!lock) {
    console.log(`Snapshot "${label}" is not locked.`);
    return;
  }
  console.log(`Label:    ${label}`);
  console.log(`Reason:   ${lock.reason}`);
  console.log(`LockedAt: ${lock.lockedAt}`);
}

export function cmdLockList(indexPath = DEFAULT_INDEX): void {
  const index = loadLocks(indexPath);
  const locks = listLocks(index);
  if (locks.length === 0) {
    console.log("No locked snapshots.");
    return;
  }
  for (const entry of locks) {
    console.log(`${entry.label}  [${entry.lockedAt}]  ${entry.reason}`);
  }
}
