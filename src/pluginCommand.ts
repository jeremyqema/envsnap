import * as path from 'path';
import { createRegistry, loadPlugins, registerPlugin, EnvsnapPlugin } from './plugin';

const DEFAULT_PLUGIN_DIR = path.join(process.cwd(), '.envsnap', 'plugins');

export function cmdPluginList(pluginDir: string = DEFAULT_PLUGIN_DIR): void {
  const plugins = loadPlugins(pluginDir);
  if (plugins.length === 0) {
    console.log('No plugins found.');
    return;
  }
  console.log('Installed plugins:');
  for (const p of plugins) {
    console.log(`  ${p.name}@${p.version}`);
  }
}

export function cmdPluginInfo(name: string, pluginDir: string = DEFAULT_PLUGIN_DIR): void {
  const plugins = loadPlugins(pluginDir);
  const plugin = plugins.find(p => p.name === name);
  if (!plugin) {
    console.error(`Plugin '${name}' not found.`);
    process.exit(1);
  }
  console.log(`Name:    ${plugin.name}`);
  console.log(`Version: ${plugin.version}`);
  const hooks = Object.keys(plugin.hooks);
  console.log(`Hooks:   ${hooks.length > 0 ? hooks.join(', ') : 'none'}`);
}

export function buildRegistryFromDir(pluginDir: string = DEFAULT_PLUGIN_DIR) {
  const registry = createRegistry();
  const plugins = loadPlugins(pluginDir);
  for (const p of plugins) {
    registerPlugin(registry, p);
  }
  return registry;
}
