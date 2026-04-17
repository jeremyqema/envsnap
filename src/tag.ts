import * as fs from 'fs';

export interface TagIndex {
  [tag: string]: string[]; // tag -> list of snapshot file paths
}

export function loadTags(indexPath: string): TagIndex {
  if (!fs.existsSync(indexPath)) return {};
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

export function saveTags(indexPath: string, index: TagIndex): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function addTag(index: TagIndex, tag: string, snapshotPath: string): TagIndex {
  const list = index[tag] ?? [];
  if (!list.includes(snapshotPath)) {
    list.push(snapshotPath);
  }
  return { ...index, [tag]: list };
}

export function removeTag(index: TagIndex, tag: string, snapshotPath: string): TagIndex {
  const list = (index[tag] ?? []).filter(p => p !== snapshotPath);
  const updated = { ...index, [tag]: list };
  if (updated[tag].length === 0) delete updated[tag];
  return updated;
}

export function listByTag(index: TagIndex, tag: string): string[] {
  return index[tag] ?? [];
}

export function listAllTags(index: TagIndex): string[] {
  return Object.keys(index);
}
