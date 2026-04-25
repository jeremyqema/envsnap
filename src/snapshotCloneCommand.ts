import { cloneSnapshot, formatCloneResult } from "./snapshot-clone";

export function cmdCloneUsage(): void {
  console.log("Usage: envsnap clone <source-file> <dest-file> [options]");
  console.log("");
  console.log("Options:");
  console.log("  --overwrite       Overwrite destination if it exists");
  console.log("  --suffix <str>    Append suffix to destination filename before extension");
  console.log("");
  console.log("Examples:");
  console.log("  envsnap clone snap-prod.json snap-staging.json");
  console.log("  envsnap clone snap-prod.json snap-prod.json --suffix -backup");
}

export function parseCloneFlags(args: string[]): {
  source: string;
  dest: string;
  overwrite: boolean;
  suffix: string | undefined;
} {
  const positional = args.filter((a) => !a.startsWith("--"));
  const source = positional[0] ?? "";
  const dest = positional[1] ?? "";
  const overwrite = args.includes("--overwrite");
  const suffixIdx = args.indexOf("--suffix");
  const suffix = suffixIdx !== -1 ? args[suffixIdx + 1] : undefined;
  return { source, dest, overwrite, suffix };
}

export function cmdClone(args: string[]): void {
  if (args.length === 0 || args.includes("--help")) {
    cmdCloneUsage();
    return;
  }

  const { source, dest, overwrite, suffix } = parseCloneFlags(args);

  if (!source || !dest) {
    console.error("Error: source and destination files are required.");
    cmdCloneUsage();
    process.exit(1);
  }

  const result = cloneSnapshot(source, dest, { overwrite, suffix });
  console.log(formatCloneResult(result));

  if (!result.success) {
    process.exit(1);
  }
}
