import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadTemplate, saveTemplate, applyTemplate, validateTemplate, SnapshotTemplate } from './template';

function tmpFile(): string {
  return path.join(os.tmpdir(), `template-test-${Math.random().toString(36).slice(2)}.json`);
}

const sampleTemplate: SnapshotTemplate = {
  name: 'web',
  description: 'Web app env',
  keys: ['PORT', 'DATABASE_URL', 'SECRET_KEY'],
  defaults: { PORT: '3000' },
};

test('saveTemplate and loadTemplate round-trip', () => {
  const f = tmpFile();
  saveTemplate(f, sampleTemplate);
  const loaded = loadTemplate(f);
  expect(loaded).toEqual(sampleTemplate);
  fs.unlinkSync(f);
});

test('applyTemplate picks keys from env and fills defaults', () => {
  const env = { DATABASE_URL: 'postgres://localhost/db', OTHER: 'ignored' };
  const result = applyTemplate(sampleTemplate, env);
  expect(result).toEqual({ PORT: '3000', DATABASE_URL: 'postgres://localhost/db' });
  expect(result.OTHER).toBeUndefined();
});

test('applyTemplate uses env value over default', () => {
  const env = { PORT: '8080', DATABASE_URL: 'x', SECRET_KEY: 'abc' };
  const result = applyTemplate(sampleTemplate, env);
  expect(result.PORT).toBe('8080');
});

test('validateTemplate returns missing keys without defaults', () => {
  const env = { PORT: '3000' };
  const missing = validateTemplate(sampleTemplate, env);
  expect(missing).toContain('DATABASE_URL');
  expect(missing).toContain('SECRET_KEY');
  expect(missing).not.toContain('PORT');
});

test('validateTemplate returns empty when all keys present', () => {
  const env = { PORT: '3000', DATABASE_URL: 'x', SECRET_KEY: 'y' };
  const missing = validateTemplate(sampleTemplate, env);
  expect(missing).toHaveLength(0);
});
