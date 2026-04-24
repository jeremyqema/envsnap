import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdSnapshotCompare, cmdSnapshotCompareUsage } from './snapshotCompareCommand';
import { saveSnapshot } from './snapshot';

function tmpFile(ext = '.json'): string {
  return path.join(os.tmpdir(), `envsnap-test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
}

describe('cmdSnapshotCompareUsage', () => {
  it('prints usage without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdSnapshotCompareUsage();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('cmdSnapshotCompare', () => {
  let leftFile: string;
  let rightFile: string;

  beforeEach(async () => {
    leftFile = tmpFile();
    rightFile = tmpFile();
    await saveSnapshot({ timestamp: '2024-01-01T00:00:00Z', label: 'left', env: { A: '1', B: '2' } }, leftFile);
    await saveSnapshot({ timestamp: '2024-01-02T00:00:00Z', label: 'right', env: { A: '9', C: '3' } }, rightFile);
  });

  afterEach(() => {
    [leftFile, rightFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  });

  it('prints comparison output', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSnapshotCompare([leftFile, rightFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('left → right');
    expect(output).toContain('Added:');
    spy.mockRestore();
  });

  it('exits with code 1 when fewer than 2 args', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(cmdSnapshotCompare(['only-one'])).rejects.toThrow('exit');
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('respects --exclude flag', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSnapshotCompare([leftFile, rightFile, '--exclude', 'A']);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).not.toContain('~ A');
    spy.mockRestore();
  });

  it('exports as json when --export json is passed', async () => {
    const outFile = tmpFile('.json');
    try {
      await cmdSnapshotCompare([leftFile, rightFile, '--export', 'json', '--out', outFile]);
      const content = fs.readFileSync(outFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toBeDefined();
    } finally {
      try { fs.unlinkSync(outFile); } catch {}
    }
  });
});
