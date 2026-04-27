import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface ShareToken {
  token: string;
  label: string;
  createdAt: string;
  expiresAt: string | null;
  readOnly: boolean;
}

export interface ShareIndex {
  tokens: Record<string, ShareToken>;
}

export function emptyShareIndex(): ShareIndex {
  return { tokens: {} };
}

export function loadShareIndex(indexPath: string): ShareIndex {
  if (!fs.existsSync(indexPath)) return emptyShareIndex();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as ShareIndex;
}

export function saveShareIndex(indexPath: string, index: ShareIndex): void {
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

export function createShareToken(
  index: ShareIndex,
  label: string,
  ttlSeconds: number | null = null,
  readOnly = true
): ShareToken {
  const token = crypto.randomBytes(24).toString("hex");
  const createdAt = new Date().toISOString();
  const expiresAt = ttlSeconds
    ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
    : null;
  const entry: ShareToken = { token, label, createdAt, expiresAt, readOnly };
  index.tokens[token] = entry;
  return entry;
}

export function revokeShareToken(index: ShareIndex, token: string): boolean {
  if (!index.tokens[token]) return false;
  delete index.tokens[token];
  return true;
}

export function resolveShareToken(
  index: ShareIndex,
  token: string
): ShareToken | null {
  const entry = index.tokens[token];
  if (!entry) return null;
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) return null;
  return entry;
}

export function listShareTokens(index: ShareIndex): ShareToken[] {
  return Object.values(index.tokens);
}

export function pruneExpiredTokens(index: ShareIndex): number {
  const now = new Date();
  let pruned = 0;
  for (const [token, entry] of Object.entries(index.tokens)) {
    if (entry.expiresAt && new Date(entry.expiresAt) < now) {
      delete index.tokens[token];
      pruned++;
    }
  }
  return pruned;
}
