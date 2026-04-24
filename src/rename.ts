import * as fs from "fs";
import * as path from "path";

export interface RenameRecord {
  oldLabel: string;
  newLabel: string;
  renamedAt: string;
}

export interface RenameIndex {
  entries: RenameRecord[];
}

export function loadRenameIndex(indexFile: string): RenameIndex {
  if (!fs.existsSync(indexFile)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(indexFile, "utf-8");
  return JSON.parse(raw) as RenameIndex;
}

export function saveRenameIndex(indexFile: string, index: RenameIndex): void {
  fs.mkdirSync(path.dirname(indexFile), { recursive: true });
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), "utf-8");
}

export function renameSnapshot(
  snapshotDir: string,
  oldLabel: string,
  newLabel: string,
  indexFile: string
): void {
  const oldPath = path.join(snapshotDir, `${oldLabel}.json`);
  const newPath = path.join(snapshotDir, `${newLabel}.json`);

  if (!fs.existsSync(oldPath)) {
    throw new Error(`Snapshot "${oldLabel}" not found.`);
  }
  if (fs.existsSync(newPath)) {
    throw new Error(`Snapshot "${newLabel}" already exists.`);
  }

  fs.renameSync(oldPath, newPath);

  const index = loadRenameIndex(indexFile);
  index.entries.push({
    oldLabel,
    newLabel,
    renamedAt: new Date().toISOString(),
  });
  saveRenameIndex(indexFile, index);
}

export function resolveCurrentLabel(label: string, indexFile: string): string {
  const index = loadRenameIndex(indexFile);
  let current = label;
  for (const entry of index.entries) {
    if (entry.oldLabel === current) {
      current = entry.newLabel;
    }
  }
  return current;
}
