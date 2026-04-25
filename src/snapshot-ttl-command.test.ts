import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdTtlSet, cmdTtlRemove, cmdTtlShow, cmdTtlListExpired } from './snapshot-ttl-command';
import { loadTtlIndex, setTtl, saveTtlIndex } from './snapshot-ttl';

function tmpFile(): string {
  return path.join(os.tmpdir(), `ttl-cmd-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe('cmdTtlSet', () => {
  it('sets a TTL for a label and persists it', async () => {
    const file = tmpFile();
    await cmdTtlSet(['staging', '3600'], file);
    const index = await loadTtlIndex(file);
    const entry = index.entries['staging'];
    expect(entry).toBeDefined();
    expect(entry.expiresAt).toBeGreaterThan(Date.now());
    fs.unlinkSync(file);
  });

  it('exits on missing arguments', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(cmdTtlSet([], 'unused.json')).rejects.toThrow('exit');
    mockExit.mockRestore();
  });

  it('exits on invalid seconds', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(cmdTtlSet(['prod', 'abc'], 'unused.json')).rejects.toThrow('exit');
    mockExit.mockRestore();
  });
});

describe('cmdTtlRemove', () => {
  it('removes an existing TTL entry', async () => {
    const file = tmpFile();
    let index = await loadTtlIndex(file);
    index = setTtl(index, 'prod', 1000);
    await saveTtlIndex(file, index);
    await cmdTtlRemove(['prod'], file);
    const updated = await loadTtlIndex(file);
    expect(updated.entries['prod']).toBeUndefined();
    fs.unlinkSync(file);
  });
});

describe('cmdTtlShow', () => {
  it('prints no TTL message when label absent', async () => {
    const file = tmpFile();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdTtlShow(['ghost'], file);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No TTL set'));
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('prints expiry info for existing label', async () => {
    const file = tmpFile();
    let index = await loadTtlIndex(file);
    index = setTtl(index, 'dev', 7200);
    await saveTtlIndex(file, index);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdTtlShow(['dev'], file);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('active'));
    spy.mockRestore();
    fs.unlinkSync(file);
  });
});

describe('cmdTtlListExpired', () => {
  it('reports no expired snapshots on fresh index', async () => {
    const file = tmpFile();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdTtlListExpired(file);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No expired'));
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('lists expired labels', async () => {
    const file = tmpFile();
    let index = await loadTtlIndex(file);
    // Manually insert an already-expired entry
    index.entries['old-env'] = { expiresAt: Date.now() - 5000 };
    await saveTtlIndex(file, index);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdTtlListExpired(file);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('old-env'));
    spy.mockRestore();
    fs.unlinkSync(file);
  });
});
