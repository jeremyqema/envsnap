import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdRecord, cmdList, cmdDiffLabels } from './historyCommand';
import { saveSnapshot } from './snapshot';

function tmpFile(ext = 'json'): string {
  return path.join(os.tmpdir(), `envsnap_hcmd_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
}

describe('historyCommand', () => {
  let histFile: string;
  let snapFileA: string;
  let snapFileB: string;

  beforeEach(() => {
    histFile = tmpFile();
    snapFileA = tmpFile();
    snapFileB = tmpFile();
    saveSnapshot({ NODE_ENV: 'development', PORT: '3000' }, snapFileA);
    saveSnapshot({ NODE_ENV: 'production', PORT: '8080', NEW_VAR: 'hello' }, snapFileB);
  });

  afterEach(() => {
    [histFile, snapFileA, snapFileB].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  test('cmdRecord logs recorded message', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdRecord('dev', snapFileA, histFile);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dev'));
    spy.mockRestore();
  });

  test('cmdList shows no snapshots when empty', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdList(histFile);
    expect(spy).toHaveBeenCalledWith('No snapshots recorded.');
    spy.mockRestore();
  });

  test('cmdList shows recorded entries', () => {
    cmdRecord('dev', snapFileA, histFile);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdList(histFile);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dev'));
    spy.mockRestore();
  });

  test('cmdDiffLabels prints diff between two labels', () => {
    cmdRecord('dev', snapFileA, histFile);
    cmdRecord('prod', snapFileB, histFile);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdDiffLabels('dev', 'prod', histFile);
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('dev');
    expect(output).toContain('prod');
    spy.mockRestore();
  });

  test('cmdDiffLabels exits on missing label', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => cmdDiffLabels('ghost', 'prod', histFile)).toThrow('exit');
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
