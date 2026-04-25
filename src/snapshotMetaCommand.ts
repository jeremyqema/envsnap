import {
  loadMetaIndex,
  saveMetaIndex,
  setMeta,
  getMeta,
  removeMeta,
  listMeta,
} from "./snapshot-meta";

const DEFAULT_META_FILE = ".envsnap/meta.json";

export function cmdMetaUsage(): void {
  console.log(`Usage: envsnap meta <subcommand> [options]

Subcommands:
  set <label> [--desc <text>] [--author <name>] [--source <src>]
                        Set metadata for a snapshot
  get <label>           Show metadata for a snapshot
  remove <label>        Remove metadata for a snapshot
  list                  List all snapshot metadata
`);
}

export function cmdMetaSet(
  args: string[],
  metaFile = DEFAULT_META_FILE
): void {
  const label = args[0];
  if (!label) { console.error("Error: label required"); process.exit(1); }
  const meta: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--desc" && args[i + 1]) meta.description = args[++i];
    else if (args[i] === "--author" && args[i + 1]) meta.author = args[++i];
    else if (args[i] === "--source" && args[i + 1]) meta.source = args[++i];
    else {
      console.error(`Error: unknown option "${args[i]}"`);
      process.exit(1);
    }
  }
  const index = loadMetaIndex(metaFile);
  const updated = setMeta(index, label, meta);
  saveMetaIndex(metaFile, updated);
  console.log(`Metadata set for "${label}".`);
}

export function cmdMetaGet(
  args: string[],
  metaFile = DEFAULT_META_FILE
): void {
  const label = args[0];
  if (!label) { console.error("Error: label required"); process.exit(1); }
  const index = loadMetaIndex(metaFile);
  const entry = getMeta(index, label);
  if (!entry) { console.log(`No metadata found for "${label}".`); return; }
  console.log(JSON.stringify(entry, null, 2));
}

export function cmdMetaRemove(
  args: string[],
  metaFile = DEFAULT_META_FILE
): void {
  const label = args[0];
  if (!label) { console.error("Error: label required"); process.exit(1); }
  const index = loadMetaIndex(metaFile);
  const updated = removeMeta(index, label);
  if (!getMeta(index, label)) {
    console.log(`No metadata found for "${label}", nothing to remove.`);
    return;
  }
  saveMetaIndex(metaFile, updated);
  console.log(`Metadata removed for "${label}".`);
}

export function cmdMetaList(metaFile = DEFAULT_META_FILE): void {
  const index = loadMetaIndex(metaFile);
  const entries = listMeta(index);
  if (entries.length === 0) { console.log("No metadata entries found."); return; }
  for (const e of entries) {
    const parts = [`[${e.label}]`, e.createdAt];
    if (e.author) parts.push(`author=${e.author}`);
    if (e.source) parts.push(`source=${e.source}`);
    if (e.description) parts.push(`"${e.description}"`);
    console.log(parts.join("  "));
  }
}
