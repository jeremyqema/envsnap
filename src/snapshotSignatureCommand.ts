import * as fs from "fs";
import * as path from "path";
import {
  loadSignatureIndex,
  saveSignatureIndex,
  signSnapshot,
  verifySnapshot,
  removeSignature,
  listSignatures,
} from "./snapshot-signature";

export function cmdSignatureUsage(): void {
  console.log(`Usage: envsnap signature <subcommand> [options]

Subcommands:
  sign <label> <snapshotFile>      Sign a snapshot file
  verify <label> <snapshotFile>    Verify a snapshot signature
  remove <label>                   Remove a signature entry
  list                             List all signatures

Options:
  --index <path>     Path to signature index (default: .envsnap-signatures.json)
  --algo <alg>       Hash algorithm: sha256 | sha512 (default: sha256)
`);
}

export function cmdSignatureSign(
  args: string[],
  indexPath = ".envsnap-signatures.json"
): void {
  const label = args[0];
  const snapshotFile = args[1];
  const algoFlag = args.indexOf("--algo");
  const algorithm =
    algoFlag >= 0 ? (args[algoFlag + 1] as "sha256" | "sha512") : "sha256";

  if (!label || !snapshotFile) {
    console.error("sign requires <label> and <snapshotFile>");
    process.exit(1);
  }
  if (!fs.existsSync(snapshotFile)) {
    console.error(`File not found: ${snapshotFile}`);
    process.exit(1);
  }
  const content = fs.readFileSync(snapshotFile, "utf-8");
  const index = loadSignatureIndex(indexPath);
  const entry = signSnapshot(index, label, content, algorithm);
  saveSignatureIndex(indexPath, index);
  console.log(`Signed '${label}' [${entry.algorithm}]: ${entry.hash}`);
}

export function cmdSignatureVerify(
  args: string[],
  indexPath = ".envsnap-signatures.json"
): void {
  const label = args[0];
  const snapshotFile = args[1];
  if (!label || !snapshotFile) {
    console.error("verify requires <label> and <snapshotFile>");
    process.exit(1);
  }
  if (!fs.existsSync(snapshotFile)) {
    console.error(`File not found: ${snapshotFile}`);
    process.exit(1);
  }
  const content = fs.readFileSync(snapshotFile, "utf-8");
  const index = loadSignatureIndex(indexPath);
  const result = verifySnapshot(index, label, content);
  if (!result.valid) {
    if (!result.expected) {
      console.error(`No signature found for '${label}'`);
    } else {
      console.error(
        `Signature INVALID for '${label}'\n  expected: ${result.expected}\n  actual:   ${result.actual}`
      );
    }
    process.exit(1);
  }
  console.log(`Signature VALID for '${label}': ${result.expected}`);
}

export function cmdSignatureRemove(
  args: string[],
  indexPath = ".envsnap-signatures.json"
): void {
  const label = args[0];
  if (!label) {
    console.error("remove requires <label>");
    process.exit(1);
  }
  const index = loadSignatureIndex(indexPath);
  const removed = removeSignature(index, label);
  if (!removed) {
    console.error(`No signature found for '${label}'`);
    process.exit(1);
  }
  saveSignatureIndex(indexPath, index);
  console.log(`Removed signature for '${label}'`);
}

export function cmdSignatureList(
  indexPath = ".envsnap-signatures.json"
): void {
  const index = loadSignatureIndex(indexPath);
  const entries = listSignatures(index);
  if (entries.length === 0) {
    console.log("No signatures recorded.");
    return;
  }
  for (const e of entries) {
    console.log(`${e.label}  [${e.algorithm}]  ${e.hash}  (signed ${e.signedAt})`);
  }
}
