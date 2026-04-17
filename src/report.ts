import { DiffResult } from './diff';

export interface ReportOptions {
  showUnchanged?: boolean;
  format?: 'text' | 'json';
}

/**
 * Generates a human-readable or JSON summary of a DiffResult.
 *
 * @param diff - The diff to report on.
 * @param beforeLabel - Label for the "before" snapshot (e.g. a filename or timestamp).
 * @param afterLabel - Label for the "after" snapshot.
 * @param options - Formatting options.
 * @returns A formatted string representation of the diff.
 */
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

/**
 * Returns a one-line summary of a DiffResult, e.g. "+2 -1 ~3".
 *
 * @param diff - The diff to summarise.
 * @returns A compact summary string.
 */
export function summarizeDiff(diff: DiffResult): string {
  const added = Object.keys(diff.added).length;
  const removed = Object.keys(diff.removed).length;
  const changed = Object.keys(diff.changed).length;

  if (!added && !removed && !changed) {
    return 'no changes';
  }

  const parts: string[] = [];
  if (added) parts.push(`+${added}`);
  if (removed) parts.push(`-${removed}`);
  if (changed) parts.push(`~${changed}`);
  return parts.join(' ');
}
