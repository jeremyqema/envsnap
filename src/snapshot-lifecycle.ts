import * as fs from "fs";

export type LifecycleEvent = "created" | "updated" | "archived" | "deleted" | "restored" | "locked" | "unlocked";

export interface LifecycleEntry {
  label: string;
  event: LifecycleEvent;
  timestamp: string;
  actor?: string;
  note?: string;
}

export interface LifecycleIndex {
  entries: LifecycleEntry[];
}

export function emptyLifecycleIndex(): LifecycleIndex {
  return { entries: [] };
}

export function loadLifecycleIndex(file: string): LifecycleIndex {
  if (!fs.existsSync(file)) return emptyLifecycleIndex();
  return JSON.parse(fs.readFileSync(file, "utf8")) as LifecycleIndex;
}

export function saveLifecycleIndex(file: string, index: LifecycleIndex): void {
  fs.writeFileSync(file, JSON.stringify(index, null, 2));
}

export function recordLifecycleEvent(
  index: LifecycleIndex,
  label: string,
  event: LifecycleEvent,
  actor?: string,
  note?: string
): LifecycleEntry {
  const entry: LifecycleEntry = {
    label,
    event,
    timestamp: new Date().toISOString(),
    ...(actor ? { actor } : {}),
    ...(note ? { note } : {}),
  };
  index.entries.push(entry);
  return entry;
}

export function getLifecycleHistory(index: LifecycleIndex, label: string): LifecycleEntry[] {
  return index.entries.filter((e) => e.label === label);
}

export function getRecentEvents(index: LifecycleIndex, limit = 20): LifecycleEntry[] {
  return [...index.entries]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function clearLifecycleHistory(index: LifecycleIndex, label: string): void {
  index.entries = index.entries.filter((e) => e.label !== label);
}
