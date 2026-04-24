import { loadSnapshot } from './snapshot';
import { searchSnapshot, formatSearchResults, SearchOptions } from './search';

export function cmdSearchUsage(): void {
  console.log(`Usage: envsnap search <snapshot-file> [options]

Options:
  --key <name>          Match exact key name (repeatable)
  --value <val>         Match exact value (repeatable)
  --key-pattern <re>    Match keys by regex
  --value-pattern <re>  Match values by regex
  --case-sensitive      Enable case-sensitive matching
  --help                Show this help
`);
}

export async function cmdSearch(args: string[]): Promise<void> {
  if (args.includes('--help') || args.length === 0) {
    cmdSearchUsage();
    return;
  }

  const file = args[0];
  const opts: SearchOptions = {
    keys: [],
    values: [],
    caseSensitive: args.includes('--case-sensitive'),
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      opts.keys!.push(args[++i]);
    } else if (args[i] === '--value' && args[i + 1]) {
      opts.values!.push(args[++i]);
    } else if (args[i] === '--key-pattern' && args[i + 1]) {
      opts.keyPattern = args[++i];
    } else if (args[i] === '--value-pattern' && args[i + 1]) {
      opts.valuePattern = args[++i];
    }
  }

  const snapshot = await loadSnapshot(file);
  const results = searchSnapshot(snapshot, opts);
  console.log(formatSearchResults(results));
}
