import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadSchedule, saveSchedule, addScheduleEntry } from './schedule';
import { runDueSchedules } from './scheduleRunner';

function tmpFile() {
  return path.join(os.tmpdir(), `schedrun-${Date.now()}-${Math.random()}.json`);
}

describe('runDueSchedules', () => {
  it('runs due entries and updates nextRun', async () => {
    const schedFile = tmpFile();
    const snapFile = tmpFile();
    const store = { entries: [] };
    const e = addScheduleEntry(store, { label: 'run', intervalMs: 5000, snapshotFile: snapFile });
    e.nextRun = Date.now() - 100;
    saveSchedule(schedFile, store);

    const called: string[] = [];
    const count = await runDueSchedules(schedFile, entry => called.push(entry.id));

    expect(count).toBe(1);
    expect(called).toContain(e.id);
    expect(fs.existsSync(snapFile)).toBe(true);

    const updated = loadSchedule(schedFile);
    expect(updated.entries[0].lastRun).toBeDefined();
    expect(updated.entries[0].nextRun).toBeGreaterThan(Date.now() - 1000);

    fs.unlinkSync(schedFile);
    fs.unlinkSync(snapFile);
  });

  it('does nothing when no entries are due', async () => {
    const schedFile = tmpFile();
    const store = { entries: [] };
    addScheduleEntry(store, { label: 'future', intervalMs: 999999, snapshotFile: 'f.json' });
    saveSchedule(schedFile, store);
    const count = await runDueSchedules(schedFile);
    expect(count).toBe(0);
    fs.unlinkSync(schedFile);
  });
});
