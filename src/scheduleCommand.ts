import { loadSchedule, saveSchedule, addScheduleEntry, removeScheduleEntry, listSchedule } from './schedule';

const DEFAULT_FILE = '.envsnap-schedule.json';

export function cmdScheduleAdd(args: string[]): void {
  const label = args[0];
  const intervalMs = parseInt(args[1] ?? '3600000', 10);
  const snapshotFile = args[2] ?? `.envsnap-${label}.json`;
  if (!label) { console.error('Usage: schedule add <label> [intervalMs] [snapshotFile]'); process.exit(1); }
  const store = loadSchedule(DEFAULT_FILE);
  const entry = addScheduleEntry(store, { label, intervalMs, snapshotFile });
  saveSchedule(DEFAULT_FILE, store);
  console.log(`Scheduled "${label}" every ${intervalMs}ms (id: ${entry.id})`);
}

export function cmdScheduleRemove(args: string[]): void {
  const id = args[0];
  if (!id) { console.error('Usage: schedule remove <id>'); process.exit(1); }
  const store = loadSchedule(DEFAULT_FILE);
  const removed = removeScheduleEntry(store, id);
  if (!removed) { console.error(`No schedule entry with id: ${id}`); process.exit(1); }
  saveSchedule(DEFAULT_FILE, store);
  console.log(`Removed schedule entry ${id}`);
}

export function cmdScheduleList(): void {
  const store = loadSchedule(DEFAULT_FILE);
  if (store.entries.length === 0) { console.log('No scheduled entries.'); return; }
  for (const e of store.entries) {
    console.log(`[${e.id}] ${e.label} every ${e.intervalMs}ms -> ${e.snapshotFile} (next: ${new Date(e.nextRun).toISOString()})`);
  }
}
