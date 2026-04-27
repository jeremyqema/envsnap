import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdSummary, cmdSummaryUsage } from './snapshotSummaryCommand';
import { saveSnapshot } from './snapshot';

function tmpFile(ext = '.json'): string {
  return path.join(os.tmpdir(), `envsnap-summary-test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
}

const baseSnap = { env: { A: '1', B: '2', C: '' }, capturedAt: '2024-01-01T00:00:00.000Z' };
const targetSnap = { env: { A: '1', B: 'changed', D: 'new' }, capturedAt: '2024-06-01T00:00:00.000Z' };

describe('cmdSummaryUsage', () => {
  it('prints usage without error', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdSummaryUsage();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('cmdSummary', () => {
  let baseFile: string;
  let targetFile: string;

  beforeEach(() => {
    baseFile = tmpFile();
    targetFile = tmpFile();
    saveSnapshot(baseFile, baseSnap);
    saveSnapshot(targetFile, targetSnap);
  });

  afterEach(() => {
    [baseFile, targetFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  });

  it('prints usage for --help', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSummary(['--help']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('summarizes a single snapshot', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSummary([baseFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Keys');
    expect(output).toContain('3');
    spy.mockRestore();
  });

  it('outputs JSON for single snapshot with --json', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSummary([baseFile, '--json']);
    const raw = spy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.keyCount).toBe(3);
    spy.mockRestore();
  });

  it('compares two snapshots', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSummary([baseFile, '--compare', targetFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Change ratio');
    spy.mockRestore();
  });

  it('compares two snapshots as JSON', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSummary([baseFile, '--compare', targetFile, '--json']);
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed).toHaveProperty('addedCount');
    expect(parsed).toHaveProperty('changeRatio');
    spy.mockRestore();
  });
});
