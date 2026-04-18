export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

const builtinRules: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `'${key}' has an empty value` : null,
  },
  {
    name: 'no-whitespace-key',
    check: (key) =>
      /\s/.test(key) ? `Key '${key}' contains whitespace` : null,
  },
  {
    name: 'uppercase-key',
    check: (key) =>
      key !== key.toUpperCase() ? `Key '${key}' is not uppercase` : null,
  },
  {
    name: 'no-secret-plaintext',
    check: (key, value) =>
      /(SECRET|PASSWORD|TOKEN|API_KEY)/i.test(key) && value.length < 8
        ? `'${key}' looks like a secret but value is suspiciously short`
        : null,
  },
];

export function lintSnapshot(
  env: Record<string, string>,
  rules: LintRule[] = builtinRules
): LintResult[] {
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(env)) {
    for (const rule of rules) {
      const msg = rule.check(key, value);
      if (msg) results.push({ key, rule: rule.name, message: msg });
    }
  }
  return results;
}

export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) return 'No lint issues found.';
  return results.map((r) => `[${r.rule}] ${r.message}`).join('\n');
}
