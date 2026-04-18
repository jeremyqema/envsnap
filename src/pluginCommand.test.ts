import { cmdPluginList, cmdPluginInfo, buildRegistryFromDir } from './pluginCommand';
import * as plugin from './plugin';

const mockPlugins: plugin.EnvsnapPlugin[] = [
  { name: 'alpha', version: '1.2.0', hooks: { beforeSnapshot: (e) => e } },
  { name: 'beta', version: '0.5.1', hooks: {} },
];

beforeEach(() => {
  jest.spyOn(plugin, 'loadPlugins').mockReturnValue(mockPlugins);
});

afterEach(() => jest.restoreAllMocks());

test('cmdPluginList prints plugin names', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  cmdPluginList('/fake/dir');
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('alpha@1.2.0'));
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('beta@0.5.1'));
  spy.mockRestore();
});

test('cmdPluginList prints no plugins message when empty', () => {
  jest.spyOn(plugin, 'loadPlugins').mockReturnValue([]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  cmdPluginList('/fake/dir');
  expect(spy).toHaveBeenCalledWith('No plugins found.');
  spy.mockRestore();
});

test('cmdPluginInfo prints plugin details', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  cmdPluginInfo('alpha', '/fake/dir');
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('alpha'));
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('1.2.0'));
  spy.mockRestore();
});

test('cmdPluginInfo exits on missing plugin', () => {
  const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => cmdPluginInfo('missing', '/fake/dir')).toThrow('exit');
  spy.mockRestore();
});

test('buildRegistryFromDir registers all plugins', () => {
  const registry = buildRegistryFromDir('/fake/dir');
  expect(registry.plugins).toHaveLength(2);
});
