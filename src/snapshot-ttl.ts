import * as fs from "fs";

export interface TtlEntry {
  label: string;
  expiresAt: number; // Unix ms
}

export interface TtlIndex {
  entries: TtlEntry[];
}

export function emptyTtlIndex(): TtlIndex {
  return { entries: [] };
}

export function loadTtlIndex(indexPath: string): TtlIndex {
  if (!fs.existsSync(indexPath)) return emptyTtlIndex();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as TtlIndex;
}

export function saveTtlIndex(indexPath: string, index: TtlIndex): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export function setTtl(
  index: TtlIndex,
  label: string,
  ttlSeconds: number
): TtlIndex {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const filtered = index.entries.filter((e) => e.label !== label);
  return { entries: [...filtered, { label, expiresAt }] };
}

export function removeTtl(index: TtlIndex, label: string): TtlIndex {
  return { entries: index.entries.filter((e) => e.label !== label) };
}

export function getTtl(index: TtlIndex, label: string): TtlEntry | undefined {
  return index.entries.find((e) => e.label === label);
}

export function getExpiredLabels(
  index: TtlIndex,
  now: number = Date.now()
): string[] {
  return index.entries
    .filter((e) => e.expiresAt <= now)
    .map((e) => e.label);
}

export function pruneExpired(
  index: TtlIndex,
  now: number = Date.now()
): { index: TtlIndex; removed: string[] } {
  const removed = getExpiredLabels(index, now);
  const entries = index.entries.filter((e) => e.expiresAt > now);
  return { index: { entries }, removed };
}
