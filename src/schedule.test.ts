import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadSchedule, saveSchedule, addScheduleEntry,
  removeScheduleEntry, getDueEntries, markRan
} from './schedule';

function tmpFile() {
  return path.join(os.tmpdir(), `sched-test-${Date.now()}-${Math.random()}.json`);
}

describe('schedule store', () => {
  it('returns empty store for missing file', () => {
    expect(loadSchedule('/nonexistent/file.json')).toEqual({ entries: [] });
  });

  it('saves and loads entries', () => {
    const f = tmpFile();
    const store = { entries: [] };
    addScheduleEntry(store, { label: 'test', intervalMs: 1000, snapshotFile: 'snap.json' });
    saveSchedule(f, store);
    const loaded = loadSchedule(f);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].label).toBe('test');
    fs.unlinkSync(f);
  });

  it('addScheduleEntry sets id and nextRun', () => {
    const store = { entries: [] };
    const before = Date.now();
    const entry = addScheduleEntry(store, { label: 'x', intervalMs: 5000, snapshotFile: 'x.json' });
    expect(entry.id).toBeTruthy();
    expect(entry.nextRun).toBeGreaterThanOrEqual(before + 5000);
  });

  it('removeScheduleEntry removes by id', () => {
    const store = { entries: [] };
    const e = addScheduleEntry(store, { label: 'r', intervalMs: 1000, snapshotFile: 'r.json' });
    expect(removeScheduleEntry(store, e.id)).toBe(true);
    expect(store.entries).toHaveLength(0);
  });

  it('getDueEntries returns entries with nextRun <= now', () => {
    const store = { entries: [] };
    const e = addScheduleEntry(store, { label: 'd', intervalMs: 1000, snapshotFile: 'd.json' });
    e.nextRun = Date.now() - 1;
    expect(getDueEntries(store)).toContain(e);
  });

  it('markRan updates lastRun and nextRun', () => {
    const store = { entries: [] };
    const e = addScheduleEntry(store, { label: 'm', intervalMs: 2000, snapshotFile: 'm.json' });
    const now = Date.now();
    markRan(e, now);
    expect(e.lastRun).toBe(now);
    expect(e.nextRun).toBe(now + 2000);
  });
});
