import * as fs from "fs";
import * as path from "path";
import { loadHistory, HistoryEntry } from "./history";
import { loadSnapshot, saveSnapshot, Snapshot } from "./snapshot";
import { appendAuditEntry } from "./audit";

export interface RestoreResult {
  success: boolean;
  entry: HistoryEntry;
  previousSnapshot?: Snapshot;
  message: string;
}

export function restoreSnapshot(
  historyFile: string,
  label: string,
  targetFile: string,
  auditFile?: string
): RestoreResult {
  const history = loadHistory(historyFile);
  const entry = history.entries.find((e) => e.label === label);

  if (!entry) {
    return {
      success: false,
      entry: {} as HistoryEntry,
      message: `No history entry found with label: ${label}`,
    };
  }

  let previousSnapshot: Snapshot | undefined;
  if (fs.existsSync(targetFile)) {
    try {
      previousSnapshot = loadSnapshot(targetFile);
    } catch {
      // ignore if unreadable
    }
  }

  const snapshotPath = entry.file;
  if (!fs.existsSync(snapshotPath)) {
    return {
      success: false,
      entry,
      message: `Snapshot file not found: ${snapshotPath}`,
    };
  }

  const snapshot = loadSnapshot(snapshotPath);
  saveSnapshot(snapshot, targetFile);

  if (auditFile) {
    appendAuditEntry(auditFile, {
      timestamp: new Date().toISOString(),
      action: "restore",
      label,
      detail: `Restored snapshot from label '${label}' to ${targetFile}`,
    });
  }

  return {
    success: true,
    entry,
    previousSnapshot,
    message: `Successfully restored snapshot '${label}' to ${targetFile}`,
  };
}

export function listRestorableSnapshots(historyFile: string): HistoryEntry[] {
  const history = loadHistory(historyFile);
  return history.entries.filter((e) => fs.existsSync(e.file));
}
