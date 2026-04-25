import * as fs from "fs";

export interface AccessEntry {
  label: string;
  accessedAt: string;
  action: "read" | "write" | "delete";
}

export interface AccessIndex {
  entries: AccessEntry[];
}

export function emptyAccessIndex(): AccessIndex {
  return { entries: [] };
}

export function loadAccessIndex(filePath: string): AccessIndex {
  if (!fs.existsSync(filePath)) return emptyAccessIndex();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as AccessIndex;
}

export function saveAccessIndex(filePath: string, index: AccessIndex): void {
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2), "utf-8");
}

export function recordAccess(
  index: AccessIndex,
  label: string,
  action: AccessEntry["action"]
): AccessIndex {
  const entry: AccessEntry = {
    label,
    accessedAt: new Date().toISOString(),
    action,
  };
  return { entries: [...index.entries, entry] };
}

export function getAccessHistory(
  index: AccessIndex,
  label: string
): AccessEntry[] {
  return index.entries.filter((e) => e.label === label);
}

export function getRecentAccess(
  index: AccessIndex,
  limit = 10
): AccessEntry[] {
  return [...index.entries]
    .sort((a, b) => b.accessedAt.localeCompare(a.accessedAt))
    .slice(0, limit);
}

export function clearAccessHistory(
  index: AccessIndex,
  label: string
): AccessIndex {
  return { entries: index.entries.filter((e) => e.label !== label) };
}
