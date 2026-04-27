import * as fs from 'fs';
import { loadSnapshot } from './snapshot';
import { diffSnapshots } from './diff';
import {
  summarizeSnapshot,
  buildComparativeSummary,
  formatComparativeSummary,
} from './snapshot-summary';

export function cmdSummaryUsage(): void {
  console.log(`Usage: envsnap summary <snapshot-file> [--compare <other-file>] [--json]`);
  console.log(`  Summarize a snapshot or compare two snapshots side-by-side.`);
}

export async function cmdSummary(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === '--help') {
    cmdSummaryUsage();
    return;
  }

  const baseFile = args[0];
  const compareIdx = args.indexOf('--compare');
  const jsonMode = args.includes('--json');

  if (!fs.existsSync(baseFile)) {
    console.error(`Error: file not found: ${baseFile}`);
    process.exit(1);
  }

  const base = loadSnapshot(baseFile);

  if (compareIdx !== -1) {
    const targetFile = args[compareIdx + 1];
    if (!targetFile || !fs.existsSync(targetFile)) {
      console.error(`Error: comparison file not found: ${targetFile}`);
      process.exit(1);
    }
    const target = loadSnapshot(targetFile);
    const diff = diffSnapshots(base, target);
    const summary = buildComparativeSummary(baseFile, base, targetFile, target, diff);
    if (jsonMode) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(formatComparativeSummary(summary));
    }
  } else {
    const summary = summarizeSnapshot(baseFile, base);
    if (jsonMode) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`Label      : ${summary.label}`);
      console.log(`Keys       : ${summary.keyCount}`);
      console.log(`Redacted   : ${summary.redactedCount}`);
      console.log(`Empty vals : ${summary.emptyValueCount}`);
      console.log(`Top keys   : ${summary.topKeys.join(', ')}`);
      console.log(`Captured   : ${summary.capturedAt}`);
    }
  }
}
