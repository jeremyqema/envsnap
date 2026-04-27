import { summarizeSnapshot, buildComparativeSummary, formatComparativeSummary } from './snapshot-summary';
import { Snapshot } from './snapshot';
import { diffSnapshots } from './diff';

function makeSnapshot(env: Record<string, string>): Snapshot {
  return { env, capturedAt: '2024-01-01T00:00:00.000Z' };
}

describe('summarizeSnapshot', () => {
  it('counts keys correctly', () => {
    const snap = makeSnapshot({ A: '1', B: '2', C: '' });
    const result = summarizeSnapshot('test', snap);
    expect(result.keyCount).toBe(3);
    expect(result.emptyValueCount).toBe(1);
    expect(result.redactedCount).toBe(0);
    expect(result.label).toBe('test');
  });

  it('counts redacted values', () => {
    const snap = makeSnapshot({ A: '[REDACTED]', B: '[REDACTED]', C: 'visible' });
    const result = summarizeSnapshot('redact-test', snap);
    expect(result.redactedCount).toBe(2);
  });

  it('returns top 5 keys max', () => {
    const env: Record<string, string> = {};
    for (let i = 0; i < 10; i++) env[`KEY_${i}`] = `val${i}`;
    const result = summarizeSnapshot('large', makeSnapshot(env));
    expect(result.topKeys.length).toBe(5);
  });
});

describe('buildComparativeSummary', () => {
  it('computes diff counts', () => {
    const base = makeSnapshot({ A: '1', B: '2', C: '3' });
    const target = makeSnapshot({ A: '1', B: 'changed', D: 'new' });
    const diff = diffSnapshots(base, target);
    const summary = buildComparativeSummary('base', base, 'target', target, diff);
    expect(summary.addedCount).toBe(1);
    expect(summary.removedCount).toBe(1);
    expect(summary.changedCount).toBe(1);
    expect(summary.unchangedCount).toBe(1);
  });

  it('changeRatio is between 0 and 1', () => {
    const base = makeSnapshot({ A: '1' });
    const target = makeSnapshot({ A: '2' });
    const diff = diffSnapshots(base, target);
    const summary = buildComparativeSummary('b', base, 't', target, diff);
    expect(summary.changeRatio).toBeGreaterThanOrEqual(0);
    expect(summary.changeRatio).toBeLessThanOrEqual(1);
  });

  it('handles empty snapshots', () => {
    const base = makeSnapshot({});
    const target = makeSnapshot({});
    const diff = diffSnapshots(base, target);
    const summary = buildComparativeSummary('b', base, 't', target, diff);
    expect(summary.changeRatio).toBe(0);
  });
});

describe('formatComparativeSummary', () => {
  it('includes base and target labels', () => {
    const base = makeSnapshot({ X: '1' });
    const target = makeSnapshot({ X: '2' });
    const diff = diffSnapshots(base, target);
    const summary = buildComparativeSummary('snap-a', base, 'snap-b', target, diff);
    const output = formatComparativeSummary(summary);
    expect(output).toContain('snap-a');
    expect(output).toContain('snap-b');
    expect(output).toContain('Change ratio');
  });
});
