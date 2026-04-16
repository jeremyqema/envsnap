import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadHistory,
  saveHistory,
  addHistoryEntry,
  findEntry,
  listEntries,
} from './history';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap_hist_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe('history', () => {
  let histFile: string;

  beforeEach(() => {
    histFile = tmpFile();
  });

  afterEach(() => {
    if (fs.existsSync(histFile)) fs.unlinkSync(histFile);
  });

  test('loadHistory returns empty index when file missing', () => {
    const index = loadHistory(histFile);
    expect(index.entries).toEqual([]);
  });

  test('saveHistory and loadHistory round-trip', () => {
    const index = { entries: [{ label: 'v1', timestamp: '2024-01-01T00:00:00.000Z', file: '/tmp/snap.json' }] };
    saveHistory(index, histFile);
    const loaded = loadHistory(histFile);
    expect(loaded).toEqual(index);
  });

  test('addHistoryEntry appends entry', () => {
    addHistoryEntry('staging', '/tmp/staging.json', histFile);
    addHistoryEntry('prod', '/tmp/prod.json', histFile);
    const entries = listEntries(histFile);
    expect(entries).toHaveLength(2);
    expect(entries[0].label).toBe('staging');
    expect(entries[1].label).toBe('prod');
  });

  test('addHistoryEntry returns entry with timestamp', () => {
    const entry = addHistoryEntry('dev', '/tmp/dev.json', histFile);
    expect(entry.label).toBe('dev');
    expect(entry.timestamp).toBeTruthy();
  });

  test('findEntry returns matching entry', () => {
    addHistoryEntry('alpha', '/tmp/alpha.json', histFile);
    const found = findEntry('alpha', histFile);
    expect(found).toBeDefined();
    expect(found!.label).toBe('alpha');
  });

  test('findEntry returns undefined for missing label', () => {
    const found = findEntry('ghost', histFile);
    expect(found).toBeUndefined();
  });
});
