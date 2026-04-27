import * as fs from "fs";

export interface LabelIndex {
  labels: Record<string, string[]>; // label -> list of snapshot labels
  snapshots: Record<string, string[]>; // snapshot label -> list of labels
}

export function emptyLabelIndex(): LabelIndex {
  return { labels: {}, snapshots: {} };
}

export function loadLabelIndex(indexPath: string): LabelIndex {
  if (!fs.existsSync(indexPath)) return emptyLabelIndex();
  return JSON.parse(fs.readFileSync(indexPath, "utf8")) as LabelIndex;
}

export function saveLabelIndex(indexPath: string, index: LabelIndex): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function attachLabel(index: LabelIndex, snapshotLabel: string, label: string): LabelIndex {
  const snap = index.snapshots[snapshotLabel] ?? [];
  if (!snap.includes(label)) snap.push(label);
  const lbl = index.labels[label] ?? [];
  if (!lbl.includes(snapshotLabel)) lbl.push(snapshotLabel);
  return {
    labels: { ...index.labels, [label]: lbl },
    snapshots: { ...index.snapshots, [snapshotLabel]: snap },
  };
}

export function detachLabel(index: LabelIndex, snapshotLabel: string, label: string): LabelIndex {
  const snap = (index.snapshots[snapshotLabel] ?? []).filter((l) => l !== label);
  const lbl = (index.labels[label] ?? []).filter((s) => s !== snapshotLabel);
  const newSnapshots = { ...index.snapshots, [snapshotLabel]: snap };
  const newLabels = { ...index.labels, [label]: lbl };
  if (snap.length === 0) delete newSnapshots[snapshotLabel];
  if (lbl.length === 0) delete newLabels[label];
  return { labels: newLabels, snapshots: newSnapshots };
}

export function getLabelsForSnapshot(index: LabelIndex, snapshotLabel: string): string[] {
  return index.snapshots[snapshotLabel] ?? [];
}

export function getSnapshotsForLabel(index: LabelIndex, label: string): string[] {
  return index.labels[label] ?? [];
}

export function listAllLabels(index: LabelIndex): string[] {
  return Object.keys(index.labels).sort();
}
