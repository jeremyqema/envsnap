import * as fs from "fs";
import * as path from "path";

export interface ArchiveEntry {
  label: string;
  archivedAt: string;
  reason?: string;
}

export interface ArchiveIndex {
  entries: ArchiveEntry[];
}

export function emptyArchiveIndex(): ArchiveIndex {
  return { entries: [] };
}

export function loadArchiveIndex(indexPath: string): ArchiveIndex {
  if (!fs.existsSync(indexPath)) return emptyArchiveIndex();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as ArchiveIndex;
}

export function saveArchiveIndex(indexPath: string, index: ArchiveIndex): void {
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export function archiveSnapshot(
  index: ArchiveIndex,
  label: string,
  reason?: string
): ArchiveIndex {
  if (index.entries.some((e) => e.label === label)) {
    throw new Error(`Snapshot "${label}" is already archived.`);
  }
  const entry: ArchiveEntry = {
    label,
    archivedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };
  return { entries: [...index.entries, entry] };
}

export function unarchiveSnapshot(
  index: ArchiveIndex,
  label: string
): ArchiveIndex {
  const exists = index.entries.some((e) => e.label === label);
  if (!exists) {
    throw new Error(`Snapshot "${label}" is not archived.`);
  }
  return { entries: index.entries.filter((e) => e.label !== label) };
}

export function isArchived(index: ArchiveIndex, label: string): boolean {
  return index.entries.some((e) => e.label === label);
}

export function listArchived(index: ArchiveIndex): ArchiveEntry[] {
  return [...index.entries];
}
