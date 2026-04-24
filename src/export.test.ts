import { exportSnapshot, exportDiff, ExportFormat } from './export';
import { Snapshot } from './snapshot';
import { DiffResult } from './diff';

const snapshot: Snapshot = {
  timestamp: '2024-01-01T00:00:00.000Z',
  env: { FOO: 'bar', BAZ: 'qux' },
};

const diff: DiffResult = {
  added: ['NEW_KEY'],
  removed: ['OLD_KEY'],
  changed: ['FOO'],
  unchanged: ['BAZ'],
  prev: { OLD_KEY: 'old', FOO: 'bar', BAZ: 'qux' },
  next: { NEW_KEY: 'new', FOO: 'baz', BAZ: 'qux' },
};

describe('exportSnapshot', () => {
  it('exports json format', () => {
    const out = exportSnapshot(snapshot, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.env.FOO).toBe('bar');
  });

  it('exports json format with timestamp preserved', () => {
    const out = exportSnapshot(snapshot, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('exports env format', () => {
    const out = exportSnapshot(snapshot, 'env');
    expect(out).toContain('FOO=bar');
    expect(out).toContain('BAZ=qux');
  });

  it('exports csv format', () => {
    const out = exportSnapshot(snapshot, 'csv');
    expect(out).toContain('key,value');
    expect(out).toContain('FOO,bar');
  });

  it('throws on unsupported format', () => {
    expect(() => exportSnapshot(snapshot, 'xml' as ExportFormat)).toThrow();
  });
});

describe('exportDiff', () => {
  it('exports diff as json', () => {
    const out = exportDiff(diff, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.added).toContain('NEW_KEY');
  });

  it('exports diff as env', () => {
    const out = exportDiff(diff, 'env');
    expect(out).toContain('+NEW_KEY=new');
    expect(out).toContain('-OLD_KEY=old');
    expect(out).toContain('~FOO=bar -> baz');
  });

  it('exports diff as env with unchanged keys omitted', () => {
    const out = exportDiff(diff, 'env');
    expect(out).not.toContain('BAZ');
  });

  it('exports diff as csv', () => {
    const out = exportDiff(diff, 'csv');
    expect(out).toContain('change,key,prev,next');
    expect(out).toContain('added,NEW_KEY');
    expect(out).toContain('removed,OLD_KEY');
  });
});
