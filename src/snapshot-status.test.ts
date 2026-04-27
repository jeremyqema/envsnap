import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSnapshotStatus, formatStatus, formatStatusBatch } from './snapshot-status';

vi.mock('./snapshot-ttl', () => ({
  loadTtlIndex: vi.fn().mockResolvedValue({}),
  isExpired: vi.fn().mockReturnValue(false),
}));
vi.mock('./snapshot-lock', () => ({
  loadLocks: vi.fn().mockResolvedValue({}),
  isLocked: vi.fn().mockReturnValue(false),
}));
vi.mock('./snapshot-archive', () => ({
  loadArchiveIndex: vi.fn().mockResolvedValue({}),
  isArchived: vi.fn().mockReturnValue(false),
}));
vi.mock('./pin', () => ({
  loadPins: vi.fn().mockResolvedValue({}),
  getPin: vi.fn().mockReturnValue(undefined),
}));

import { isLocked } from './snapshot-lock';
import { isArchived } from './snapshot-archive';
import { isExpired, loadTtlIndex } from './snapshot-ttl';
import { getPin } from './pin';

describe('getSnapshotStatus', () => {
  const dir = '/tmp/test';

  beforeEach(() => {
    vi.mocked(isLocked).mockReturnValue(false);
    vi.mocked(isArchived).mockReturnValue(false);
    vi.mocked(isExpired).mockReturnValue(false);
    vi.mocked(getPin).mockReturnValue(undefined);
    vi.mocked(loadTtlIndex).mockResolvedValue({});
  });

  it('returns all-false status for a plain active snapshot', async () => {
    const status = await getSnapshotStatus('prod-v1', dir);
    expect(status.label).toBe('prod-v1');
    expect(status.locked).toBe(false);
    expect(status.archived).toBe(false);
    expect(status.pinned).toBe(false);
    expect(status.expired).toBe(false);
  });

  it('reflects locked state', async () => {
    vi.mocked(isLocked).mockReturnValue(true);
    const status = await getSnapshotStatus('prod-v1', dir);
    expect(status.locked).toBe(true);
  });

  it('reflects pinned state with alias', async () => {
    vi.mocked(getPin).mockReturnValue({ label: 'prod-v1', alias: 'stable' } as any);
    const status = await getSnapshotStatus('prod-v1', dir);
    expect(status.pinned).toBe(true);
    expect(status.pinnedAs).toBe('stable');
  });

  it('reflects expired state', async () => {
    vi.mocked(loadTtlIndex).mockResolvedValue({ 'prod-v1': { expiresAt: '2020-01-01T00:00:00.000Z' } } as any);
    vi.mocked(isExpired).mockReturnValue(true);
    const status = await getSnapshotStatus('prod-v1', dir);
    expect(status.expired).toBe(true);
    expect(status.ttlExpiresAt).toBe('2020-01-01T00:00:00.000Z');
  });
});

describe('formatStatus', () => {
  it('shows [active] when no flags are set', () => {
    const result = formatStatus({ label: 'snap1', locked: false, archived: false, pinned: false, expired: false });
    expect(result).toBe('snap1  [active]');
  });

  it('lists multiple flags', () => {
    const result = formatStatus({ label: 'snap2', locked: true, archived: true, pinned: false, expired: false });
    expect(result).toContain('locked');
    expect(result).toContain('archived');
  });

  it('includes pin alias when present', () => {
    const result = formatStatus({ label: 'snap3', locked: false, archived: false, pinned: true, expired: false, pinnedAs: 'latest' });
    expect(result).toContain('pinned:latest');
  });
});

describe('formatStatusBatch', () => {
  it('returns one line per label', async () => {
    const output = await formatStatusBatch(['a', 'b', 'c'], '/tmp');
    const lines = output.split('\n');
    expect(lines).toHaveLength(3);
  });
});
