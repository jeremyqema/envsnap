import * as fs from "fs";

export interface IndexEntry {
  label: string;
  file: string;
  createdAt: string;
  tags?: string[];
  description?: string;
}

export interface SnapshotIndex {
  entries: IndexEntry[];
}

export function emptyIndex(): SnapshotIndex {
  return { entries: [] };
}

export function loadIndex(indexFile: string): SnapshotIndex {
  if (!fs.existsSync(indexFile)) return emptyIndex();
  return JSON.parse(fs.readFileSync(indexFile, "utf-8")) as SnapshotIndex;
}

export function saveIndex(indexFile: string, index: SnapshotIndex): void {
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

export function addEntry(index: SnapshotIndex, entry: IndexEntry): SnapshotIndex {
  const existing = index.entries.findIndex((e) => e.label === entry.label);
  if (existing >= 0) {
    const updated = [...index.entries];
    updated[existing] = entry;
    return { entries: updated };
  }
  return { entries: [...index.entries, entry] };
}

export function removeEntry(index: SnapshotIndex, label: string): SnapshotIndex {
  return { entries: index.entries.filter((e) => e.label !== label) };
}

export function findEntry(index: SnapshotIndex, label: string): IndexEntry | undefined {
  return index.entries.find((e) => e.label === label);
}

export function listEntries(index: SnapshotIndex, tag?: string): IndexEntry[] {
  if (!tag) return [...index.entries];
  return index.entries.filter((e) => e.tags?.includes(tag));
}

export function formatIndex(entries: IndexEntry[]): string {
  if (entries.length === 0) return "No snapshots indexed.";
  return entries
    .map((e) => {
      const tags = e.tags && e.tags.length > 0 ? ` [${e.tags.join(", ")}]` : "";
      const desc = e.description ? ` — ${e.description}` : "";
      return `${e.label}${tags}${desc}  (${e.createdAt})`;
    })
    .join("\n");
}
