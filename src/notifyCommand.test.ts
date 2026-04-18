import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { cmdNotifyDiff } from './notifyCommand';
import { saveHistory } from './history';
import { History } from './history';

async function tmpFile(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'envsnap-'));
  return path.join(dir, 'history.json');
}

const snapA = { NODE_ENV: 'staging', PORT: '3000' };
const snapB = { NODE_ENV: 'production', PORT: '3000', NEW_VAR: 'hello' };

async function makeHistory(file: string): Promise<void> {
  const history: History = {
    entries: [
      { label: 'v1', snapshot: snapA, timestamp: '2024-01-01T00:00:00Z' },
      { label: 'v2', snapshot: snapB, timestamp: '2024-01-02T00:00:00Z' },
    ],
  };
  await saveHistory(file, history);
}

describe('cmdNotifyDiff', () => {
  it('sends console notification for diff between labels', async () => {
    const file = await tmpFile();
    await makeHistory(file);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdNotifyDiff(file, 'v1', 'v2', []);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('v1..v2'));
    spy.mockRestore();
  });

  it('throws if label not found', async () => {
    const file = await tmpFile();
    await makeHistory(file);
    await expect(cmdNotifyDiff(file, 'v1', 'missing', []))
      .rejects.toThrow('Label not found: missing');
  });

  it('respects --channel=console flag', async () => {
    const file = await tmpFile();
    await makeHistory(file);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdNotifyDiff(file, 'v1', 'v2', ['--channel=console']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
