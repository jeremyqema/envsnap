import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadFilterConfig, saveFilterConfig, DEFAULT_FILTER_CONFIG } from './filterConfig';

function tmpFile(name: string): string {
  return path.join(os.tmpdir(), `envsnap-test-${name}-${Date.now()}.json`);
}

describe('loadFilterConfig', () => {
  it('returns defaults when file does not exist', () => {
    const result = loadFilterConfig('/nonexistent/path/.envsnap.json');
    expect(result).toEqual(DEFAULT_FILTER_CONFIG);
  });

  it('loads config from a valid JSON file', () => {
    const file = tmpFile('load');
    const config = { include: ['NODE_*'], exclude: ['SECRET_*'], redact: ['*_KEY'] };
    fs.writeFileSync(file, JSON.stringify(config), 'utf-8');

    const result = loadFilterConfig(file);
    expect(result.include).toEqual(['NODE_*']);
    expect(result.exclude).toEqual(['SECRET_*']);
    expect(result.redact).toEqual(['*_KEY']);

    fs.unlinkSync(file);
  });

  it('falls back to defaults on invalid JSON', () => {
    const file = tmpFile('invalid');
    fs.writeFileSync(file, 'not-json', 'utf-8');

    const result = loadFilterConfig(file);
    expect(result).toEqual(DEFAULT_FILTER_CONFIG);

    fs.unlinkSync(file);
  });

  it('fills missing fields with defaults', () => {
    const file = tmpFile('partial');
    fs.writeFileSync(file, JSON.stringify({ include: ['PORT'] }), 'utf-8');

    const result = loadFilterConfig(file);
    expect(result.include).toEqual(['PORT']);
    expect(result.exclude).toEqual([]);
    expect(result.redact).toEqual(DEFAULT_FILTER_CONFIG.redact);

    fs.unlinkSync(file);
  });
});

describe('saveFilterConfig', () => {
  it('writes config to a JSON file', () => {
    const file = tmpFile('save');
    const config = { include: ['A'], exclude: ['B'], redact: ['C'] };
    saveFilterConfig(config, file);

    const raw = fs.readFileSync(file, 'utf-8');
    expect(JSON.parse(raw)).toEqual(config);

    fs.unlinkSync(file);
  });
});
