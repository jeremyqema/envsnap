import * as path from 'path';
import { buildChain, summarizeChain } from './snapshot-chain';
import { formatDiff } from './diff';

export function cmdChainUsage(): void {
  console.log(`
Usage: envsnap chain <label1> <label2> [label3...] [--dir <dir>] [--summary]

Build and display a diff chain across an ordered sequence of snapshots.

Options:
  --dir <dir>      Directory containing snapshot files (default: .)
  --summary        Print only totals, not per-link diffs
`.trim());
}

export async function cmdChain(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv.includes('--help')) {
    cmdChainUsage();
    return;
  }

  let dir = '.';
  let summaryOnly = false;
  const labels: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) {
      dir = argv[++i];
    } else if (argv[i] === '--summary') {
      summaryOnly = true;
    } else {
      labels.push(argv[i]);
    }
  }

  if (labels.length < 2) {
    console.error('Error: provide at least two snapshot labels.');
    process.exit(1);
  }

  const chain = await buildChain(labels, path.resolve(dir));

  if (summaryOnly) {
    const { totalAdded, totalRemoved, totalChanged } = summarizeChain(chain);
    console.log(`Chain: ${chain.labels.join(' → ')}`);
    console.log(`  Added:   ${totalAdded}`);
    console.log(`  Removed: ${totalRemoved}`);
    console.log(`  Changed: ${totalChanged}`);
    return;
  }

  for (const link of chain.links) {
    console.log(`\n── ${link.label} ──`);
    const formatted = formatDiff(link.diff);
    if (formatted.trim() === '') {
      console.log('  (no changes)');
    } else {
      console.log(formatted);
    }
  }
}
