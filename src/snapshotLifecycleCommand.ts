import * as path from "path";
import {
  loadLifecycleIndex,
  saveLifecycleIndex,
  recordLifecycleEvent,
  getLifecycleHistory,
  getRecentEvents,
  clearLifecycleHistory,
  LifecycleEvent,
} from "./snapshot-lifecycle";

const DEFAULT_FILE = path.join(process.cwd(), ".envsnap", "lifecycle.json");

export function cmdLifecycleUsage(): void {
  console.log(`Usage: envsnap lifecycle <subcommand> [options]

Subcommands:
  record <label> <event> [--actor <name>] [--note <text>]  Record a lifecycle event
  history <label>                                          Show history for a label
  recent [--limit <n>]                                     Show recent events
  clear <label>                                            Clear history for a label

Events: created | updated | archived | deleted | restored | locked | unlocked
`);
}

export function cmdLifecycleRecord(args: string[], file = DEFAULT_FILE): void {
  const [label, event] = args;
  if (!label || !event) { cmdLifecycleUsage(); process.exit(1); }
  const actorIdx = args.indexOf("--actor");
  const noteIdx = args.indexOf("--note");
  const actor = actorIdx !== -1 ? args[actorIdx + 1] : undefined;
  const note = noteIdx !== -1 ? args[noteIdx + 1] : undefined;
  const index = loadLifecycleIndex(file);
  const entry = recordLifecycleEvent(index, label, event as LifecycleEvent, actor, note);
  saveLifecycleIndex(file, index);
  console.log(`Recorded '${entry.event}' for '${label}' at ${entry.timestamp}`);
}

export function cmdLifecycleHistory(args: string[], file = DEFAULT_FILE): void {
  const [label] = args;
  if (!label) { cmdLifecycleUsage(); process.exit(1); }
  const index = loadLifecycleIndex(file);
  const entries = getLifecycleHistory(index, label);
  if (entries.length === 0) { console.log(`No lifecycle history for '${label}'.`); return; }
  for (const e of entries) {
    const actor = e.actor ? ` [${e.actor}]` : "";
    const note = e.note ? ` — ${e.note}` : "";
    console.log(`${e.timestamp}  ${e.event}${actor}${note}`);
  }
}

export function cmdLifecycleRecent(args: string[], file = DEFAULT_FILE): void {
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 20;
  const index = loadLifecycleIndex(file);
  const entries = getRecentEvents(index, limit);
  if (entries.length === 0) { console.log("No lifecycle events recorded."); return; }
  for (const e of entries) {
    console.log(`${e.timestamp}  ${e.label}  ${e.event}${e.actor ? ` [${e.actor}]` : ""}`);
  }
}

export function cmdLifecycleClear(args: string[], file = DEFAULT_FILE): void {
  const [label] = args;
  if (!label) { cmdLifecycleUsage(); process.exit(1); }
  const index = loadLifecycleIndex(file);
  clearLifecycleHistory(index, label);
  saveLifecycleIndex(file, index);
  console.log(`Cleared lifecycle history for '${label}'.`);
}
