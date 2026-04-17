import { compareAndPrint } from './compare';

function printUsage(): void {
  console.log('Usage: envsnap compare <snapshotA> <snapshotB> [options]');
  console.log('Options:');
  console.log('  --filter <path>   Path to filter config file');
  console.log('  --redact          Redact sensitive values');
  console.log('  --json            Output diff as JSON');
}

export async function cmdCompare(args: string[]): Promise<void> {
  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const [pathA, pathB, ...flags] = args;

  const filterIdx = flags.indexOf('--filter');
  const filterConfigPath =
    filterIdx !== -1 ? flags[filterIdx + 1] : undefined;

  const redact = flags.includes('--redact');
  const outputFormat = flags.includes('--json') ? 'json' : 'text';

  try {
    await compareAndPrint(pathA, pathB, {
      filterConfigPath,
      redact,
      outputFormat,
    });
  } catch (err) {
    console.error('Error comparing snapshots:', (err as Error).message);
    process.exit(1);
  }
}
