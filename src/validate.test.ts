import { validateSnapshot, formatValidationReport, ValidationRule } from './validate';
import { Snapshot } from './snapshot';

function makeSnapshot(env: Record<string, string>): Snapshot {
  return { timestamp: new Date().toISOString(), env };
}

const rules: ValidationRule[] = [
  { key: 'NODE_ENV', required: true, allowedValues: ['development', 'production', 'test'] },
  { key: 'PORT', required: true, pattern: '^\\d+$' },
  { key: 'API_KEY', required: false, minLength: 8, maxLength: 32 },
  { key: 'LOG_LEVEL', required: false, allowedValues: ['debug', 'info', 'warn', 'error'] },
];

describe('validateSnapshot', () => {
  it('passes a fully valid snapshot', () => {
    const snap = makeSnapshot({ NODE_ENV: 'production', PORT: '3000', API_KEY: 'abcdefgh' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing required key', () => {
    const snap = makeSnapshot({ NODE_ENV: 'production' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'PORT' && e.rule === 'required')).toBe(true);
  });

  it('reports pattern mismatch', () => {
    const snap = makeSnapshot({ NODE_ENV: 'production', PORT: 'abc' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'PORT' && e.rule === 'pattern')).toBe(true);
  });

  it('reports disallowed value', () => {
    const snap = makeSnapshot({ NODE_ENV: 'staging', PORT: '8080' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'NODE_ENV' && e.rule === 'allowedValues')).toBe(true);
  });

  it('reports minLength violation as error', () => {
    const snap = makeSnapshot({ NODE_ENV: 'production', PORT: '3000', API_KEY: 'short' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'API_KEY' && e.rule === 'minLength')).toBe(true);
  });

  it('reports maxLength violation as warning', () => {
    const snap = makeSnapshot({ NODE_ENV: 'production', PORT: '3000', API_KEY: 'a'.repeat(40) });
    const result = validateSnapshot(snap, rules);
    expect(result.warnings.some(w => w.key === 'API_KEY' && w.rule === 'maxLength')).toBe(true);
  });

  it('skips optional keys that are absent', () => {
    const snap = makeSnapshot({ NODE_ENV: 'test', PORT: '4000' });
    const result = validateSnapshot(snap, rules);
    expect(result.valid).toBe(true);
  });
});

describe('formatValidationReport', () => {
  it('includes pass message when valid', () => {
    const snap = makeSnapshot({ NODE_ENV: 'test', PORT: '4000' });
    const report = validateSnapshot(snap, rules);
    const output = formatValidationReport(report);
    expect(output).toContain('✔');
  });

  it('includes fail message and errors when invalid', () => {
    const snap = makeSnapshot({ NODE_ENV: 'bad', PORT: 'nope' });
    const report = validateSnapshot(snap, rules);
    const output = formatValidationReport(report);
    expect(output).toContain('✘');
    expect(output).toContain('[ERROR]');
  });
});
