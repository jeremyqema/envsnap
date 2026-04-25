import * as path from "path";
import {
  loadAccessIndex,
  saveAccessIndex,
  recordAccess,
  getAccessHistory,
  getRecentAccess,
  clearAccessHistory,
} from "./snapshot-access";

const DEFAULT_FILE = path.join(process.cwd(), ".envsnap", "access-log.json");

export function cmdAccessUsage(): void {
  console.log(`Usage: envsnap access <subcommand> [options]

Subcommands:
  record <label> <action>   Record an access event (action: read|write|delete)
  history <label>           Show access history for a snapshot label
  recent [--limit N]        Show N most recent access events (default: 10)
  clear <label>             Clear access history for a snapshot label
`);
}

export function cmdAccessRecord(
  args: string[],
  filePath = DEFAULT_FILE
): void {
  const [label, action] = args;
  if (!label || !action) {
    console.error("Usage: envsnap access record <label> <action>");
    process.exit(1);
  }
  if (action !== "read" && action !== "write" && action !== "delete") {
    console.error("Action must be one of: read, write, delete");
    process.exit(1);
  }
  let index = loadAccessIndex(filePath);
  index = recordAccess(index, label, action as "read" | "write" | "delete");
  saveAccessIndex(filePath, index);
  console.log(`Recorded ${action} access for "${label}"`);
}

export function cmdAccessHistory(
  args: string[],
  filePath = DEFAULT_FILE
): void {
  const [label] = args;
  if (!label) {
    console.error("Usage: envsnap access history <label>");
    process.exit(1);
  }
  const index = loadAccessIndex(filePath);
  const entries = getAccessHistory(index, label);
  if (entries.length === 0) {
    console.log(`No access history for "${label}"`);
    return;
  }
  entries.forEach((e) => console.log(`[${e.accessedAt}] ${e.action}`));
}

export function cmdAccessRecent(
  args: string[],
  filePath = DEFAULT_FILE
): void {
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10;
  const index = loadAccessIndex(filePath);
  const entries = getRecentAccess(index, limit);
  if (entries.length === 0) {
    console.log("No access events recorded.");
    return;
  }
  entries.forEach((e) =>
    console.log(`[${e.accessedAt}] ${e.action.padEnd(7)} ${e.label}`)
  );
}

export function cmdAccessClear(
  args: string[],
  filePath = DEFAULT_FILE
): void {
  const [label] = args;
  if (!label) {
    console.error("Usage: envsnap access clear <label>");
    process.exit(1);
  }
  let index = loadAccessIndex(filePath);
  index = clearAccessHistory(index, label);
  saveAccessIndex(filePath, index);
  console.log(`Cleared access history for "${label}"`);
}
