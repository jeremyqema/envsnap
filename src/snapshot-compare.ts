import { Snapshot } from './snapshot';
import { diffSnapshots, DiffResult } from './diff';
import { filterEnv } from './filter';
import { resolveAlias } from './alias';

export interface CompareOptions {
  aliasFile?: string;
  include?: string[];
  exclude?: string[];
  ignoreCase?: boolean;
}

export interface CompareResult {
  left: string;
  right: string;
  diff: DiffResult;
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
}

export function compareSnapshots(
  left: Snapshot,
  right: Snapshot,
  options: CompareOptions = {}
): CompareResult {
  let leftEnv = { ...left.env };
  let rightEnv = { ...right.env };

  if (options.include || options.exclude) {
    leftEnv = filterEnv(leftEnv, {
      include: options.include ?? [],
      exclude: options.exclude ?? []
    });
    rightEnv = filterEnv(rightEnv, {
      include: options.include ?? [],
      exclude: options.exclude ?? []
    });
  }

  if (options.ignoreCase) {
    const lower = (o: Record<string, string>) =>
      Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toLowerCase(), v]));
    leftEnv = lower(leftEnv);
    rightEnv = lower(rightEnv);
  }

  const diff = diffSnapshots(
    { ...left, env: leftEnv },
    { ...right, env: rightEnv }
  );

  const summary = {
    added: diff.added.length,
    removed: diff.removed.length,
    changed: diff.changed.length,
    unchanged: diff.unchanged.length
  };

  return {
    left: left.label ?? left.timestamp,
    right: right.label ?? right.timestamp,
    diff,
    summary
  };
}

export function formatCompareResult(result: CompareResult): string {
  const lines: string[] = [
    `Comparing: ${result.left} → ${result.right}`,
    `  Added:     ${result.summary.added}`,
    `  Removed:   ${result.summary.removed}`,
    `  Changed:   ${result.summary.changed}`,
    `  Unchanged: ${result.summary.unchanged}`,
    ''
  ];

  for (const key of result.diff.added) {
    lines.push(`+ ${key}=${result.diff.rightEnv[key]}`);
  }
  for (const key of result.diff.removed) {
    lines.push(`- ${key}=${result.diff.leftEnv[key]}`);
  }
  for (const key of result.diff.changed) {
    lines.push(`~ ${key}: ${result.diff.leftEnv[key]} → ${result.diff.rightEnv[key]}`);
  }

  return lines.join('\n');
}
