import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cmdSearch, cmdSearchUsage } from './searchCommand';
import * as snapshotModule from './snapshot';
import { Snapshot } from './snapshot';

const mockSnapshot: Snapshot = {
  timestamp: '2024-01-01T00:00:00Z',
  env: {
    DATABASE_URL: 'postgres://localhost/db',
    API_KEY: 'secret123',
    NODE_ENV: 'production',
  },
};

beforeEach(() => {
  vi.spyOn(snapshotModule, 'loadSnapshot').mockResolvedValue(mockSnapshot);
});

describe('cmdSearchUsage', () => {
  it('prints usage info', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    cmdSearchUsage();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage: envsnap search'));
    spy.mockRestore();
  });
});

describe('cmdSearch', () => {
  it('shows usage when no args provided', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSearch([]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    spy.mockRestore();
  });

  it('shows usage when --help passed', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSearch(['snap.json', '--help']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    spy.mockRestore();
  });

  it('searches by key pattern and prints results', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSearch(['snap.json', '--key-pattern', '^API']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY=secret123'));
    spy.mockRestore();
  });

  it('prints no-match message when nothing found', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSearch(['snap.json', '--key', 'MISSING_KEY']);
    expect(spy).toHaveBeenCalledWith('No matches found.');
    spy.mockRestore();
  });

  it('passes case-sensitive flag correctly', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cmdSearch(['snap.json', '--key', 'api_key', '--case-sensitive']);
    expect(spy).toHaveBeenCalledWith('No matches found.');
    spy.mockRestore();
  });
});
