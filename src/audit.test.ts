import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadAuditLog, saveAuditLog, appendAuditEntry, queryAuditLog } from './audit';

function tmpFile(): string {
  return path.join(os.tmpdir(), `audit-test-${Math.random().toString(36).slice(2)}.json`);
}

test('loadAuditLog returns empty log for missing file', () => {
  const log = loadAuditLog('/nonexistent/path.json');
  expect(log.entries).toEqual([]);
});

test('saveAuditLog and loadAuditLog round-trip', () => {
  const p = tmpFile();
  const log = { entries: [{ timestamp: '2024-01-01T00:00:00.000Z', action: 'snapshot' }] };
  saveAuditLog(p, log);
  expect(loadAuditLog(p)).toEqual(log);
  fs.unlinkSync(p);
});

test('appendAuditEntry adds entry to log', () => {
  const p = tmpFile();
  const entry = appendAuditEntry(p, 'diff', { label: 'prod', user: 'alice' });
  expect(entry.action).toBe('diff');
  expect(entry.label).toBe('prod');
  const log = loadAuditLog(p);
  expect(log.entries).toHaveLength(1);
  fs.unlinkSync(p);
});

test('appendAuditEntry accumulates entries', () => {
  const p = tmpFile();
  appendAuditEntry(p, 'snapshot', { label: 'v1' });
  appendAuditEntry(p, 'diff', { label: 'v2' });
  expect(loadAuditLog(p).entries).toHaveLength(2);
  fs.unlinkSync(p);
});

test('queryAuditLog filters by action', () => {
  const log = {
    entries: [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'snapshot', label: 'v1' },
      { timestamp: '2024-01-02T00:00:00.000Z', action: 'diff', label: 'v1' },
    ],
  };
  expect(queryAuditLog(log, { action: 'snapshot' })).toHaveLength(1);
});

test('queryAuditLog filters by label', () => {
  const log = {
    entries: [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'snapshot', label: 'prod' },
      { timestamp: '2024-01-02T00:00:00.000Z', action: 'snapshot', label: 'staging' },
    ],
  };
  expect(queryAuditLog(log, { label: 'prod' })).toHaveLength(1);
});

test('queryAuditLog filters by since', () => {
  const log = {
    entries: [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'snapshot' },
      { timestamp: '2024-06-01T00:00:00.000Z', action: 'snapshot' },
    ],
  };
  const results = queryAuditLog(log, { since: '2024-03-01T00:00:00.000Z' });
  expect(results).toHaveLength(1);
  expect(results[0].timestamp).toBe('2024-06-01T00:00:00.000Z');
});
