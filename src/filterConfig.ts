/**
 * Loads and validates filter configuration from a JSON file or defaults.
 */

import fs from 'fs';
import path from 'path';
import { FilterOptions } from './filter';

export interface FilterConfig extends FilterOptions {
  redact?: string[];
}

const DEFAULT_REDACT_PATTERNS = [
  '*_SECRET*',
  '*_PASSWORD*',
  '*_TOKEN*',
  '*_KEY',
  '*_PRIVATE*',
];

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  include: [],
  exclude: [],
  redact: DEFAULT_REDACT_PATTERNS,
};

/**
 * Loads filter config from a JSON file.
 * Falls back to defaults if the file does not exist.
 */
export function loadFilterConfig(configPath?: string): FilterConfig {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), '.envsnap.json');

  if (!fs.existsSync(resolvedPath)) {
    return { ...DEFAULT_FILTER_CONFIG };
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<FilterConfig>;
    return {
      include: parsed.include ?? [],
      exclude: parsed.exclude ?? [],
      redact: parsed.redact ?? DEFAULT_REDACT_PATTERNS,
    };
  } catch (err) {
    console.warn(`[envsnap] Failed to parse filter config at ${resolvedPath}:`, err);
    return { ...DEFAULT_FILTER_CONFIG };
  }
}

/**
 * Saves a filter config to a JSON file.
 */
export function saveFilterConfig(config: FilterConfig, configPath?: string): void {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), '.envsnap.json');

  fs.writeFileSync(resolvedPath, JSON.stringify(config, null, 2), 'utf-8');
}
