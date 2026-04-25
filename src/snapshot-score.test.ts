import { describe, it, expect } from 'vitest';
import { scoreSnapshot, formatScore } from './snapshot-score';
import type { DiffResult } from './diff';

function makeDiff(added: string[], removed: string[], changed: string[]): DiffResult {
  return {
    added: added.map(k => ({ key: k, value: 'v' })),
    removed: removed.map(k => ({ key: k, value: 'v' })),
    changed: changed.map(k => ({ key: k, before: 'a', after: 'b' })),
  };
}

describe('scoreSnapshot', () => {
  it('returns 100 for an empty diff', () => {
    const diff = makeDiff([], [], []);
    const score = scoreSnapshot(diff, 10);
    expect(score.total).toBe(100);
    expect(score.grade).toBe('A');
  });

  it('penalises removed keys more than added', () => {
    const diffAdded = makeDiff(['X'], [], []);
    const diffRemoved = makeDiff([], ['X'], []);
    const scoreA = scoreSnapshot(diffAdded, 10);
    const scoreR = scoreSnapshot(diffRemoved, 10);
    expect(scoreR.total).toBeLessThan(scoreA.total);
  });

  it('assigns grade F for heavily changed snapshot', () => {
    const keys = Array.from({ length: 20 }, (_, i) => `K${i}`);
    const diff = makeDiff([], keys, []);
    const score = scoreSnapshot(diff, 10);
    expect(score.grade).toBe('F');
    expect(score.total).toBeLessThan(40);
  });

  it('respects custom weights', () => {
    const diff = makeDiff(['A'], [], []);
    const low = scoreSnapshot(diff, 10, { added: 0.1, removed: 2, changed: 1.5 });
    const high = scoreSnapshot(diff, 10, { added: 5, removed: 2, changed: 1.5 });
    expect(low.total).toBeGreaterThan(high.total);
  });

  it('breakdown reflects diff counts', () => {
    const diff = makeDiff(['A', 'B'], ['C'], ['D']);
    const score = scoreSnapshot(diff, 20);
    expect(score.breakdown.added).toBe(2);
    expect(score.breakdown.removed).toBe(1);
    expect(score.breakdown.changed).toBe(1);
  });

  it('clamps total to 0 when diff is enormous', () => {
    const keys = Array.from({ length: 100 }, (_, i) => `K${i}`);
    const diff = makeDiff([], keys, []);
    const score = scoreSnapshot(diff, 5);
    expect(score.total).toBeGreaterThanOrEqual(0);
  });
});

describe('formatScore', () => {
  it('includes grade and counts in output', () => {
    const diff = makeDiff(['A'], ['B', 'C'], []);
    const score = scoreSnapshot(diff, 10);
    const output = formatScore(score);
    expect(output).toContain(score.grade);
    expect(output).toContain('1');
    expect(output).toContain('2');
  });
});
