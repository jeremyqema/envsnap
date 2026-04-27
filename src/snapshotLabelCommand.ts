import * as path from "path";
import {
  loadLabelIndex,
  saveLabelIndex,
  attachLabel,
  detachLabel,
  getLabelsForSnapshot,
  getSnapshotsForLabel,
  listAllLabels,
} from "./snapshot-label";

const DEFAULT_INDEX = path.join(process.cwd(), ".envsnap", "label-index.json");

export function cmdLabelUsage(): void {
  console.log(`Usage: envsnap label <subcommand> [options]

Subcommands:
  attach <snapshot> <label>   Attach a label to a snapshot
  detach <snapshot> <label>   Detach a label from a snapshot
  show <snapshot>             Show all labels for a snapshot
  list <label>                List snapshots with a given label
  all                         List all known labels
`);
}

export function cmdLabelAttach(args: string[], indexPath = DEFAULT_INDEX): void {
  const [snapshotLabel, label] = args;
  if (!snapshotLabel || !label) { console.error("Usage: envsnap label attach <snapshot> <label>"); process.exit(1); }
  const index = loadLabelIndex(indexPath);
  const updated = attachLabel(index, snapshotLabel, label);
  saveLabelIndex(indexPath, updated);
  console.log(`Label "${label}" attached to snapshot "${snapshotLabel}".`);
}

export function cmdLabelDetach(args: string[], indexPath = DEFAULT_INDEX): void {
  const [snapshotLabel, label] = args;
  if (!snapshotLabel || !label) { console.error("Usage: envsnap label detach <snapshot> <label>"); process.exit(1); }
  const index = loadLabelIndex(indexPath);
  const updated = detachLabel(index, snapshotLabel, label);
  saveLabelIndex(indexPath, updated);
  console.log(`Label "${label}" detached from snapshot "${snapshotLabel}".`);
}

export function cmdLabelShow(args: string[], indexPath = DEFAULT_INDEX): void {
  const [snapshotLabel] = args;
  if (!snapshotLabel) { console.error("Usage: envsnap label show <snapshot>"); process.exit(1); }
  const index = loadLabelIndex(indexPath);
  const labels = getLabelsForSnapshot(index, snapshotLabel);
  if (labels.length === 0) { console.log(`No labels for "${snapshotLabel}".`); return; }
  console.log(`Labels for "${snapshotLabel}": ${labels.join(", ")}`);
}

export function cmdLabelList(args: string[], indexPath = DEFAULT_INDEX): void {
  const [label] = args;
  if (!label) { console.error("Usage: envsnap label list <label>"); process.exit(1); }
  const index = loadLabelIndex(indexPath);
  const snapshots = getSnapshotsForLabel(index, label);
  if (snapshots.length === 0) { console.log(`No snapshots with label "${label}".`); return; }
  console.log(`Snapshots with label "${label}":\n${snapshots.map((s) => `  - ${s}`).join("\n")}`);
}

export function cmdLabelAll(indexPath = DEFAULT_INDEX): void {
  const index = loadLabelIndex(indexPath);
  const labels = listAllLabels(index);
  if (labels.length === 0) { console.log("No labels defined."); return; }
  console.log(`All labels:\n${labels.map((l) => `  ${l} (${index.labels[l].length} snapshot(s))`).join("\n")}`);
}
