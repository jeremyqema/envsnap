import * as fs from 'fs';

export interface AuditEntry {
  timestamp: string;
  action: string;
  label?: string;
  user?: string;
  details?: Record<string, string>;
}

export interface AuditLog {
  entries: AuditEntry[];
}

export function loadAuditLog(path: string): AuditLog {
  if (!fs.existsSync(path)) return { entries: [] };
  return JSON.parse(fs.readFileSync(path, 'utf-8')) as AuditLog;
}

export function saveAuditLog(path: string, log: AuditLog): void {
  fs.writeFileSync(path, JSON.stringify(log, null, 2));
}

export function appendAuditEntry(
  path: string,
  action: string,
  opts: { label?: string; user?: string; details?: Record<string, string> } = {}
): AuditEntry {
  const log = loadAuditLog(path);
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...opts,
  };
  log.entries.push(entry);
  saveAuditLog(path, log);
  return entry;
}

export function queryAuditLog(
  log: AuditLog,
  filter: { action?: string; label?: string; since?: string }
): AuditEntry[] {
  return log.entries.filter((e) => {
    if (filter.action && e.action !== filter.action) return false;
    if (filter.label && e.label !== filter.label) return false;
    if (filter.since && e.timestamp < filter.since) return false;
    return true;
  });
}
