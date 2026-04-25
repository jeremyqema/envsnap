import * as path from "path";
import {
  loadArchiveIndex,
  saveArchiveIndex,
  archiveSnapshot,
  unarchiveSnapshot,
  listArchived,
  isArchived,
} from "./snapshot-archive";

const DEFAULT_INDEX = path.join(".envsnap", "archive-index.json");

export function cmdArchiveUsage(): void {
  console.log(`Usage:
  envsnap archive add <label> [--reason <text>]   Archive a snapshot
  envsnap archive remove <label>                  Unarchive a snapshot
  envsnap archive list                            List archived snapshots
  envsnap archive check <label>                   Check if a snapshot is archived
`);
}

export function cmdArchiveAdd(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const label = args[0];
  if (!label) {
    console.error("Error: label is required.");
    process.exit(1);
  }
  const reasonIdx = args.indexOf("--reason");
  const reason = reasonIdx !== -1 ? args[reasonIdx + 1] : undefined;
  const index = loadArchiveIndex(indexPath);
  const updated = archiveSnapshot(index, label, reason);
  saveArchiveIndex(indexPath, updated);
  console.log(`Archived snapshot "${label}"${reason ? ` (${reason})` : ""}.`);
}

export function cmdArchiveRemove(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const label = args[0];
  if (!label) {
    console.error("Error: label is required.");
    process.exit(1);
  }
  const index = loadArchiveIndex(indexPath);
  const updated = unarchiveSnapshot(index, label);
  saveArchiveIndex(indexPath, updated);
  console.log(`Unarchived snapshot "${label}".`);
}

export function cmdArchiveList(
  _args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const index = loadArchiveIndex(indexPath);
  const entries = listArchived(index);
  if (entries.length === 0) {
    console.log("No archived snapshots.");
    return;
  }
  for (const e of entries) {
    const reason = e.reason ? `  reason: ${e.reason}` : "";
    console.log(`${e.label}  archived: ${e.archivedAt}${reason}`);
  }
}

export function cmdArchiveCheck(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const label = args[0];
  if (!label) {
    console.error("Error: label is required.");
    process.exit(1);
  }
  const index = loadArchiveIndex(indexPath);
  const archived = isArchived(index, label);
  console.log(`Snapshot "${label}" is ${archived ? "" : "not "}archived.`);
}
