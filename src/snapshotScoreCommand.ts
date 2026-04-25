import { loadSnapshot } from './snapshot';
import { diffSnapshots } from './diff';
import { scoreSnapshot, formatScore, ScoreWeights } from './snapshot-score';

export function cmdScoreUsage(): void {
  console.log(
    'Usage: envsnap score <snapshot-a> <snapshot-b> [options]\n' +
    'Options:\n' +
    '  --weight-added=<n>    Weight for added keys   (default 1)\n' +
    '  --weight-removed=<n>  Weight for removed keys (default 2)\n' +
    '  --weight-changed=<n>  Weight for changed keys (default 1.5)\n' +
    '  --json                Output raw JSON'
  );
}

function parseWeight(flags: Record<string, string>, key: string, fallback: number): number {
  const raw = flags[key];
  if (raw === undefined) return fallback;
  const n = parseFloat(raw);
  return isNaN(n) ? fallback : n;
}

export async function cmdScore(args: string[]): Promise<void> {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      flags[k] = v ?? 'true';
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    cmdScoreUsage();
    process.exit(1);
  }

  const [labelA, labelB] = positional;

  const snapshotA = await loadSnapshot(labelA);
  const snapshotB = await loadSnapshot(labelB);

  const diff = diffSnapshots(snapshotA, snapshotB);
  const baseSize = Object.keys(snapshotA.env).length;

  const weights: ScoreWeights = {
    added: parseWeight(flags, 'weight-added', 1),
    removed: parseWeight(flags, 'weight-removed', 2),
    changed: parseWeight(flags, 'weight-changed', 1.5),
  };

  const score = scoreSnapshot(diff, baseSize, weights);

  if (flags['json'] === 'true') {
    console.log(JSON.stringify(score, null, 2));
  } else {
    console.log(`Comparing '${labelA}' → '${labelB}'\n`);
    console.log(formatScore(score));
  }
}
