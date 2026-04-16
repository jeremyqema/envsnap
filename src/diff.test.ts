import { diffSnapshots, formatDiff, SnapshotData } from './diff';

const makeSnapshot = (env: Record<string, string>): SnapshotData => ({
  timestamp: new Date().toISOString(),
  env,
});

describe('diffSnapshots', () => {
  it('detects added keys', () => {
    const before = makeSnapshot({ FOO: 'bar' });
    const after = makeSnapshot({ FOO: 'bar', NEW_KEY: 'hello' });
    const diff = diffSnapshots(before, after);
    expect(diff.added).toEqual({ NEW_KEY: 'hello' });
    expect(diff.removed).toEqual({});
    expect(diff.changed).toEqual({});
  });

  it('detects removed keys', () => {
    const before = makeSnapshot({ FOO: 'bar', OLD_KEY: 'bye' });
    const after = makeSnapshot({ FOO: 'bar' });
    const diff = diffSnapshots(before, after);
    expect(diff.removed).toEqual({ OLD_KEY: 'bye' });
    expect(diff.added).toEqual({});
  });

  it('detects changed values', () => {
    const before = makeSnapshot({ FOO: 'old' });
    const after = makeSnapshot({ FOO: 'new' });
    const diff = diffSnapshots(before, after);
    expect(diff.changed).toEqual({ FOO: { from: 'old', to: 'new' } });
  });

  it('tracks unchanged keys', () => {
    const before = makeSnapshot({ STABLE: 'same' });
    const after = makeSnapshot({ STABLE: 'same' });
    const diff = diffSnapshots(before, after);
    expect(diff.unchanged).toEqual({ STABLE: 'same' });
  });

  it('handles empty snapshots', () => {
    const diff = diffSnapshots(makeSnapshot({}), makeSnapshot({}));
    expect(diff.added).toEqual({});
    expect(diff.removed).toEqual({});
    expect(diff.changed).toEqual({});
  });
});

describe('formatDiff', () => {
  it('returns no differences message when empty', () => {
    const diff = diffSnapshots(makeSnapshot({ A: '1' }), makeSnapshot({ A: '1' }));
    expect(formatDiff(diff)).toBe('No differences found.');
  });

  it('formats added, removed, and changed lines', () => {
    const before = makeSnapshot({ FOO: 'old', GONE: 'bye' });
    const after = makeSnapshot({ FOO: 'new', FRESH: 'hi' });
    const output = formatDiff(diffSnapshots(before, after));
    expect(output).toContain('+ FRESH=hi');
    expect(output).toContain('- GONE=bye');
    expect(output).toContain('~ FOO: old → new');
  });
});
