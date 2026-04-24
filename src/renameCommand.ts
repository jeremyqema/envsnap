import { renameSnapshot, loadRenameIndex } from "./rename";
import * as path from "path";

const DEFAULT_SNAPSHOT_DIR = "./snapshots";
const DEFAULT_INDEX_FILE = "./snapshots/.rename-index.json";

export function cmdRenameUsage(): void {
  console.log(`Usage: envsnap rename <oldLabel> <newLabel> [--dir <snapshotDir>]`);
  console.log(`       envsnap rename --history [--dir <snapshotDir>]`);
}

export function cmdRename(args: string[]): void {
  if (args.length === 0 || args[0] === "--help") {
    cmdRenameUsage();
    return;
  }

  const dirIdx = args.indexOf("--dir");
  const snapshotDir =
    dirIdx !== -1 && args[dirIdx + 1] ? args[dirIdx + 1] : DEFAULT_SNAPSHOT_DIR;
  const indexFile = path.join(snapshotDir, ".rename-index.json");

  if (args[0] === "--history") {
    const index = loadRenameIndex(indexFile);
    if (index.entries.length === 0) {
      console.log("No rename history found.");
      return;
    }
    console.log("Rename history:");
    for (const e of index.entries) {
      console.log(`  ${e.oldLabel} -> ${e.newLabel}  (${e.renamedAt})`);
    }
    return;
  }

  const filteredArgs = dirIdx !== -1 ? args.slice(0, dirIdx) : args;
  if (filteredArgs.length < 2) {
    console.error("Error: both <oldLabel> and <newLabel> are required.");
    cmdRenameUsage();
    process.exit(1);
  }

  const [oldLabel, newLabel] = filteredArgs;
  try {
    renameSnapshot(snapshotDir, oldLabel, newLabel, indexFile);
    console.log(`Snapshot renamed: "${oldLabel}" -> "${newLabel}"`);
  } catch (err: unknown) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
