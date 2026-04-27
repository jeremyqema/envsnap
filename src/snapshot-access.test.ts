import { describe, it, expect } from "vitest";
import {
  emptyAccessIndex,
  recordAccess,
  getAccessHistory,
  getRecentAccess,
  clearAccessHistory,
  loadAccessIndex,
  saveAccessIndex,
} from "./snapshot-access";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile(): string {
  return path.join(os.tmpdir(), `access-test-${Date.now()}.json`);
}

describe("snapshot-access", () => {
  it("emptyAccessIndex returns empty entries", () => {
    expect(emptyAccessIndex()).toEqual({ entries: [] });
  });

  it("recordAccess adds an entry", () => {
    let idx = emptyAccessIndex();
    idx = recordAccess(idx, "prod-2024", "read");
    expect(idx.entries).toHaveLength(1);
    expect(idx.entries[0].label).toBe("prod-2024");
    expect(idx.entries[0].action).toBe("read");
    expect(idx.entries[0].accessedAt).toBeTruthy();
  });

  it("recordAccess does not mutate original", () => {
    const original = emptyAccessIndex();
    recordAccess(original, "x", "write");
    expect(original.entries).toHaveLength(0);
  });

  it("recordAccess stores a valid ISO timestamp", () => {
    let idx = emptyAccessIndex();
    const before = new Date().toISOString();
    idx = recordAccess(idx, "prod", "read");
    const after = new Date().toISOString();
    const { accessedAt } = idx.entries[0];
    expect(accessedAt >= before).toBe(true);
    expect(accessedAt <= after).toBe(true);
  });

  it("getAccessHistory filters by label", () => {
    let idx = emptyAccessIndex();
    idx = recordAccess(idx, "prod", "read");
    idx = recordAccess(idx, "staging", "write");
    idx = recordAccess(idx, "prod", "delete");
    const history = getAccessHistory(idx, "prod");
    expect(history).toHaveLength(2);
    expect(history.every((e) => e.label === "prod")).toBe(true);
  });

  it("getRecentAccess returns sorted by date descending", () => {
    let idx = emptyAccessIndex();
    idx = recordAccess(idx, "a", "read");
    idx = recordAccess(idx, "b", "write");
    idx = recordAccess(idx, "c", "delete");
    const recent = getRecentAccess(idx, 2);
    expect(recent).toHaveLength(2);
  });

  it("clearAccessHistory removes entries for label", () => {
    let idx = emptyAccessIndex();
    idx = recordAccess(idx, "prod", "read");
    idx = recordAccess(idx, "staging", "write");
    idx = clearAccessHistory(idx, "prod");
    expect(getAccessHistory(idx, "prod")).toHaveLength(0);
    expect(getAccessHistory(idx, "staging")).toHaveLength(1);
  });

  it("loadAccessIndex returns empty index for missing file", () => {
    const idx = loadAccessIndex("/nonexistent/path.json");
    expect(idx).toEqual(emptyAccessIndex());
  });

  it("saveAccessIndex and loadAccessIndex round-trip", () => {
    const file = tmpFile();
    try {
      let idx = emptyAccessIndex();
      idx = recordAccess(idx, "prod", "read");
      saveAccessIndex(file, idx);
      const loaded = loadAccessIndex(file);
      expect(loaded.entries).toHaveLength(1);
      expect(loaded.entries[0].label).toBe("prod");
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });
});
