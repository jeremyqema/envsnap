import { lintSnapshot, formatLintResults, LintRule } from './lint';

describe('lintSnapshot', () => {
  it('returns empty for clean env', () => {
    const env = { NODE_ENV: 'production', PORT: '3000' };
    expect(lintSnapshot(env)).toHaveLength(0);
  });

  it('flags empty value', () => {
    const results = lintSnapshot({ MY_VAR: '' });
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('flags non-uppercase key', () => {
    const results = lintSnapshot({ myVar: 'hello' });
    expect(results.some((r) => r.rule === 'uppercase-key')).toBe(true);
  });

  it('flags key with whitespace', () => {
    const results = lintSnapshot({ 'BAD KEY': 'val' });
    expect(results.some((r) => r.rule === 'no-whitespace-key')).toBe(true);
  });

  it('flags short secret value', () => {
    const results = lintSnapshot({ API_KEY: 'abc' });
    expect(results.some((r) => r.rule === 'no-secret-plaintext')).toBe(true);
  });

  it('does not flag long secret value', () => {
    const results = lintSnapshot({ API_KEY: 'supersecretvalue123' });
    expect(results.some((r) => r.rule === 'no-secret-plaintext')).toBe(false);
  });

  it('supports custom rules', () => {
    const rule: LintRule = {
      name: 'no-localhost',
      check: (_, v) => v.includes('localhost') ? 'avoid localhost' : null,
    };
    const results = lintSnapshot({ DB_URL: 'localhost:5432' }, [rule]);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-localhost');
  });

  it('includes the offending key in each result', () => {
    const results = lintSnapshot({ myVar: '', 'BAD KEY': 'val' });
    const keys = results.map((r) => r.key);
    expect(keys).toContain('myVar');
    expect(keys).toContain('BAD KEY');
  });

  it('returns multiple violations for a single key', () => {
    // 'bad key' is non-uppercase AND contains whitespace
    const results = lintSnapshot({ 'bad key': '' });
    const rules = results.filter((r) => r.key === 'bad key').map((r) => r.rule);
    expect(rules).toContain('uppercase-key');
    expect(rules).toContain('no-whitespace-key');
    expect(rules).toContain('no-empty-value');
  });
});

describe('formatLintResults', () => {
  it('returns clean message when no issues', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats issues', () => {
    const out = formatLintResults([{ key: 'X', rule: 'my-rule', message: 'bad' }]);
    expect(out).toContain('[my-rule]');
    expect(out).toContain('bad');
  });
});
