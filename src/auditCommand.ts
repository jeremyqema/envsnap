import { loadAuditLog, appendAuditEntry, queryAuditLog } from './audit';

const DEFAULT_PATH = '.envsnap-audit.json';

export function cmdAuditLog(args: string[]): void {
  const auditPath = process.env.ENVSNAP_AUDIT_PATH || DEFAULT_PATH;
  const action = args.find((a) => a.startsWith('--action='))?.split('=')[1];
  const label = args.find((a) => a.startsWith('--label='))?.split('=')[1];
  const since = args.find((a) => a.startsWith('--since='))?.split('=')[1];

  const log = loadAuditLog(auditPath);
  const results = queryAuditLog(log, { action, label, since });

  if (results.length === 0) {
    console.log('No audit entries found.');
    return;
  }

  for (const e of results) {
    const parts = [e.timestamp, e.action];
    if (e.label) parts.push(`label=${e.label}`);
    if (e.user) parts.push(`user=${e.user}`);
    if (e.details) parts.push(JSON.stringify(e.details));
    console.log(parts.join('  '));
  }
}

export function cmdAuditRecord(
  action: string,
  label?: string,
  details?: Record<string, string>
): void {
  const auditPath = process.env.ENVSNAP_AUDIT_PATH || DEFAULT_PATH;
  const user = process.env.USER || process.env.USERNAME;
  const entry = appendAuditEntry(auditPath, action, { label, user, details });
  console.log(`Recorded: ${entry.action} at ${entry.timestamp}`);
}

export function cmdAuditUsage(): void {
  console.log('Usage: envsnap audit <log|record> [options]');
  console.log('  log     --action=<a> --label=<l> --since=<iso>');
  console.log('  record  <action> [--label=<l>]');
}
