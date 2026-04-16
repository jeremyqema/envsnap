import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { captureSnapshot, saveSnapshot, loadSnapshot, Snapshot } from './snapshot';

describe('captureSnapshot', () => {
  it('should capture current env variables', () => {
    process.env.TEST_VAR = 'hello';
    const snap = captureSnapshot('test');
    expect(snap.label).toBe('test');
    expect(snap.env['TEST_VAR']).toBe('hello');
    expect(snap.timestamp).toBeTruthy();
    delete process.env.TEST_VAR;
  });

  it('should not include undefined values', () => {
    const snap = captureSnapshot('clean');
    for (const val of Object.values(snap.env)) {
      expect(val).toBeDefined();
    }
  });
});

describe('saveSnapshot and loadSnapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsnap-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should save and reload a snapshot', () => {
    const snap = captureSnapshot('deploy');
    const filepath = saveSnapshot(snap, tmpDir);
    expect(fs.existsSync(filepath)).toBe(true);
    const loaded = loadSnapshot(filepath);
    expect(loaded.label).toBe('deploy');
    expect(loaded.env).toEqual(snap.env);
  });

  it('should throw if snapshot file does not exist', () => {
    expect(() => loadSnapshot('/nonexistent/path.json')).toThrow('Snapshot file not found');
  });

  it('should create output directory if missing', () => {
    const nestedDir = path.join(tmpDir, 'nested', 'snapshots');
    const snap = captureSnapshot('ci');
    saveSnapshot(snap, nestedDir);
    expect(fs.existsSync(nestedDir)).toBe(true);
  });
});
