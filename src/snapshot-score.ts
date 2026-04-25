import { Snapshot } from './snapshot';
import { DiffResult } from './diff';

export interface ScoreWeights {
  added: number;
  removed: number;
  changed: number;
}

export interface SnapshotScore {
  total: number;
  breakdown: {
    added: number;
    removed: number;
    changed: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  added: 1,
  removed: 2,
  changed: 1.5,
};

export function scoreSnapshot(
  diff: DiffResult,
  baseSize: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): SnapshotScore {
  const addedCount = diff.added.length;
  const removedCount = diff.removed.length;
  const changedCount = diff.changed.length;

  const rawScore =
    addedCount * weights.added +
    removedCount * weights.removed +
    changedCount * weights.changed;

  const denominator = Math.max(baseSize, 1);
  const normalised = Math.min(rawScore / denominator, 1);
  const total = Math.round((1 - normalised) * 100);

  const grade =
    total >= 90 ? 'A' :
    total >= 75 ? 'B' :
    total >= 60 ? 'C' :
    total >= 40 ? 'D' : 'F';

  const summary =
    `${addedCount} added, ${removedCount} removed, ${changedCount} changed ` +
    `(score: ${total}/100, grade: ${grade})`;

  return {
    total,
    breakdown: { added: addedCount, removed: removedCount, changed: changedCount },
    grade,
    summary,
  };
}

export function formatScore(score: SnapshotScore): string {
  const lines: string[] = [
    `Score : ${score.total}/100  [${score.grade}]`,
    `Added  : ${score.breakdown.added}`,
    `Removed: ${score.breakdown.removed}`,
    `Changed: ${score.breakdown.changed}`,
  ];
  return lines.join('\n');
}
