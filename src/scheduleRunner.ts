import { loadSchedule, saveSchedule, getDueEntries, markRan, ScheduleEntry } from './schedule';
import { captureSnapshot, saveSnapshot } from './snapshot';

export async function runDueSchedules(
  scheduleFile: string,
  onSnapshot?: (entry: ScheduleEntry) => void
): Promise<number> {
  const store = loadSchedule(scheduleFile);
  const due = getDueEntries(store);
  for (const entry of due) {
    const snap = captureSnapshot();
    saveSnapshot(snap, entry.snapshotFile);
    markRan(entry);
    if (onSnapshot) onSnapshot(entry);
  }
  if (due.length > 0) saveSchedule(scheduleFile, store);
  return due.length;
}

export async function startScheduleLoop(
  scheduleFile: string,
  pollIntervalMs = 60_000,
  signal?: AbortSignal
): Promise<void> {
  while (!signal?.aborted) {
    const count = await runDueSchedules(scheduleFile);
    if (count > 0) console.log(`[schedule] ran ${count} due snapshot(s)`);
    await new Promise<void>(resolve => {
      const t = setTimeout(resolve, pollIntervalMs);
      signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }
}
