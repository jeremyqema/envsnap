import * as path from "path";
import {
  loadShareIndex,
  saveShareIndex,
  createShareToken,
  revokeShareToken,
  resolveShareToken,
  listShareTokens,
  pruneExpiredTokens,
} from "./snapshot-share";

const DEFAULT_INDEX = path.join(".envsnap", "share-index.json");

export function cmdShareUsage(): void {
  console.log(
    "Usage: envsnap share <create|revoke|show|list|prune> [options]\n" +
      "  create <label> [--ttl <seconds>] [--rw]  Create a share token for a snapshot label\n" +
      "  revoke <token>                            Revoke an existing share token\n" +
      "  show <token>                              Show details for a share token\n" +
      "  list                                      List all active share tokens\n" +
      "  prune                                     Remove expired share tokens"
  );
}

export function cmdShareCreate(
  args: string[],
  indexPath = DEFAULT_INDEX
): void {
  const label = args[0];
  if (!label) {
    console.error("Error: label required");
    process.exit(1);
  }
  const ttlIdx = args.indexOf("--ttl");
  const ttl = ttlIdx !== -1 ? parseInt(args[ttlIdx + 1], 10) : null;
  const readOnly = !args.includes("--rw");
  const index = loadShareIndex(indexPath);
  const token = createShareToken(index, label, ttl, readOnly);
  saveShareIndex(indexPath, index);
  console.log(`Token:     ${token.token}`);
  console.log(`Label:     ${token.label}`);
  console.log(`ReadOnly:  ${token.readOnly}`);
  console.log(`Created:   ${token.createdAt}`);
  console.log(`Expires:   ${token.expiresAt ?? "never"}`);
}

export function cmdShareRevoke(
  args: string[],
  indexPath = DEFAULT_INDEX
): void {
  const token = args[0];
  if (!token) { console.error("Error: token required"); process.exit(1); }
  const index = loadShareIndex(indexPath);
  const ok = revokeShareToken(index, token);
  if (!ok) { console.error("Token not found"); process.exit(1); }
  saveShareIndex(indexPath, index);
  console.log(`Revoked token ${token}`);
}

export function cmdShareShow(args: string[], indexPath = DEFAULT_INDEX): void {
  const token = args[0];
  if (!token) { console.error("Error: token required"); process.exit(1); }
  const index = loadShareIndex(indexPath);
  const entry = resolveShareToken(index, token);
  if (!entry) { console.error("Token not found or expired"); process.exit(1); }
  console.log(JSON.stringify(entry, null, 2));
}

export function cmdShareList(indexPath = DEFAULT_INDEX): void {
  const index = loadShareIndex(indexPath);
  const tokens = listShareTokens(index);
  if (tokens.length === 0) { console.log("No share tokens found."); return; }
  for (const t of tokens) {
    const exp = t.expiresAt ?? "never";
    console.log(`${t.token}  label=${t.label}  expires=${exp}  readOnly=${t.readOnly}`);
  }
}

export function cmdSharePrune(indexPath = DEFAULT_INDEX): void {
  const index = loadShareIndex(indexPath);
  const count = pruneExpiredTokens(index);
  saveShareIndex(indexPath, index);
  console.log(`Pruned ${count} expired token(s).`);
}
