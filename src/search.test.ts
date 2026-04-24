import { describe, it, expect } from 'vitest';
import { searchSnapshot, formatSearchResults } from './search';
import { Snapshot } from './snapshot';

function makeSnapshot(env: Record<string, string>): Snapshot {
  return { timestamp: new Date().toISOString(), env };
}

describe('searchSnapshot', () => {
  const snap = makeSnapshot({
    DATABASE_URL: 'postgres://localhost/db',
    API_KEY: 'secret123',
    NODE_ENV: 'production',
    PORT: '3000',
  });

  it('returns all entries when no filters given', () => {
    const results = searchSnapshot(snap, {});
    expect(results).toHaveLength(4);
  });

  it('filters by exact key', () => {
    const results = searchSnapshot(snap, { keys: ['PORT'] });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('PORT');
    expect(results[0].value).toBe('3000');
  });

  it('filters by exact value', () => {
    const results = searchSnapshot(snap, { values: ['production'] });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('NODE_ENV');
  });

  it('filters by key pattern', () => {
    const results = searchSnapshot(snap, { keyPattern: '^API' });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_KEY');
  });

  it('filters by value pattern', () => {
    const results = searchSnapshot(snap, { valuePattern: 'localhost' });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DATABASE_URL');
  });

  it('is case-insensitive by default', () => {
    const results = searchSnapshot(snap, { keys: ['port'] });
    expect(results).toHaveLength(1);
  });

  it('respects caseSensitive flag', () => {
    const results = searchSnapshot(snap, { keys: ['port'], caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('combines key and value filters (AND logic)', () => {
    const results = searchSnapshot(snap, { keyPattern: 'KEY', valuePattern: 'secret' });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_KEY');
  });
});

describe('formatSearchResults', () => {
  it('shows no-match message when empty', () => {
    expect(formatSearchResults([])).toBe('No matches found.');
  });

  it('formats results as KEY=VALUE lines', () => {
    const out = formatSearchResults([{ key: 'PORT', value: '3000' }]);
    expect(out).toBe('PORT=3000');
  });
});
