import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { saveSnapshot } from './snapshot';
import { compareSnapshots } from './compare';
import { saveFilterConfig } from './filterConfig';

async function tmpFile(suffix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'envsnap-'));
  return path.join(dir, suffix);
}

const snapA = { NODE_ENV: 'development', API_KEY: 'abc123', PORT: '3000' };
const snapB = { NODE_ENV: 'production', API_KEY: 'abc123', PORT: '4000', NEW_VAR: 'hello' };

describe('compareSnapshots', () => {
  it('returns text diff by default', async () => {
    const pA = await tmpFile('a.json');
    const pB = await tmpFile('b.json');
    await saveSnapshot(snapA, pA);
    await saveSnapshot(snapB, pB);

    const result = await compareSnapshots(pA, pB);
    expect(typeof result).toBe('string');
    expect(result).toContain('NODE_ENV');
  });

  it('returns json diff when outputFormat is json', async () => {
    const pA = await tmpFile('a.json');
    const pB = await tmpFile('b.json');
    await saveSnapshot(snapA, pA);
    await saveSnapshot(snapB, pB);

    const result = await compareSnapshots(pA, pB, { outputFormat: 'json' });
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('applies filter config when provided', async () => {
    const pA = await tmpFile('a.json');
    const pB = await tmpFile('b.json');
    const pCfg = await tmpFile('cfg.json');
    await saveSnapshot(snapA, pA);
    await saveSnapshot(snapB, pB);
    await saveFilterConfig({ include: ['NODE_ENV', 'PORT'], exclude: [], redact: [] }, pCfg);

    const result = await compareSnapshots(pA, pB, {
      filterConfigPath: pCfg,
      outputFormat: 'json',
    });
    const parsed = JSON.parse(result);
    const keys = parsed.map((e: { key: string }) => e.key);
    expect(keys).not.toContain('API_KEY');
  });
});
