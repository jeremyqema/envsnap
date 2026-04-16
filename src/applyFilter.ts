/**
 * High-level helper that applies a FilterConfig (include, exclude, redact)
 * to a snapshot's env record in one step.
 *
 * Used by the CLI and snapshot pipeline.
 */

import { filterEnv, redactEnv } from './filter';
import { FilterConfig } from './filterConfig';

export interface ApplyFilterResult {
  env: Record<string, string>;
  redactedCount: number;
  removedCount: number;
}

/**
 * Applies include/exclude filtering and then redacts sensitive values.
 *
 * @param env   Raw environment record.
 * @param config FilterConfig with include, exclude, and redact patterns.
 * @returns Filtered and redacted env along with change counts.
 */
export function applyFilter(
  env: Record<string, string>,
  config: FilterConfig
): ApplyFilterResult {
  const originalKeys = Object.keys(env);

  const filtered = filterEnv(env, {
    include: config.include,
    exclude: config.exclude,
  });

  const removedCount = originalKeys.length - Object.keys(filtered).length;

  const redactPatterns = config.redact ?? [];
  const redacted = redactEnv(filtered, redactPatterns);

  const redactedCount = Object.entries(redacted).filter(
    ([key, val]) => val === '***' && filtered[key] !== '***'
  ).length;

  return { env: redacted, redactedCount, removedCount };
}
