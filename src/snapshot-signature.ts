import * as crypto from "crypto";
import * as fs from "fs";

export interface SignatureEntry {
  label: string;
  hash: string;
  algorithm: string;
  signedAt: string;
}

export interface SignatureIndex {
  signatures: Record<string, SignatureEntry>;
}

export function emptySignatureIndex(): SignatureIndex {
  return { signatures: {} };
}

export function loadSignatureIndex(indexPath: string): SignatureIndex {
  if (!fs.existsSync(indexPath)) return emptySignatureIndex();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as SignatureIndex;
}

export function saveSignatureIndex(indexPath: string, index: SignatureIndex): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function computeHash(
  content: string,
  algorithm: "sha256" | "sha512" = "sha256"
): string {
  return crypto.createHash(algorithm).update(content).digest("hex");
}

export function signSnapshot(
  index: SignatureIndex,
  label: string,
  content: string,
  algorithm: "sha256" | "sha512" = "sha256"
): SignatureEntry {
  const hash = computeHash(content, algorithm);
  const entry: SignatureEntry = {
    label,
    hash,
    algorithm,
    signedAt: new Date().toISOString(),
  };
  index.signatures[label] = entry;
  return entry;
}

export function verifySnapshot(
  index: SignatureIndex,
  label: string,
  content: string
): { valid: boolean; expected?: string; actual?: string } {
  const entry = index.signatures[label];
  if (!entry) return { valid: false };
  const actual = computeHash(content, entry.algorithm as "sha256" | "sha512");
  return {
    valid: actual === entry.hash,
    expected: entry.hash,
    actual,
  };
}

export function removeSignature(index: SignatureIndex, label: string): boolean {
  if (!index.signatures[label]) return false;
  delete index.signatures[label];
  return true;
}

export function listSignatures(index: SignatureIndex): SignatureEntry[] {
  return Object.values(index.signatures);
}
