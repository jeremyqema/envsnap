import { loadHistory, findEntry } from './history';
import { diffSnapshots } from './diff';
import { buildPayload, sendNotification, NotifyConfig, NotifyChannel } from './notify';

function parseChannel(val: string | undefined): NotifyChannel {
  if (val === 'webhook') return 'webhook';
  return 'console';
}

export async function cmdNotifyDiff(
  historyFile: string,
  labelA: string,
  labelB: string,
  argv: string[]
): Promise<void> {
  const history = await loadHistory(historyFile);
  const entryA = findEntry(history, labelA);
  const entryB = findEntry(history, labelB);
  if (!entryA) throw new Error(`Label not found: ${labelA}`);
  if (!entryB) throw new Error(`Label not found: ${labelB}`);

  const diff = diffSnapshots(entryA.snapshot, entryB.snapshot);

  const channel = parseChannel(argv.find(a => a.startsWith('--channel='))?.split('=')[1]);
  const webhookUrl = argv.find(a => a.startsWith('--webhook='))?.split('=')[1];

  const config: NotifyConfig = { channel, webhookUrl };
  const payload = buildPayload(`${labelA}..${labelB}`, diff);
  await sendNotification(config, payload);
}

export function cmdNotifyUsage(): void {
  console.log('Usage: envsnap notify <labelA> <labelB> [--channel=console|webhook] [--webhook=<url>]');
}
