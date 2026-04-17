import * as fs from 'fs';

export interface AliasMap {
  [alias: string]: string;
}

export function loadAliases(filePath: string): AliasMap {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(filePath: string, aliases: AliasMap): void {
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2), 'utf-8');
}

export function setAlias(aliases: AliasMap, alias: string, snapshotPath: string): AliasMap {
  return { ...aliases, [alias]: snapshotPath };
}

export function removeAlias(aliases: AliasMap, alias: string): AliasMap {
  const updated = { ...aliases };
  delete updated[alias];
  return updated;
}

export function resolveAlias(aliases: AliasMap, aliasOrPath: string): string {
  return aliases[aliasOrPath] ?? aliasOrPath;
}

export function listAliases(aliases: AliasMap): Array<{ alias: string; path: string }> {
  return Object.entries(aliases).map(([alias, path]) => ({ alias, path }));
}
