import * as fs from "fs";

export interface PinEntry {
  label: string;
  snapshotPath: string;
  pinnedAt: string;
  note?: string;
}

export interface PinIndex {
  pins: PinEntry[];
}

export function loadPins(indexPath: string): PinIndex {
  if (!fs.existsSync(indexPath)) {
    return { pins: [] };
  }
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as PinIndex;
}

export function savePins(indexPath: string, index: PinIndex): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export function pinSnapshot(
  indexPath: string,
  label: string,
  snapshotPath: string,
  note?: string
): PinEntry {
  const index = loadPins(indexPath);
  const existing = index.pins.findIndex((p) => p.label === label);
  const entry: PinEntry = {
    label,
    snapshotPath,
    pinnedAt: new Date().toISOString(),
    ...(note !== undefined ? { note } : {}),
  };
  if (existing >= 0) {
    index.pins[existing] = entry;
  } else {
    index.pins.push(entry);
  }
  savePins(indexPath, index);
  return entry;
}

export function unpinSnapshot(indexPath: string, label: string): boolean {
  const index = loadPins(indexPath);
  const before = index.pins.length;
  index.pins = index.pins.filter((p) => p.label !== label);
  if (index.pins.length === before) return false;
  savePins(indexPath, index);
  return true;
}

export function getPin(indexPath: string, label: string): PinEntry | undefined {
  const index = loadPins(indexPath);
  return index.pins.find((p) => p.label === label);
}

export function listPins(indexPath: string): PinEntry[] {
  return loadPins(indexPath).pins;
}
