import { loadSnapshot } from './snapshot';
import { diffSnapshots, formatDiff } from './diff';
import { applyFilter } from './applyFilter';
import { loadFilterConfig } from './filterConfig';

export interface CompareOptions {
  filterConfigPath?: string;
  redact?: boolean;
  outputFormat?: 'text' | 'json';
}

export async function compareSnapshots(
  pathA: string,
  pathB: string,
  options: CompareOptions = {}
): Promise<string> {
  let snapA = await loadSnapshot(pathA);
  let snapB = await loadSnapshot(pathB);

  if (options.filterConfigPath) {
    const config = await loadFilterConfig(options.filterConfigPath);
    snapA = applyFilter(snapA, config, options.redact ?? false);
    snapB = applyFilter(snapB, config, options.redact ?? false);
  }

  const diff = diffSnapshots(snapA, snapB);

  if (options.outputFormat === 'json') {
    return JSON.stringify(diff, null, 2);
  }

  return formatDiff(diff);
}

export async function compareAndPrint(
  pathA: string,
  pathB: string,
  options: CompareOptions = {}
): Promise<void> {
  const result = await compareSnapshots(pathA, pathB, options);
  console.log(result);
}
