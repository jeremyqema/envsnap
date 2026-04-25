import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyTtlIndex,
  loadTtlIndex,
  saveTtlIndex,
  setTtl,
  removeTtl,
  getTtl,
  getExpiredLabels,
  pruneExpired,
} from "./snapshot-ttl";

function tmpFile(): string {
  return path.join(os.tmpdir(), `ttl-${Date.now()}-${Math.random()}.json`);
}

describe("snapshot-ttl", () => {
  test("emptyTtlIndex returns empty entries", () => {
    expect(emptyTtlIndex()).toEqual({ entries: [] });
  });

  test("loadTtlIndex returns empty index when file missing", () => {
    const idx = loadTtlIndex("/nonexistent/path/ttl.json");
    expect(idx).toEqual({ entries: [] });
  });

  test("saveTtlIndex and loadTtlIndex round-trip", () => {
    const f = tmpFile();
    const idx = setTtl(emptyTtlIndex(), "prod", 3600);
    saveTtlIndex(f, idx);
    const loaded = loadTtlIndex(f);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].label).toBe("prod");
    fs.unlinkSync(f);
  });

  test("setTtl adds an entry with correct expiry", () => {
    const before = Date.now();
    const idx = setTtl(emptyTtlIndex(), "staging", 60);
    const entry = getTtl(idx, "staging");
    expect(entry).toBeDefined();
    expect(entry!.expiresAt).toBeGreaterThanOrEqual(before + 60000);
  });

  test("setTtl replaces existing entry for same label", () => {
    let idx = setTtl(emptyTtlIndex(), "dev", 100);
    idx = setTtl(idx, "dev", 200);
    expect(idx.entries.filter((e) => e.label === "dev")).toHaveLength(1);
    expect(idx.entries[0].expiresAt).toBeGreaterThanOrEqual(Date.now() + 199000);
  });

  test("removeTtl removes entry", () => {
    let idx = setTtl(emptyTtlIndex(), "prod", 3600);
    idx = removeTtl(idx, "prod");
    expect(getTtl(idx, "prod")).toBeUndefined();
  });

  test("getExpiredLabels returns only expired entries", () => {
    let idx = emptyTtlIndex();
    idx = setTtl(idx, "old", -10); // already expired
    idx = setTtl(idx, "fresh", 3600);
    const expired = getExpiredLabels(idx, Date.now());
    expect(expired).toContain("old");
    expect(expired).not.toContain("fresh");
  });

  test("pruneExpired removes expired entries and returns labels", () => {
    let idx = emptyTtlIndex();
    idx = setTtl(idx, "a", -5);
    idx = setTtl(idx, "b", 3600);
    const { index: pruned, removed } = pruneExpired(idx, Date.now());
    expect(removed).toContain("a");
    expect(pruned.entries.map((e) => e.label)).not.toContain("a");
    expect(pruned.entries.map((e) => e.label)).toContain("b");
  });
});
