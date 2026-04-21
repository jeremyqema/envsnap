import * as fs from 'fs';

export interface SnapshotTemplate {
  name: string;
  description?: string;
  keys: string[];
  defaults?: Record<string, string>;
}

export function loadTemplate(filePath: string): SnapshotTemplate {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse template file "${filePath}": ${(e as Error).message}`);
  }
  const template = parsed as SnapshotTemplate;
  if (!template.name || !Array.isArray(template.keys)) {
    throw new Error(`Invalid template: "name" and "keys" are required fields`);
  }
  return template;
}

export function saveTemplate(filePath: string, template: SnapshotTemplate): void {
  fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
}

export function applyTemplate(
  template: SnapshotTemplate,
  env: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of template.keys) {
    if (key in env) {
      result[key] = env[key];
    } else if (template.defaults && key in template.defaults) {
      result[key] = template.defaults[key];
    }
  }
  return result;
}

export function validateTemplate(
  template: SnapshotTemplate,
  env: Record<string, string>
): string[] {
  const missing: string[] = [];
  for (const key of template.keys) {
    const hasDefault = template.defaults && key in template.defaults;
    if (!(key in env) && !hasDefault) {
      missing.push(key);
    }
  }
  return missing;
}
