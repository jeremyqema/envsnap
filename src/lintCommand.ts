import * as fs from 'fs';
import { loadSnapshot } from './snapshot';
import { lintSnapshot, formatLintResults, LintRule } from './lint';

export function cmdLintUsage(): void {
  console.log('Usage: envsnap lint <snapshot-file> [--strict]');
  console.log('  --strict   Exit with code 1 if any issues are found');
}

export async function cmdLint(args: string[]): Promise<void> {
  const strict = args.includes('--strict');
  const fileArgs = args.filter((a) => !a.startsWith('--'));

  if (fileArgs.length === 0) {
    cmdLintUsage();
    process.exit(1);
  }

  const filePath = fileArgs[0];
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  let snapshot;
  try {
    snapshot = loadSnapshot(filePath);
  } catch (err) {
    console.error(`Failed to parse snapshot file: ${(err as Error).message}`);
    process.exit(1);
  }

  const results = lintSnapshot(snapshot.env);
  const output = formatLintResults(results);

  console.log(output);

  if (strict && results.length > 0) {
    process.exit(1);
  }
}
