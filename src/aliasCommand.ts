import * as path from 'path';
import { loadAliases, saveAliases, setAlias, removeAlias, listAliases, resolveAlias } from './alias';

const DEFAULT_ALIAS_FILE = path.join(process.cwd(), '.envsnap-aliases.json');

export function cmdAliasSet(alias: string, snapshotPath: string, aliasFile = DEFAULT_ALIAS_FILE): void {
  const aliases = loadAliases(aliasFile);
  const updated = setAlias(aliases, alias, snapshotPath);
  saveAliases(aliasFile, updated);
  console.log(`Alias '${alias}' -> '${snapshotPath}' saved.`);
}

export function cmdAliasRemove(alias: string, aliasFile = DEFAULT_ALIAS_FILE): void {
  const aliases = loadAliases(aliasFile);
  if (!(alias in aliases)) {
    console.error(`Alias '${alias}' not found.`);
    process.exit(1);
  }
  const updated = removeAlias(aliases, alias);
  saveAliases(aliasFile, updated);
  console.log(`Alias '${alias}' removed.`);
}

export function cmdAliasList(aliasFile = DEFAULT_ALIAS_FILE): void {
  const aliases = loadAliases(aliasFile);
  const entries = listAliases(aliases);
  if (entries.length === 0) {
    console.log('No aliases defined.');
    return;
  }
  for (const { alias, path: p } of entries) {
    console.log(`  ${alias} -> ${p}`);
  }
}

export function cmdAliasResolve(aliasOrPath: string, aliasFile = DEFAULT_ALIAS_FILE): string {
  const aliases = loadAliases(aliasFile);
  return resolveAlias(aliases, aliasOrPath);
}
