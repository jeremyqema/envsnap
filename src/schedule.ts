import * as fs from 'fs';

export interface ScheduleEntry {
  id: string;
  label: string;
  intervalMs: number;
  snapshotFile: string;
  lastRun?: number;
  nextRun: number;
}

export interface ScheduleStore {
  entries: ScheduleEntry[];
}

export function loadSchedule(file: string): ScheduleStore {
  if (!fs.existsSync(file)) return { entries: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function saveSchedule(file: string, store: ScheduleStore): void {
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
}

export function addScheduleEntry(
  store: ScheduleStore,
  entry: Omit<ScheduleEntry, 'id' | 'nextRun'> & { id?: string }
): ScheduleEntry {
  const id = entry.id ?? `sched-${Date.now()}`;
  const newEntry: ScheduleEntry = { ...entry, id, nextRun: Date.now() + entry.intervalMs };
  store.entries.push(newEntry);
  return newEntry;
}

export function removeScheduleEntry(store: ScheduleStore, id: string): boolean {
  const before = store.entries.length;
  store.entries = store.entries.filter(e => e.id !== id);
  return store.entries.length < before;
}

export function getDueEntries(store: ScheduleStore, now = Date.now()): ScheduleEntry[] {
  return store.entries.filter(e => e.nextRun <= now);
}

export function markRan(entry: ScheduleEntry, now = Date.now()): void {
  entry.lastRun = now;
  entry.nextRun = now + entry.intervalMs;
}
