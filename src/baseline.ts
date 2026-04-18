import * as fs from "fs";
import { Snapshot } from "./snapshot";

export interface BaselineEntry {
  label: string;
  snapshot: Snapshot;
  createdAt: string;
}

export function loadBaseline(file: string): BaselineEntry | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as BaselineEntry;
}

export function saveBaseline(file: string, entry: BaselineEntry): void {
  fs.writeFileSync(file, JSON.stringify(entry, null, 2), "utf8");
}

export function setBaseline(file: string, label: string, snapshot: Snapshot): BaselineEntry {
  const entry: BaselineEntry = {
    label,
    snapshot,
    createdAt: new Date().toISOString(),
  };
  saveBaseline(file, entry);
  return entry;
}

export function clearBaseline(file: string): void {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function compareToBaseline(
  baseline: BaselineEntry,
  current: Snapshot
): { added: string[]; removed: string[]; changed: string[] } {
  const baseEnv = baseline.snapshot.env;
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const key of Object.keys(current.env)) {
    if (!(key in baseEnv)) added.push(key);
    else if (baseEnv[key] !== current.env[key]) changed.push(key);
  }
  for (const key of Object.keys(baseEnv)) {
    if (!(key in current.env)) removed.push(key);
  }
  return { added, removed, changed };
}
