import { DiffResult } from './diff';

export interface ReportOptions {
  showUnchanged?: boolean;
  format?: 'text' | 'json';
}

export function generateReport(
  diff: DiffResult,
  beforeLabel: string,
  afterLabel: string,
  options: ReportOptions = {}
): string {
  const { showUnchanged = false, format = 'text' } = options;

  if (format === 'json') {
    const output: Record<string, unknown> = {
      from: beforeLabel,
      to: afterLabel,
      added: diff.added,
      removed: diff.removed,
      changed: diff.changed,
    };
    if (showUnchanged) {
      output.unchanged = diff.unchanged;
    }
    return JSON.stringify(output, null, 2);
  }

  const lines: string[] = [];
  lines.push(`Diff: ${beforeLabel} → ${afterLabel}`);
  lines.push('─'.repeat(40));

  const addedKeys = Object.keys(diff.added);
  const removedKeys = Object.keys(diff.removed);
  const changedKeys = Object.keys(diff.changed);

  if (addedKeys.length) {
    lines.push(`\nAdded (${addedKeys.length}):`);
    for (const [k, v] of Object.entries(diff.added)) {
      lines.push(`  + ${k}=${v}`);
    }
  }

  if (removedKeys.length) {
    lines.push(`\nRemoved (${removedKeys.length}):`);
    for (const [k, v] of Object.entries(diff.removed)) {
      lines.push(`  - ${k}=${v}`);
    }
  }

  if (changedKeys.length) {
    lines.push(`\nChanged (${changedKeys.length}):`);
    for (const [k, { from, to }] of Object.entries(diff.changed)) {
      lines.push(`  ~ ${k}`);
      lines.push(`      from: ${from}`);
      lines.push(`      to:   ${to}`);
    }
  }

  if (showUnchanged && Object.keys(diff.unchanged).length) {
    lines.push(`\nUnchanged (${Object.keys(diff.unchanged).length}):`);
    for (const [k, v] of Object.entries(diff.unchanged)) {
      lines.push(`    ${k}=${v}`);
    }
  }

  if (!addedKeys.length && !removedKeys.length && !changedKeys.length) {
    lines.push('\nNo differences found.');
  }

  return lines.join('\n');
}
