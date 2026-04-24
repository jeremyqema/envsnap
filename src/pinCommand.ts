import { pinSnapshot, unpinSnapshot, listPins, getPin } from "./pin";

const DEFAULT_INDEX = ".envsnap/pins.json";

export function cmdPinUsage(): void {
  console.log(`Usage:
  envsnap pin add <label> <snapshot-path> [--note <text>]
  envsnap pin remove <label>
  envsnap pin list
  envsnap pin show <label>`);
}

export function cmdPinAdd(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const [label, snapshotPath, ...rest] = args;
  if (!label || !snapshotPath) {
    console.error("pin add requires <label> and <snapshot-path>");
    process.exit(1);
  }
  let note: string | undefined;
  const noteIdx = rest.indexOf("--note");
  if (noteIdx >= 0 && rest[noteIdx + 1]) {
    note = rest[noteIdx + 1];
  }
  const entry = pinSnapshot(indexPath, label, snapshotPath, note);
  console.log(`Pinned '${entry.label}' -> ${entry.snapshotPath} at ${entry.pinnedAt}`);
}

export function cmdPinRemove(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const [label] = args;
  if (!label) {
    console.error("pin remove requires <label>");
    process.exit(1);
  }
  const removed = unpinSnapshot(indexPath, label);
  if (removed) {
    console.log(`Unpinned '${label}'`);
  } else {
    console.error(`No pin found for label '${label}'`);
    process.exit(1);
  }
}

export function cmdPinList(indexPath: string = DEFAULT_INDEX): void {
  const pins = listPins(indexPath);
  if (pins.length === 0) {
    console.log("No pinned snapshots.");
    return;
  }
  for (const p of pins) {
    const note = p.note ? `  # ${p.note}` : "";
    console.log(`${p.label}  ${p.snapshotPath}  (${p.pinnedAt})${note}`);
  }
}

export function cmdPinShow(
  args: string[],
  indexPath: string = DEFAULT_INDEX
): void {
  const [label] = args;
  if (!label) {
    console.error("pin show requires <label>");
    process.exit(1);
  }
  const pin = getPin(indexPath, label);
  if (!pin) {
    console.error(`No pin found for label '${label}'`);
    process.exit(1);
  }
  console.log(JSON.stringify(pin, null, 2));
}
