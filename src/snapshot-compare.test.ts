import { compareSnapshots, formatCompareResult } from './snapshot-compare';
import { Snapshot } from './snapshot';

function makeSnapshot(env: Record<string, string>, label?: string): Snapshot {
  return { timestamp: '2024-01-01T00:00:00Z', label, env };
}

describe('compareSnapshots', () => {
  it('detects added keys', () => {
    const left = makeSnapshot({ A: '1' }, 'v1');
    const right = makeSnapshot({ A: '1', B: '2' }, 'v2');
    const result = compareSnapshots(left, right);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.changed).toBe(0);
    expect(result.summary.unchanged).toBe(1);
  });

  it('detects removed keys', () => {
    const left = makeSnapshot({ A: '1', B: '2' });
    const right = makeSnapshot({ A: '1' });
    const result = compareSnapshots(left, right);
    expect(result.summary.removed).toBe(1);
  });

  it('detects changed keys', () => {
    const left = makeSnapshot({ A: '1' });
    const right = makeSnapshot({ A: '2' });
    const result = compareSnapshots(left, right);
    expect(result.summary.changed).toBe(1);
    expect(result.summary.unchanged).toBe(0);
  });

  it('respects include filter', () => {
    const left = makeSnapshot({ A: '1', B: '2' });
    const right = makeSnapshot({ A: '9', B: '2' });
    const result = compareSnapshots(left, right, { include: ['B'] });
    expect(result.summary.changed).toBe(0);
    expect(result.summary.unchanged).toBe(1);
  });

  it('respects exclude filter', () => {
    const left = makeSnapshot({ A: '1', SECRET: 'x' });
    const right = makeSnapshot({ A: '2', SECRET: 'x' });
    const result = compareSnapshots(left, right, { exclude: ['SECRET'] });
    expect(result.summary.changed).toBe(1);
  });

  it('uses label for left/right names when available', () => {
    const left = makeSnapshot({}, 'prod');
    const right = makeSnapshot({}, 'staging');
    const result = compareSnapshots(left, right);
    expect(result.left).toBe('prod');
    expect(result.right).toBe('staging');
  });

  it('falls back to timestamp when no label', () => {
    const left = makeSnapshot({});
    const right = makeSnapshot({});
    const result = compareSnapshots(left, right);
    expect(result.left).toBe('2024-01-01T00:00:00Z');
  });
});

describe('formatCompareResult', () => {
  it('includes summary lines', () => {
    const left = makeSnapshot({ A: '1' }, 'v1');
    const right = makeSnapshot({ A: '2', B: '3' }, 'v2');
    const result = compareSnapshots(left, right);
    const output = formatCompareResult(result);
    expect(output).toContain('v1 → v2');
    expect(output).toContain('Added:     1');
    expect(output).toContain('Changed:   1');
    expect(output).toContain('+ B=3');
    expect(output).toContain('~ A: 1 → 2');
  });
});
