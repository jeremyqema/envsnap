import { generateReport } from './report';
import { DiffResult } from './diff';

const baseDiff: DiffResult = {
  added: { NEW_VAR: 'hello' },
  removed: { OLD_VAR: 'bye' },
  changed: { CHANGED_VAR: { from: 'v1', to: 'v2' } },
  unchanged: { STABLE: 'yes' },
};

describe('generateReport', () => {
  it('includes labels in text output', () => {
    const report = generateReport(baseDiff, 'snap-a', 'snap-b');
    expect(report).toContain('snap-a');
    expect(report).toContain('snap-b');
  });

  it('shows added, removed, changed sections', () => {
    const report = generateReport(baseDiff, 'a', 'b');
    expect(report).toContain('Added');
    expect(report).toContain('NEW_VAR=hello');
    expect(report).toContain('Removed');
    expect(report).toContain('OLD_VAR=bye');
    expect(report).toContain('Changed');
    expect(report).toContain('CHANGED_VAR');
  });

  it('hides unchanged by default', () => {
    const report = generateReport(baseDiff, 'a', 'b');
    expect(report).not.toContain('STABLE');
  });

  it('shows unchanged when option is set', () => {
    const report = generateReport(baseDiff, 'a', 'b', { showUnchanged: true });
    expect(report).toContain('STABLE=yes');
  });

  it('returns valid JSON when format is json', () => {
    const report = generateReport(baseDiff, 'a', 'b', { format: 'json' });
    const parsed = JSON.parse(report);
    expect(parsed.from).toBe('a');
    expect(parsed.to).toBe('b');
    expect(parsed.added).toEqual({ NEW_VAR: 'hello' });
    expect(parsed.removed).toEqual({ OLD_VAR: 'bye' });
  });

  it('shows no differences message when diff is empty', () => {
    const emptyDiff: DiffResult = { added: {}, removed: {}, changed: {}, unchanged: {} };
    const report = generateReport(emptyDiff, 'a', 'b');
    expect(report).toContain('No differences found.');
  });
});
