import * as fs from 'fs';
import * as path from 'path';

export interface Snapshot {
  timestamp: string;
  label: string;
  env: Record<string, string>;
}

export function captureSnapshot(label: string): Snapshot {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return {
    timestamp: new Date().toISOString(),
    label,
    env,
  };
}

export function saveSnapshot(snapshot: Snapshot, outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filename = `${snapshot.label}-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Snapshot file not found: ${filepath}`);
  }
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}
