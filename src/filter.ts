/**
 * Filter utilities for environment variable snapshots.
 * Supports include/exclude patterns using glob-style wildcards.
 */

export interface FilterOptions {
  include?: string[];
  exclude?: string[];
}

/**
 * Returns true if the key matches the given pattern.
 * Supports '*' as a wildcard.
 */
export function matchesPattern(key: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(key);
}

/**
 * Returns true if the key matches any of the given patterns.
 */
export function matchesAny(key: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesPattern(key, p));
}

/**
 * Filters an env record by include/exclude patterns.
 * - If include is provided, only matching keys are kept.
 * - If exclude is provided, matching keys are removed.
 * - Exclude takes precedence over include.
 */
export function filterEnv(
  env: Record<string, string>,
  options: FilterOptions
): Record<string, string> {
  const { include, exclude } = options;

  return Object.fromEntries(
    Object.entries(env).filter(([key]) => {
      if (include && include.length > 0 && !matchesAny(key, include)) {
        return false;
      }
      if (exclude && exclude.length > 0 && matchesAny(key, exclude)) {
        return false;
      }
      return true;
    })
  );
}

/**
 * Redacts sensitive keys by replacing their values with '***'.
 * Uses the same pattern matching as filterEnv.
 */
export function redactEnv(
  env: Record<string, string>,
  sensitivePatterns: string[]
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      key,
      matchesAny(key, sensitivePatterns) ? '***' : value,
    ])
  );
}
