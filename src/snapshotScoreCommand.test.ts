import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cmdScore, cmdScoreUsage } from './snapshotScoreCommand';

vi.mock('./snapshot', () => ({
  loadSnapshot: vi.fn(async (label: string) => ({
    label,
    timestamp: new Date().toISOString(),
    env: label === 'a'
      ? { FOO: 'foo', BAR: 'bar', BAZ: 'baz' }
      : { FOO: 'foo2', BAZ: 'baz', NEW: 'new' },
  })),
}));

vi.mock('./diff', () => ({
  diffSnapshots: vi.fn((_a: any, _b: any) => ({
    added: [{ key: 'NEW', value: 'new' }],
    removed: [{ key: 'BAR', value: 'bar' }],
    changed: [{ key: 'FOO', before: 'foo', after: 'foo2' }],
  })),
}));

describe('cmdScore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('prints formatted score for two labels', async () => {
    await cmdScore(['a', 'b']);
    const output = (console.log as any).mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toMatch(/Score/);
    expect(output).toMatch(/[A-F]/);
  });

  it('prints JSON when --json flag is set', async () => {
    await cmdScore(['a', 'b', '--json']);
    const raw = (console.log as any).mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('grade');
    expect(parsed).toHaveProperty('breakdown');
  });

  it('exits with code 1 when fewer than 2 positional args', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    await cmdScore(['a']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('cmdScoreUsage', () => {
  it('prints usage text', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    cmdScoreUsage();
    expect(spy).toHaveBeenCalled();
    const text: string = spy.mock.calls[0][0];
    expect(text).toContain('envsnap score');
  });
});
