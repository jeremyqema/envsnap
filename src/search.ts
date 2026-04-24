import { Snapshot } from './snapshot';

export interface SearchOptions {
  keys?: string[];
  values?: string[];
  keyPattern?: string;
  valuePattern?: string;
  caseSensitive?: boolean;
}

export interface SearchResult {
  key: string;
  value: string;
}

export function searchSnapshot(
  snapshot: Snapshot,
  opts: SearchOptions
): SearchResult[] {
  const results: SearchResult[] = [];
  const flags = opts.caseSensitive ? '' : 'i';

  for (const [key, value] of Object.entries(snapshot.env)) {
    if (opts.keys && opts.keys.length > 0) {
      const match = opts.caseSensitive
        ? opts.keys.includes(key)
        : opts.keys.map(k => k.toLowerCase()).includes(key.toLowerCase());
      if (!match) continue;
    }

    if (opts.keyPattern) {
      const re = new RegExp(opts.keyPattern, flags);
      if (!re.test(key)) continue;
    }

    if (opts.values && opts.values.length > 0) {
      const match = opts.caseSensitive
        ? opts.values.includes(value)
        : opts.values.map(v => v.toLowerCase()).includes(value.toLowerCase());
      if (!match) continue;
    }

    if (opts.valuePattern) {
      const re = new RegExp(opts.valuePattern, flags);
      if (!re.test(value)) continue;
    }

    results.push({ key, value });
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No matches found.';
  return results.map(r => `${r.key}=${r.value}`).join('\n');
}
