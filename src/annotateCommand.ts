import * as path from "path";
import {
  loadAnnotations,
  saveAnnotations,
  addAnnotation,
  removeAnnotation,
  getAnnotation,
  listAnnotations,
} from "./annotate";

const DEFAULT_FILE = path.join(process.cwd(), ".envsnap", "annotations.json");

export function cmdAnnotateAdd(
  label: string,
  note: string,
  author?: string,
  filePath = DEFAULT_FILE
): void {
  let store = loadAnnotations(filePath);
  store = addAnnotation(store, label, note, author);
  saveAnnotations(filePath, store);
  console.log(`Annotation added for label "${label}".`);
}

export function cmdAnnotateRemove(label: string, filePath = DEFAULT_FILE): void {
  let store = loadAnnotations(filePath);
  if (!getAnnotation(store, label)) {
    console.error(`No annotation found for label "${label}".`);
    process.exit(1);
  }
  store = removeAnnotation(store, label);
  saveAnnotations(filePath, store);
  console.log(`Annotation removed for label "${label}".`);
}

export function cmdAnnotateShow(label: string, filePath = DEFAULT_FILE): void {
  const store = loadAnnotations(filePath);
  const entry = getAnnotation(store, label);
  if (!entry) {
    console.error(`No annotation found for label "${label}".`);
    process.exit(1);
  }
  console.log(`Label:   ${entry.label}`);
  console.log(`Note:    ${entry.note}`);
  if (entry.author) console.log(`Author:  ${entry.author}`);
  console.log(`Created: ${entry.createdAt}`);
}

export function cmdAnnotateList(filePath = DEFAULT_FILE): void {
  const store = loadAnnotations(filePath);
  const entries = listAnnotations(store);
  if (entries.length === 0) {
    console.log("No annotations found.");
    return;
  }
  for (const e of entries) {
    const author = e.author ? ` (${e.author})` : "";
    console.log(`[${e.label}]${author} ${e.note}`);
  }
}

export function cmdAnnotateUsage(): void {
  console.log(`Usage: envsnap annotate <subcommand> [options]

Subcommands:
  add <label> <note> [--author <name>]  Add or update annotation for a label
  remove <label>                        Remove annotation for a label
  show <label>                          Show annotation details
  list                                  List all annotations
`);
}
