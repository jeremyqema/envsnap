import * as fs from 'fs';
import * as path from 'path';

export interface EnvsnapPlugin {
  name: string;
  version: string;
  hooks: Partial<PluginHooks>;
}

export interface PluginHooks {
  beforeSnapshot: (env: Record<string, string>) => Record<string, string>;
  afterSnapshot: (env: Record<string, string>) => Record<string, string>;
  beforeDiff: (a: Record<string, string>, b: Record<string, string>) => void;
  afterDiff: (result: unknown) => void;
}

export interface PluginRegistry {
  plugins: EnvsnapPlugin[];
}

export function loadPlugins(pluginDir: string): EnvsnapPlugin[] {
  if (!fs.existsSync(pluginDir)) return [];
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
  return files.map(f => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(path.resolve(pluginDir, f));
    return mod.default ?? mod;
  }).filter(p => p && p.name);
}

export function registerPlugin(registry: PluginRegistry, plugin: EnvsnapPlugin): void {
  if (registry.plugins.find(p => p.name === plugin.name)) {
    throw new Error(`Plugin '${plugin.name}' is already registered.`);
  }
  registry.plugins.push(plugin);
}

export function runHook<K extends keyof PluginHooks>(
  registry: PluginRegistry,
  hook: K,
  ...args: Parameters<NonNullable<PluginHooks[K]>>
): void {
  for (const plugin of registry.plugins) {
    const fn = plugin.hooks[hook] as ((...a: unknown[]) => unknown) | undefined;
    if (fn) fn(...args);
  }
}

export function createRegistry(): PluginRegistry {
  return { plugins: [] };
}
