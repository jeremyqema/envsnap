import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadAliases, saveAliases, setAlias, removeAlias, resolveAlias, listAliases } from './alias';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap-alias-test-${Date.now()}.json`);
}

describe('alias', () => {
  test('loadAliases returns empty object for missing file', () => {
    expect(loadAliases('/nonexistent/file.json')).toEqual({});
  });

  test('saveAliases and loadAliases round-trip', () => {
    const file = tmpFile();
    const aliases = { prod: '/snapshots/prod.json', staging: '/snapshots/staging.json' };
    saveAliases(file, aliases);
    expect(loadAliases(file)).toEqual(aliases);
    fs.unlinkSync(file);
  });

  test('setAlias adds new alias', () => {
    const result = setAlias({}, 'dev', '/snapshots/dev.json');
    expect(result).toEqual({ dev: '/snapshots/dev.json' });
  });

  test('setAlias overwrites existing alias', () => {
    const existing = { dev: '/old.json' };
    const result = setAlias(existing, 'dev', '/new.json');
    expect(result.dev).toBe('/new.json');
  });

  test('removeAlias deletes the key', () => {
    const aliases = { dev: '/dev.json', prod: '/prod.json' };
    const result = removeAlias(aliases, 'dev');
    expect(result).toEqual({ prod: '/prod.json' });
  });

  test('removeAlias on missing key returns unchanged', () => {
    const aliases = { prod: '/prod.json' };
    const result = removeAlias(aliases, 'dev');
    expect(result).toEqual(aliases);
  });

  test('resolveAlias returns mapped path', () => {
    const aliases = { prod: '/snapshots/prod.json' };
    expect(resolveAlias(aliases, 'prod')).toBe('/snapshots/prod.json');
  });

  test('resolveAlias returns input when alias not found', () => {
    expect(resolveAlias({}, '/direct/path.json')).toBe('/direct/path.json');
  });

  test('listAliases returns sorted entries', () => {
    const aliases = { b: '/b.json', a: '/a.json' };
    const entries = listAliases(aliases);
    expect(entries).toContainEqual({ alias: 'a', path: '/a.json' });
    expect(entries).toContainEqual({ alias: 'b', path: '/b.json' });
  });
});
