import { startWatch } from './watch';
import { formatDiff } from './diff';
import * as path from 'path';

export interface WatchCommandOptions {
  snapshotPath?: string;
  filterConfig?: string;
  intervalMs?: number;
  quiet?: boolean;
}

export function cmdWatch(options: WatchCommandOptions = {}): () => void {
  const snapshotPath = options.snapshotPath ?? path.resolve('.envsnap');
  const intervalMs = options.intervalMs ?? 5000;
  const quiet = options.quiet ?? false;

  if (!quiet) {
    console.log(`[envsnap] Watching environment every ${intervalMs}ms...`);
    console.log(`[envsnap] Snapshot: ${snapshotPath}`);
  }

  const stop = startWatch({
    snapshotPath,
    filterConfigPath: options.filterConfig,
    intervalMs,
    onChange: diff => {
      const timestamp = new Date().toISOString();
      console.log(`\n[envsnap] Change detected at ${timestamp}`);
      console.log(formatDiff(diff));
    },
  });

  process.on('SIGINT', () => {
    if (!quiet) console.log('\n[envsnap] Stopped.');
    stop();
    process.exit(0);
  });

  return stop;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const snapshotArg = args.find(a => a.startsWith('--snapshot='));
  const filterArg = args.find(a => a.startsWith('--filter='));

  cmdWatch({
    intervalMs: intervalArg ? parseInt(intervalArg.split('=')[1], 10) : undefined,
    snapshotPath: snapshotArg ? snapshotArg.split('=')[1] : undefined,
    filterConfig: filterArg ? filterArg.split('=')[1] : undefined,
  });
}
