import { DiffResult } from './diff';

export type NotifyChannel = 'console' | 'webhook';

export interface NotifyConfig {
  channel: NotifyChannel;
  webhookUrl?: string;
  minSeverity?: 'any' | 'added' | 'removed' | 'changed';
}

export interface NotifyPayload {
  label: string;
  summary: string;
  changes: number;
  timestamp: string;
}

export function buildPayload(label: string, diff: DiffResult): NotifyPayload {
  const changes = diff.added.length + diff.removed.length + diff.changed.length;
  const parts: string[] = [];
  if (diff.added.length) parts.push(`+${diff.added.length} added`);
  if (diff.removed.length) parts.push(`-${diff.removed.length} removed`);
  if (diff.changed.length) parts.push(`~${diff.changed.length} changed`);
  return {
    label,
    summary: parts.join(', ') || 'no changes',
    changes,
    timestamp: new Date().toISOString(),
  };
}

export async function sendNotification(
  config: NotifyConfig,
  payload: NotifyPayload
): Promise<void> {
  if (config.channel === 'console') {
    console.log(`[envsnap notify] ${payload.label}: ${payload.summary} (${payload.timestamp})`);
    return;
  }
  if (config.channel === 'webhook') {
    if (!config.webhookUrl) throw new Error('webhookUrl required for webhook channel');
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${res.statusText}`);
    return;
  }
  throw new Error(`Unknown channel: ${config.channel}`);
}
