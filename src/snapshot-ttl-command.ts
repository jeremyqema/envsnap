import { loadTtlIndex, saveTtlIndex, setTtl, removeTtl, getExpired, getTtl } from './snapshot-ttl';

export function cmdTtlUsage(): void {
  console.log(`
Usage: envsnap ttl <subcommand> [options]

Subcommands:
  set <label> <seconds>   Set TTL for a snapshot (seconds until expiry)
  remove <label>          Remove TTL from a snapshot
  show <label>            Show TTL info for a snapshot
  list-expired <file>     List all expired snapshots

Examples:
  envsnap ttl set prod 86400
  envsnap ttl remove prod
  envsnap ttl show prod
  envsnap ttl list-expired ./ttl-index.json
`);
}

export async function cmdTtlSet(args: string[], indexFile: string): Promise<void> {
  const [label, secondsStr] = args;
  if (!label || !secondsStr) {
    console.error('Usage: envsnap ttl set <label> <seconds>');
    process.exit(1);
  }
  const seconds = parseInt(secondsStr, 10);
  if (isNaN(seconds) || seconds <= 0) {
    console.error('Error: seconds must be a positive integer');
    process.exit(1);
  }
  const index = await loadTtlIndex(indexFile);
  const updated = setTtl(index, label, seconds);
  await saveTtlIndex(indexFile, updated);
  const expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
  console.log(`TTL set for "${label}": expires at ${expiresAt}`);
}

export async function cmdTtlRemove(args: string[], indexFile: string): Promise<void> {
  const [label] = args;
  if (!label) {
    console.error('Usage: envsnap ttl remove <label>');
    process.exit(1);
  }
  const index = await loadTtlIndex(indexFile);
  const updated = removeTtl(index, label);
  await saveTtlIndex(indexFile, updated);
  console.log(`TTL removed for "${label}"`);
}

export async function cmdTtlShow(args: string[], indexFile: string): Promise<void> {
  const [label] = args;
  if (!label) {
    console.error('Usage: envsnap ttl show <label>');
    process.exit(1);
  }
  const index = await loadTtlIndex(indexFile);
  const entry = getTtl(index, label);
  if (!entry) {
    console.log(`No TTL set for "${label}"`);
    return;
  }
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((entry.expiresAt - now) / 1000));
  const expired = entry.expiresAt <= now;
  console.log(`Label:      ${label}`);
  console.log(`Expires at: ${new Date(entry.expiresAt).toISOString()}`);
  console.log(`Status:     ${expired ? 'EXPIRED' : `active (${remaining}s remaining)`}`);
}

export async function cmdTtlListExpired(indexFile: string): Promise<void> {
  const index = await loadTtlIndex(indexFile);
  const expired = getExpired(index);
  if (expired.length === 0) {
    console.log('No expired snapshots found.');
    return;
  }
  console.log('Expired snapshots:');
  for (const label of expired) {
    const entry = getTtl(index, label)!;
    console.log(`  ${label}  (expired at ${new Date(entry.expiresAt).toISOString()})`);
  }
}
