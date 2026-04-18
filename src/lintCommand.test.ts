import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdLint } from './lintCommand';
import { saveSnapshot } from './snapshot';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap-lint-test-${Date.now()}.json`);
}

describe('cmdLint', () => {
  it('prints clean message for valid snapshot', async () => {
    const file = tmpFile();
    saveSnapshot({ env: { NODE_ENV: 'production', PORT: '8080' }, timestamp: new Date().toISOString() }, file);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdLint([file]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No lint issues'));
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('reports issues for bad snapshot', async () => {
    const file = tmpFile();
    saveSnapshot({ env: { badKey: '', API_KEY: 'x' }, timestamp: new Date().toISOString() }, file);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdLint([file]);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('uppercase-key');
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('exits with code 1 in strict mode when issues exist', async () => {
    const file = tmpFile();
    saveSnapshot({ env: { badKey: '' }, timestamp: new Date().toISOString() }, file);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdLint([file, '--strict']);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    fs.unlinkSync(file);
  });

  it('shows usage and exits when no file given', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await cmdLint([]);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
