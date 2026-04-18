import * as fs from 'fs';
import * as path from 'path';
import { loadTemplate, saveTemplate, applyTemplate, validateTemplate, SnapshotTemplate } from './template';
import { captureSnapshot, saveSnapshot } from './snapshot';

export function cmdTemplateCreate(name: string, keys: string[], outPath: string): void {
  const template: SnapshotTemplate = { name, keys };
  saveTemplate(outPath, template);
  console.log(`Template '${name}' saved to ${outPath}`);
}

export function cmdTemplateApply(templatePath: string, outPath: string): void {
  const template = loadTemplate(templatePath);
  const env = captureSnapshot();
  const missing = validateTemplate(template, env);
  if (missing.length > 0) {
    console.warn(`Warning: missing keys (no default): ${missing.join(', ')}`);
  }
  const filtered = applyTemplate(template, env);
  saveSnapshot(outPath, filtered);
  console.log(`Snapshot applied from template '${template.name}' -> ${outPath}`);
}

export function cmdTemplateValidate(templatePath: string): void {
  const template = loadTemplate(templatePath);
  const env = captureSnapshot();
  const missing = validateTemplate(template, env);
  if (missing.length === 0) {
    console.log('All required keys are present.');
  } else {
    console.error(`Missing required keys: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export function cmdTemplateList(dir: string): void {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No templates found.');
    return;
  }
  for (const file of files) {
    const t = loadTemplate(path.join(dir, file));
    console.log(`${t.name} (${file}): ${t.keys.length} keys${t.description ? ' - ' + t.description : ''}`);
  }
}
