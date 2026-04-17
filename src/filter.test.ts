import { matchesPattern, matchesAny, filterEnv, redactEnv } from './filter';

const sampleEnv: Record<string, string> = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://localhost/db',
  API_KEY: 'secret-key',
  AWS_SECRET_ACCESS_KEY: 'aws-secret',
  PORT: '3000',
  LOG_LEVEL: 'info',
};

describe('matchesPattern', () => {
  it('matches exact keys', () => {
    expect(matchesPattern('NODE_ENV', 'NODE_ENV')).toBe(true);
    expect(matchesPattern('NODE_ENV', 'PORT')).toBe(false);
  });

  it('matches wildcard patterns', () => {
    expect(matchesPattern('AWS_SECRET_ACCESS_KEY', 'AWS_*')).toBe(true);
    expect(matchesPattern('API_KEY', '*_KEY')).toBe(true);
    expect(matchesPattern('PORT', '*_KEY')).toBe(false);
  });

  it('matches standalone wildcard', () => {
    expect(matchesPattern('ANYTHING', '*')).toBe(true);
    expect(matchesPattern('', '*')).toBe(true);
  });
});

describe('matchesAny', () => {
  it('returns true if key matches at least one pattern', () => {
    expect(matchesAny('API_KEY', ['PORT', '*_KEY'])).toBe(true);
    expect(matchesAny('NODE_ENV', ['PORT', '*_KEY'])).toBe(false);
  });

  it('returns false for empty pattern list', () => {
    expect(matchesAny('API_KEY', [])).toBe(false);
  });
});

describe('filterEnv', () => {
  it('returns all keys when no options provided', () => {
    const result = filterEnv(sampleEnv, {});
    expect(Object.keys(result)).toHaveLength(6);
  });

  it('filters by include patterns', () => {
    const result = filterEnv(sampleEnv, { include: ['AWS_*', 'API_KEY'] });
    expect(Object.keys(result)).toEqual(['API_KEY', 'AWS_SECRET_ACCESS_KEY']);
  });

  it('filters by exclude patterns', () => {
    const result = filterEnv(sampleEnv, { exclude: ['*_KEY', '*_URL'] });
    expect(result).not.toHaveProperty('API_KEY');
    expect(result).not.toHaveProperty('AWS_SECRET_ACCESS_KEY');
    expect(result).not.toHaveProperty('DATABASE_URL');
    expect(result).toHaveProperty('NODE_ENV');
  });

  it('exclude takes precedence over include', () => {
    const result = filterEnv(sampleEnv, { include: ['API_KEY'], exclude: ['API_KEY'] });
    expect(result).not.toHaveProperty('API_KEY');
  });

  it('returns empty object when all keys are excluded', () => {
    const result = filterEnv(sampleEnv, { exclude: ['*'] });
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('redactEnv', () => {
  it('redacts matching keys', () => {
    const result = redactEnv(sampleEnv, ['*_KEY', '*_SECRET*']);
    expect(result['API_KEY']).toBe('***');
    expect(result['AWS_SECRET_ACCESS_KEY']).toBe('***');
    expect(result['NODE_ENV']).toBe('production');
  });

  it('leaves non-matching keys unchanged', () => {
    const result = redactEnv(sampleEnv, ['NONEXISTENT_*']);
    expect(result).toEqual(sampleEnv);
  });

  it('does not mutate the original env object', () => {
    const env = { API_KEY: 'secret', NODE_ENV: 'production' };
    redactEnv(env, ['API_KEY']);
    expect(env['API_KEY']).toBe('secret');
  });
});
