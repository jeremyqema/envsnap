import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildChain, summarizeChain } from './snapshot-chain';
import { saveSnapshot } from './snapshot';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envsnap-chain-'));
}

describe('buildChain', () => {
  it('throws when fewer than two labels are provided', async () => {
    await expect(buildChain(['only'], '/tmp')).rejects.toThrow(
      'At least two snapshot labels are required'
    );
  });

  it('builds a chain with one link for two snapshots', async () => {
    const dir = tmpDir();
    await saveSnapshot(path.join(dir, 'snap-a.json'), { env: { FOO: 'bar' }, timestamp: 1000 });
    await saveSnapshot(path.join(dir, 'snap-b.json'), { env: { FOO: 'baz', NEW: '1' }, timestamp: 2000 });

    const chain = await buildChain(['snap-a', 'snap-b'], dir);

    expect(chain.labels).toEqual(['snap-a', 'snap-b']);
    expect(chain.links).toHaveLength(1);
    expect(chain.links[0].label).toBe('snap-a → snap-b');
    expect(chain.links[0].diff.changed).toHaveLength(1);
    expect(chain.links[0].diff.added).toHaveLength(1);
    expect(chain.links[0].diff.removed).toHaveLength(0);
  });

  it('builds a multi-link chain', async () => {
    const dir = tmpDir();
    await saveSnapshot(path.join(dir, 'v1.json'), { env: { A: '1' }, timestamp: 1000 });
    await saveSnapshot(path.join(dir, 'v2.json'), { env: { A: '2' }, timestamp: 2000 });
    await saveSnapshot(path.join(dir, 'v3.json'), { env: { A: '2', B: '3' }, timestamp: 3000 });

    const chain = await buildChain(['v1', 'v2', 'v3'], dir);

    expect(chain.links).toHaveLength(2);
    expect(chain.links[0].diff.changed).toHaveLength(1);
    expect(chain.links[1].diff.added).toHaveLength(1);
  });
});

describe('summarizeChain', () => {
  it('returns zero totals for an empty chain', () => {
    const result = summarizeChain({ labels: [], links: [] });
    expect(result).toEqual({ totalAdded: 0, totalRemoved: 0, totalChanged: 0 });
  });

  it('accumulates totals across links', async () => {
    const dir = tmpDir();
    await saveSnapshot(path.join(dir, 'x1.json'), { env: { A: '1', B: '2' }, timestamp: 1 });
    await saveSnapshot(path.join(dir, 'x2.json'), { env: { A: '9', C: '3' }, timestamp: 2 });
    await saveSnapshot(path.join(dir, 'x3.json'), { env: { C: '3', D: '4' }, timestamp: 3 });

    const chain = await buildChain(['x1', 'x2', 'x3'], dir);
    const summary = summarizeChain(chain);

    expect(summary.totalChanged).toBeGreaterThanOrEqual(1);
    expect(summary.totalAdded).toBeGreaterThanOrEqual(1);
    expect(summary.totalRemoved).toBeGreaterThanOrEqual(1);
  });
});
