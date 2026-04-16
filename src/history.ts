import * as fs from 'fs';
import * as path from 'path';

export interface HistoryEntry {
  label: string;
  timestamp: string;
  file: string;
}

export interface HistoryIndex {
  entries: HistoryEntry[];
}

const DEFAULT_HISTORY_FILE = '.envsnap_history.json';

export function loadHistory(historyFile: string = DEFAULT_HISTORY_FILE): HistoryIndex {
  if (!fs.existsSync(historyFile)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(historyFile, 'utf-8');
  return JSON.parse(raw) as HistoryIndex;
}

export function saveHistory(index: HistoryIndex, historyFile: string = DEFAULT_HISTORY_FILE): void {
  fs.writeFileSync(historyFile, JSON.stringify(index, null, 2), 'utf-8');
}

export function addHistoryEntry(
  label: string,
  snapshotFile: string,
  historyFile: string = DEFAULT_HISTORY_FILE
): HistoryEntry {
  const index = loadHistory(historyFile);
  const entry: HistoryEntry = {
    label,
    timestamp: new Date().toISOString(),
    file: path.resolve(snapshotFile),
  };
  index.entries.push(entry);
  saveHistory(index, historyFile);
  return entry;
}

export function findEntry(label: string, historyFile: string = DEFAULT_HISTORY_FILE): HistoryEntry | undefined {
  const index = loadHistory(historyFile);
  return index.entries.find((e) => e.label === label);
}

export function listEntries(historyFile: string = DEFAULT_HISTORY_FILE): HistoryEntry[] {
  return loadHistory(historyFile).entries;
}
