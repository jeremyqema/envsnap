import { createRegistry, registerPlugin, runHook, EnvsnapPlugin } from './plugin';

function makePlugin(name: string, overrides: Partial<EnvsnapPlugin> = {}): EnvsnapPlugin {
  return { name, version: '1.0.0', hooks: {}, ...overrides };
}

test('createRegistry returns empty registry', () => {
  const r = createRegistry();
  expect(r.plugins).toEqual([]);
});

test('registerPlugin adds plugin', () => {
  const r = createRegistry();
  registerPlugin(r, makePlugin('test-plugin'));
  expect(r.plugins).toHaveLength(1);
  expect(r.plugins[0].name).toBe('test-plugin');
});

test('registerPlugin throws on duplicate name', () => {
  const r = createRegistry();
  registerPlugin(r, makePlugin('dup'));
  expect(() => registerPlugin(r, makePlugin('dup'))).toThrow("Plugin 'dup' is already registered.");
});

test('runHook calls hook on all plugins', () => {
  const r = createRegistry();
  const calls: string[] = [];
  registerPlugin(r, makePlugin('a', { hooks: { beforeSnapshot: (env) => { calls.push('a'); return env; } } }));
  registerPlugin(r, makePlugin('b', { hooks: { beforeSnapshot: (env) => { calls.push('b'); return env; } } }));
  runHook(r, 'beforeSnapshot', { KEY: 'val' });
  expect(calls).toEqual(['a', 'b']);
});

test('runHook skips plugins without the hook', () => {
  const r = createRegistry();
  registerPlugin(r, makePlugin('no-hook'));
  expect(() => runHook(r, 'beforeSnapshot', {})).not.toThrow();
});

test('runHook with afterDiff', () => {
  const r = createRegistry();
  const results: unknown[] = [];
  registerPlugin(r, makePlugin('p', { hooks: { afterDiff: (res) => results.push(res) } }));
  runHook(r, 'afterDiff', { added: [], removed: [] });
  expect(results).toHaveLength(1);
});
