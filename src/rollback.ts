import { loadHistory, findEntry } from './history';
import { loadSnapshot, saveSnapshot } from './snapshot';
import { appendAuditEntry } from './audit';
import type { Snapshot } from './snapshot';

export interface RollbackResult {
  success: boolean;
  label: string;
  snapshot: Snapshot;
  message: string;
}

export async function rollbackToLabel(
  historyFile: string,
  label: string,
  targetFile: string,
  auditFile?: string
): Promise<RollbackResult> {
  const history = await loadHistory(historyFile);
  const entry = findEntry(history, label);
  if (!entry) {
    throw new Error(`No history entry found for label: ${label}`);
  }
  const snapshot = await loadSnapshot(entry.snapshotFile);
  await saveSnapshot(snapshot, targetFile);
  if (auditFile) {
    await appendAuditEntry(auditFile, {
      timestamp: new Date().toISOString(),
      action: 'rollback',
      label,
      detail: `Rolled back to ${label} from ${entry.snapshotFile}`,
    });
  }
  return {
    success: true,
    label,
    snapshot,
    message: `Rolled back to snapshot labeled "${label}"`,
  };
}

export async function listRollbackTargets(
  historyFile: string
): Promise<{ label: string; timestamp: string; snapshotFile: string }[]> {
  const history = await loadHistory(historyFile);
  return history.entries.map((e) => ({
    label: e.label,
    timestamp: e.timestamp,
    snapshotFile: e.snapshotFile,
  }));
}
