import { startWatch, pollOnce } from './watch';
import { saveSnapshot } from './snapshot';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

function tmpFile() {
  return path.join(os.tmpdir(), `envsnap-watch-test-${Math.random().toString(36).slice(2)}.json`);
}

afterEach(() => jest.restoreAllMocks());

describe('pollOnce', () => {
  it('returns null when no snapshot exists', () => {
    const result = pollOnce(tmpFile());
    expect(result).toBeNull();
  });

  it('detects added variables since last snapshot', () => {
    const snap = tmpFile();
    const base: Record<string, string> = { EXISTING: 'yes' };
    saveSnapshot(snap, base);

    jest.spyOn(process, 'env', 'get').mockReturnValue({ EXISTING: 'yes', NEW_VAR: 'hello' } as any);

    const diff = pollOnce(snap);
    expect(diff).not.toBeNull();
    expect(diff!.added.map(e => e.key)).toContain('NEW_VAR');
  });

  it('detects removed variables since last snapshot', () => {
    const snap = tmpFile();
    saveSnapshot(snap, { EXISTING: 'yes', GONE: 'bye' });

    jest.spyOn(process, 'env', 'get').mockReturnValue({ EXISTING: 'yes' } as any);

    const diff = pollOnce(snap);
    expect(diff!.removed.map(e => e.key)).toContain('GONE');
  });
});

describe('startWatch', () => {
  it('calls onChange when environment changes', done => {
    const snap = tmpFile();
    saveSnapshot(snap, { STABLE: '1' });

    let callCount = 0;
    jest.spyOn(process, 'env', 'get').mockReturnValue({ STABLE: '1', ADDED: 'x' } as any);

    const stop = startWatch({
      snapshotPath: snap,
      intervalMs: 50,
      onChange: diff => {
        callCount++;
        expect(diff.added.map(e => e.key)).toContain('ADDED');
        stop();
        fs.unlinkSync(snap);
        done();
      },
    });
  });

  it('returns a function that stops polling', () => {
    const snap = tmpFile();
    saveSnapshot(snap, {});
    const stop = startWatch({ snapshotPath: snap, intervalMs: 100, onChange: () => {} });
    expect(() => stop()).not.toThrow();
    fs.unlinkSync(snap);
  });
});
