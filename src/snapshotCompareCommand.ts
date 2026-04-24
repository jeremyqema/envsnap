import * as fs from 'fs';
import { loadSnapshot } from './snapshot';
import { resolveAlias, loadAliases } from './alias';
import { compareSnapshots, formatCompareResult, CompareOptions } from './snapshot-compare';
import { exportDiff, writeExport } from './export';

export function cmdSnapshotCompareUsage(): void {
  console.log(`
Usage: envsnap snapshot-compare <left> <right> [options]

Options:
  --include <pattern>   Include only matching keys (repeatable)
  --exclude <pattern>   Exclude matching keys (repeatable)
  --ignore-case         Normalize key casing before compare
  --alias-file <path>   Path to alias file
  --export <format>     Export result: json | csv
  --out <file>          Write export to file instead of stdout
`);
}

export async function cmdSnapshotCompare(args: string[]): Promise<void> {
  if (args.length < 2) {
    cmdSnapshotCompareUsage();
    process.exit(1);
  }

  const [leftArg, rightArg, ...rest] = args;
  const options: CompareOptions = { include: [], exclude: [] };
  let exportFormat: string | undefined;
  let outFile: string | undefined;

  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flag === '--include') options.include!.push(rest[++i]);
    else if (flag === '--exclude') options.exclude!.push(rest[++i]);
    else if (flag === '--ignore-case') options.ignoreCase = true;
    else if (flag === '--alias-file') options.aliasFile = rest[++i];
    else if (flag === '--export') exportFormat = rest[++i];
    else if (flag === '--out') outFile = rest[++i];
  }

  const aliases = options.aliasFile
    ? await loadAliases(options.aliasFile)
    : {};

  const leftPath = resolveAlias(aliases, leftArg);
  const rightPath = resolveAlias(aliases, rightArg);

  const left = await loadSnapshot(leftPath);
  const right = await loadSnapshot(rightPath);

  const result = compareSnapshots(left, right, options);

  if (exportFormat) {
    const exported = exportDiff(result.diff, exportFormat as 'json' | 'csv');
    writeExport(exported, outFile);
    return;
  }

  console.log(formatCompareResult(result));
}
