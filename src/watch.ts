import { captureSnapshot, loadSnapshot, saveSnapshot } from './snapshot';
import { diffSnapshots } from './diff';
import { applyFilter } from './applyFilter';
import { loadFilterConfig } from './filterConfig';
import * as fs from 'fs';

export interface WatchOptions {
  snapshotPath: string;
  filterConfigPath?: string;
  intervalMs?: number;
  onChange: (diff: ReturnType<typeof diffSnapshots>) => void;
}

export function startWatch(options: WatchOptions): () => void {
  const { snapshotPath, filterConfigPath, intervalMs = 5000, onChange } = options;

  let previous = loadSnapshot(snapshotPath) ?? captureSnapshot();

  const tick = () => {
    let current = captureSnapshot();

    if (filterConfigPath && fs.existsSync(filterConfigPath)) {
      const config = loadFilterConfig(filterConfigPath);
      current = applyFilter(current, config);
    }

    const diff = diffSnapshots(previous, current);
    const hasChanges =
      diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

    if (hasChanges) {
      saveSnapshot(snapshotPath, current);
      previous = current;
      onChange(diff);
    }
  };

  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

export function pollOnce(snapshotPath: string, filterConfigPath?: string): ReturnType<typeof diffSnapshots> | null {
  const previous = loadSnapshot(snapshotPath);
  if (!previous) return null;

  let current = captureSnapshot();
  if (filterConfigPath && fs.existsSync(filterConfigPath)) {
    const config = loadFilterConfig(filterConfigPath);
    current = applyFilter(current, config);
  }

  return diffSnapshots(previous, current);
}
