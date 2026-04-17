import { mergeSnapshots, mergeAll } from './merge';
import { Snapshot } from './snapshot';

const snap = (env: Record<string, string>): Snapshot => ({
  timestamp: '2024-01-01T00:00:00.000Z',
  env,
});

describe('mergeSnapshots', () => {
  it('override keys take precedence by default', () => {
    const base = snap({ A: '1', B: '2' });
    const override = snap({ B: '99', C: '3' });
    const result = mergeSnapshots(base, override);
    expect(result.env).toEqual({ A: '1', B: '99', C: '3' });
  });

  it('prefer base keeps base values for conflicts', () => {
    const base = snap({ A: '1', B: '2' });
    const override = snap({ B: '99', C: '3' });
    const result = mergeSnapshots(base, override, { prefer: 'base' });
    expect(result.env).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('result has a fresh timestamp', () => {
    const base = snap({ A: '1' });
    const override = snap({ B: '2' });
    const result = mergeSnapshots(base, override);
    expect(result.timestamp).not.toBe('2024-01-01T00:00:00.000Z');
  });

  it('includes all keys from both snapshots', () => {
    const base = snap({ X: 'x' });
    const override = snap({ Y: 'y' });
    const result = mergeSnapshots(base, override);
    expect(Object.keys(result.env).sort()).toEqual(['X', 'Y']);
  });
});

describe('mergeAll', () => {
  it('returns empty snapshot for empty array', () => {
    const result = mergeAll([]);
    expect(result.env).toEqual({});
  });

  it('merges multiple snapshots in order', () => {
    const s1 = snap({ A: '1', B: '1' });
    const s2 = snap({ B: '2', C: '2' });
    const s3 = snap({ C: '3', D: '3' });
    const result = mergeAll([s1, s2, s3]);
    expect(result.env).toEqual({ A: '1', B: '2', C: '3', D: '3' });
  });

  it('single snapshot is returned as-is (env-wise)', () => {
    const s1 = snap({ A: 'hello' });
    const result = mergeAll([s1]);
    expect(result.env).toEqual({ A: 'hello' });
  });
});
