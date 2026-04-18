import { buildPayload, sendNotification, NotifyConfig } from './notify';
import { DiffResult } from './diff';

function makeDiff(overrides: Partial<DiffResult> = {}): DiffResult {
  return {
    added: [],
    removed: [],
    changed: [],
    unchanged: [],
    ...overrides,
  };
}

describe('buildPayload', () => {
  it('reports no changes when diff is empty', () => {
    const p = buildPayload('test', makeDiff());
    expect(p.summary).toBe('no changes');
    expect(p.changes).toBe(0);
    expect(p.label).toBe('test');
  });

  it('counts added, removed, changed', () => {
    const p = buildPayload('deploy', makeDiff({
      added: ['A'],
      removed: ['B', 'C'],
      changed: [{ key: 'X', oldValue: '1', newValue: '2' }],
    }));
    expect(p.changes).toBe(4);
    expect(p.summary).toContain('+1 added');
    expect(p.summary).toContain('-2 removed');
    expect(p.summary).toContain('~1 changed');
  });

  it('includes timestamp', () => {
    const p = buildPayload('t', makeDiff());
    expect(p.timestamp).toMatch(/^\d{4}-/);
  });
});

describe('sendNotification', () => {
  it('prints to console without throwing', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const config: NotifyConfig = { channel: 'console' };
    await sendNotification(config, buildPayload('lbl', makeDiff()));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('lbl'));
    spy.mockRestore();
  });

  it('throws if webhook channel has no url', async () => {
    const config: NotifyConfig = { channel: 'webhook' };
    await expect(sendNotification(config, buildPayload('x', makeDiff())))
      .rejects.toThrow('webhookUrl required');
  });

  it('throws on unknown channel', async () => {
    const config = { channel: 'slack' as any };
    await expect(sendNotification(config, buildPayload('x', makeDiff())))
      .rejects.toThrow('Unknown channel');
  });
});
