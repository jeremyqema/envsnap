export interface SnapshotData {
  timestamp: string;
  env: Record<string, string>;
}

export interface DiffResult {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: Record<string, string>;
}

export function diffSnapshots(before: SnapshotData, after: SnapshotData): DiffResult {
  const result: DiffResult = {
    added: {},
    removed: {},
    changed: {},
    unchanged: {},
  };

  const allKeys = new Set([...Object.keys(before.env), ...Object.keys(after.env)]);

  for (const key of allKeys) {
    const inBefore = key in before.env;
    const inAfter = key in after.env;

    if (inBefore && !inAfter) {
      result.removed[key] = before.env[key];
    } else if (!inBefore && inAfter) {
      result.added[key] = after.env[key];
    } else if (before.env[key] !== after.env[key]) {
      result.changed[key] = { from: before.env[key], to: after.env[key] };
    } else {
      result.unchanged[key] = before.env[key];
    }
  }

  return result;
}

export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(diff.added)) {
    lines.push(`+ ${key}=${value}`);
  }
  for (const [key, value] of Object.entries(diff.removed)) {
    lines.push(`- ${key}=${value}`);
  }
  for (const [key, { from, to }] of Object.entries(diff.changed)) {
    lines.push(`~ ${key}: ${from} → ${to}`);
  }

  if (lines.length === 0) {
    return 'No differences found.';
  }

  return lines.join('\n');
}
