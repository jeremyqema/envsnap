import * as path from "path";
import {
  loadIndex,
  saveIndex,
  addEntry,
  removeEntry,
  findEntry,
  listEntries,
  formatIndex,
} from "./snapshot-index";

const DEFAULT_INDEX = path.join(process.cwd(), ".envsnap", "index.json");

export function cmdIndexUsage(): void {
  console.log(`Usage: envsnap index <subcommand> [options]

Subcommands:
  add <label> <file> [--tag <tag>] [--desc <description>]  Add or update an entry
  remove <label>                                            Remove an entry
  show <label>                                              Show a single entry
  list [--tag <tag>]                                        List all entries
`);
}

export function cmdIndexAdd(args: string[], indexFile = DEFAULT_INDEX): void {
  const [label, file, ...rest] = args;
  if (!label || !file) { cmdIndexUsage(); process.exit(1); }
  const tagIdx = rest.indexOf("--tag");
  const tags = tagIdx >= 0 && rest[tagIdx + 1] ? [rest[tagIdx + 1]] : [];
  const descIdx = rest.indexOf("--desc");
  const description = descIdx >= 0 && rest[descIdx + 1] ? rest[descIdx + 1] : undefined;
  const index = loadIndex(indexFile);
  const updated = addEntry(index, {
    label,
    file,
    createdAt: new Date().toISOString(),
    tags,
    description,
  });
  saveIndex(indexFile, updated);
  console.log(`Indexed snapshot "${label}" -> ${file}`);
}

export function cmdIndexRemove(args: string[], indexFile = DEFAULT_INDEX): void {
  const [label] = args;
  if (!label) { cmdIndexUsage(); process.exit(1); }
  const index = loadIndex(indexFile);
  if (!findEntry(index, label)) {
    console.error(`Entry "${label}" not found.`);
    process.exit(1);
  }
  saveIndex(indexFile, removeEntry(index, label));
  console.log(`Removed "${label}" from index.`);
}

export function cmdIndexShow(args: string[], indexFile = DEFAULT_INDEX): void {
  const [label] = args;
  if (!label) { cmdIndexUsage(); process.exit(1); }
  const entry = findEntry(loadIndex(indexFile), label);
  if (!entry) { console.error(`Entry "${label}" not found.`); process.exit(1); }
  console.log(JSON.stringify(entry, null, 2));
}

export function cmdIndexList(args: string[], indexFile = DEFAULT_INDEX): void {
  const tagIdx = args.indexOf("--tag");
  const tag = tagIdx >= 0 ? args[tagIdx + 1] : undefined;
  const entries = listEntries(loadIndex(indexFile), tag);
  console.log(formatIndex(entries));
}
