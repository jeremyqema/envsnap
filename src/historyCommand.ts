import { addHistoryEntry, listEntries, findEntry } from './history';
import { loadSnapshot } from './snapshot';
import { diffSnapshots, formatDiff } from './diff';

export function cmdRecord(label: string, snapshotFile: string, historyFile?: string): void {
  const entry = addHistoryEntry(label, snapshotFile, historyFile);
  console.log(`Recorded snapshot "${entry.label}" at ${entry.timestamp}`);
}

export function cmdList(historyFile?: string): void {
  const entries = listEntries(historyFile);
  if (entries.length === 0) {
    console.log('No snapshots recorded.');
    return;
  }
  console.log('Recorded snapshots:');
  for (const e of entries) {
    console.log(`  [${e.timestamp}] ${e.label} -> ${e.file}`);
  }
}

export function cmdDiffLabels(
  labelA: string,
  labelB: string,
  historyFile?: string
): void {
  const entryA = findEntry(labelA, historyFile);
  const entryB = findEntry(labelB, historyFile);

  if (!entryA) {
    console.error(`Label not found in history: ${labelA}`);
    process.exit(1);
  }
  if (!entryB) {
    console.error(`Label not found in history: ${labelB}`);
    process.exit(1);
  }

  const snapA = loadSnapshot(entryA.file);
  const snapB = loadSnapshot(entryB.file);
  const diffs = diffSnapshots(snapA, snapB);

  if (diffs.length === 0) {
    console.log(`No differences between "${labelA}" and "${labelB}".`);
    return;
  }

  console.log(`Diff: ${labelA} -> ${labelB}`);
  console.log(formatDiff(diffs));
}
