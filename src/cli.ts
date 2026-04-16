#!/usr/bin/env node
import * as path from 'path';
import { captureSnapshot, saveSnapshot } from './snapshot';

const SNAPSHOTS_DIR = path.join(process.cwd(), '.envsnap');

function printUsage(): void {
  console.log('Usage: envsnap <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  capture <label>   Capture current environment variables and save snapshot');
  console.log('');
  console.log('Examples:');
  console.log('  envsnap capture production');
  console.log('  envsnap capture staging');
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'capture': {
      const label = args[1];
      if (!label) {
        console.error('Error: label is required for capture command');
        console.error('Usage: envsnap capture <label>');
        process.exit(1);
      }
      const snapshot = captureSnapshot(label);
      const filepath = saveSnapshot(snapshot, SNAPSHOTS_DIR);
      console.log(`Snapshot saved: ${filepath}`);
      console.log(`Captured ${Object.keys(snapshot.env).length} environment variable(s).`);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
