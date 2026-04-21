import { Snapshot } from './snapshot';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface ValidationResult {
  key: string;
  rule: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
}

export function validateSnapshot(
  snapshot: Snapshot,
  rules: ValidationRule[]
): ValidationReport {
  const errors: ValidationResult[] = [];
  const warnings: ValidationResult[] = [];

  for (const rule of rules) {
    const value = snapshot.env[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      errors.push({ key: rule.key, rule: 'required', message: `"${rule.key}" is required but missing or empty` });
      continue;
    }

    if (value === undefined) continue;

    if (rule.pattern) {
      const re = new RegExp(rule.pattern);
      if (!re.test(value)) {
        errors.push({ key: rule.key, rule: 'pattern', message: `"${rule.key}" does not match pattern ${rule.pattern}` });
      }
    }

    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push({ key: rule.key, rule: 'minLength', message: `"${rule.key}" is shorter than minimum length ${rule.minLength}` });
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      warnings.push({ key: rule.key, rule: 'maxLength', message: `"${rule.key}" exceeds maximum length ${rule.maxLength}` });
    }

    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push({ key: rule.key, rule: 'allowedValues', message: `"${rule.key}" value "${value}" is not in allowed list: ${rule.allowedValues.join(', ')}` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  if (report.valid) {
    lines.push('✔ Snapshot validation passed');
  } else {
    lines.push('✘ Snapshot validation failed');
  }
  for (const e of report.errors) {
    lines.push(`  [ERROR] ${e.message}`);
  }
  for (const w of report.warnings) {
    lines.push(`  [WARN]  ${w.message}`);
  }
  return lines.join('\n');
}
