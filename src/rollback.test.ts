import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { rollbackToLabel, listRollbackTargets } from './rollback';
import { saveHistory } from './history';
import { saveSnapshot } from './snapshot';

async function tmpFile() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rollback-'));
  return (name: string) => path.join(dir, name);
}

describe('rollback', () => {
  let tmp: (n: string) => string;

  beforeEach(async () => {
    tmp = await tmpFile();
  });

  it('rolls back to a labeled snapshot', async () => {
    const snapFile = tmp('snap-v1.json');
    const targetFile = tmp('current.json');
    const histFile = tmp('history.json');
    const snap = { timestamp: '2024-01-01T00:00:00Z', env: { FOO: 'bar' } };
    await saveSnapshot(snap, snapFile);
    await saveHistory(histFile, {
      entries: [{ label: 'v1', timestamp: '2024-01-01T00:00:00Z', snapshotFile: snapFile }],
    });
    const result = await rollbackToLabel(histFile, 'v1', targetFile);
    expect(result.success).toBe(true);
    expect(result.label).toBe('v1');
    expect(result.snapshot.env).toEqual({ FOO: 'bar' });
    const written = JSON.parse(await fs.readFile(targetFile, 'utf-8'));
    expect(written.env).toEqual({ FOO: 'bar' });
  });

  it('throws if label not found', async () => {
    const histFile = tmp('history.json');
    await saveHistory(histFile, { entries: [] });
    await expect(rollbackToLabel(histFile, 'missing', tmp('out.json'))).rejects.toThrow(
      'No history entry found for label: missing'
    );
  });

  it('lists rollback targets', async () => {
    const histFile = tmp('history.json');
    await saveHistory(histFile, {
      entries: [
        { label: 'v1', timestamp: '2024-01-01T00:00:00Z', snapshotFile: 'a.json' },
        { label: 'v2', timestamp: '2024-02-01T00:00:00Z', snapshotFile: 'b.json' },
      ],
    });
    const targets = await listRollbackTargets(histFile);
    expect(targets).toHaveLength(2);
    expect(targets[0].label).toBe('v1');
    expect(targets[1].label).toBe('v2');
  });
});
