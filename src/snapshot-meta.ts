import * as fs from "fs";
import * as path from "path";

export interface SnapshotMeta {
  label: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  author?: string;
  source?: string;
}

export interface MetaIndex {
  [label: string]: SnapshotMeta;
}

export function emptyMetaIndex(): MetaIndex {
  return {};
}

export function loadMetaIndex(filePath: string): MetaIndex {
  if (!fs.existsSync(filePath)) return emptyMetaIndex();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as MetaIndex;
}

export function saveMetaIndex(filePath: string, index: MetaIndex): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2), "utf-8");
}

export function setMeta(
  index: MetaIndex,
  label: string,
  meta: Partial<Omit<SnapshotMeta, "label">>
): MetaIndex {
  const existing = index[label] ?? {
    label,
    createdAt: new Date().toISOString(),
  };
  return {
    ...index,
    [label]: { ...existing, ...meta, label },
  };
}

export function getMeta(
  index: MetaIndex,
  label: string
): SnapshotMeta | undefined {
  return index[label];
}

export function removeMeta(index: MetaIndex, label: string): MetaIndex {
  const next = { ...index };
  delete next[label];
  return next;
}

export function listMeta(index: MetaIndex): SnapshotMeta[] {
  return Object.values(index).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}
