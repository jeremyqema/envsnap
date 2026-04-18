import { createRegistry, registerPlugin, runHook } from './plugin';
import { captureSnapshot } from './snapshot';

test('beforeSnapshot hook can transform env vars', () => {
  const registry = createRegistry();
  let captured: Record<string, string> = {};

  registerPlugin(registry, {
    name: 'uppercase-plugin',
    version: '1.0.0',
    hooks: {
      beforeSnapshot: (env) => {
        captured = env;
        return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v.toUpperCase()]));
      },
    },
  });

  const env = { FOO: 'bar', BAZ: 'qux' };
  runHook(registry, 'beforeSnapshot', env);
  expect(captured).toEqual(env);
});

test('multiple hooks run in registration order', () => {
  const registry = createRegistry();
  const order: number[] = [];

  for (let i = 1; i <= 3; i++) {
    const idx = i;
    registerPlugin(registry, {
      name: `plugin-${i}`,
      version: '1.0.0',
      hooks: { afterDiff: () => order.push(idx) },
    });
  }

  runHook(registry, 'afterDiff', {});
  expect(order).toEqual([1, 2, 3]);
});

test('captureSnapshot returns env object', () => {
  process.env.__ENVSNAP_TEST__ = 'hello';
  const snap = captureSnapshot();
  expect(snap.__ENVSNAP_TEST__).toBe('hello');
  delete process.env.__ENVSNAP_TEST__;
});
