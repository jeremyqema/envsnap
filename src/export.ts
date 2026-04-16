import { Snapshot } from './snapshot';
import { DiffResult } from './diff';
import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'json' | 'env' | 'csv';

export function exportSnapshot(snapshot: Snapshot, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(snapshot, null, 2);
    case 'env':
      return Object.entries(snapshot.env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
    case 'csv':
      const rows = Object.entries(snapshot.env).map(
        ([k, v]) => `${csvEscape(k)},${csvEscape(v)}`
      );
      return ['key,value', ...rows].join('\n');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export function exportDiff(diff: DiffResult, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(diff, null, 2);
    case 'env':
      const lines: string[] = [];
      for (const k of diff.added) lines.push(`+${k}=${diff.next[k]}`);
      for (const k of diff.removed) lines.push(`-${k}=${diff.prev[k]}`);
      for (const k of diff.changed) lines.push(`~${k}=${diff.prev[k]} -> ${diff.next[k]}`);
      return lines.join('\n');
    case 'csv':
      const csvRows = [
        ...diff.added.map(k => `added,${csvEscape(k)},${csvEscape(diff.next[k])}`)  ,
        ...diff.removed.map(k => `removed,${csvEscape(k)},${csvEscape(diff.prev[k])}`),
        ...diff.changed.map(k => `changed,${csvEscape(k)},${csvEscape(diff.prev[k])},${csvEscape(diff.next[k])}`),
      ];
      return ['change,key,prev,next', ...csvRows].join('\n');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export function writeExport(content: string, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');
}

function csvEscape(value: string = ''): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
