import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyShareIndex,
  loadShareIndex,
  saveShareIndex,
  createShareToken,
  revokeShareToken,
  resolveShareToken,
  listShareTokens,
  pruneExpiredTokens,
} from "./snapshot-share";

function tmpFile(): string {
  return path.join(os.tmpdir(), `share-test-${Date.now()}-${Math.random()}.json`);
}

describe("snapshot-share", () => {
  test("emptyShareIndex returns empty tokens", () => {
    expect(emptyShareIndex()).toEqual({ tokens: {} });
  });

  test("loadShareIndex returns empty when file missing", () => {
    const idx = loadShareIndex("/nonexistent/path/index.json");
    expect(idx).toEqual({ tokens: {} });
  });

  test("saveShareIndex and loadShareIndex round-trip", () => {
    const p = tmpFile();
    const index = emptyShareIndex();
    createShareToken(index, "prod", null, true);
    saveShareIndex(p, index);
    const loaded = loadShareIndex(p);
    expect(Object.keys(loaded.tokens)).toHaveLength(1);
    fs.unlinkSync(p);
  });

  test("createShareToken generates unique token with correct fields", () => {
    const index = emptyShareIndex();
    const t = createShareToken(index, "staging", 3600, true);
    expect(t.token).toHaveLength(48);
    expect(t.label).toBe("staging");
    expect(t.readOnly).toBe(true);
    expect(t.expiresAt).not.toBeNull();
    expect(index.tokens[t.token]).toBeDefined();
  });

  test("createShareToken with null ttl sets expiresAt null", () => {
    const index = emptyShareIndex();
    const t = createShareToken(index, "dev", null);
    expect(t.expiresAt).toBeNull();
  });

  test("revokeShareToken removes token", () => {
    const index = emptyShareIndex();
    const t = createShareToken(index, "prod");
    expect(revokeShareToken(index, t.token)).toBe(true);
    expect(index.tokens[t.token]).toBeUndefined();
  });

  test("revokeShareToken returns false for unknown token", () => {
    const index = emptyShareIndex();
    expect(revokeShareToken(index, "ghost")).toBe(false);
  });

  test("resolveShareToken returns entry for valid token", () => {
    const index = emptyShareIndex();
    const t = createShareToken(index, "prod");
    const resolved = resolveShareToken(index, t.token);
    expect(resolved).not.toBeNull();
    expect(resolved?.label).toBe("prod");
  });

  test("resolveShareToken returns null for expired token", () => {
    const index = emptyShareIndex();
    const t = createShareToken(index, "prod", -1);
    const resolved = resolveShareToken(index, t.token);
    expect(resolved).toBeNull();
  });

  test("listShareTokens returns all tokens", () => {
    const index = emptyShareIndex();
    createShareToken(index, "a");
    createShareToken(index, "b");
    expect(listShareTokens(index)).toHaveLength(2);
  });

  test("pruneExpiredTokens removes only expired", () => {
    const index = emptyShareIndex();
    createShareToken(index, "live", 9999);
    createShareToken(index, "dead", -1);
    const count = pruneExpiredTokens(index);
    expect(count).toBe(1);
    expect(listShareTokens(index)).toHaveLength(1);
    expect(listShareTokens(index)[0].label).toBe("live");
  });
});
