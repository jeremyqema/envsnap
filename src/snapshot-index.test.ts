import { describe, it, expect } from "vitest";
import {
  emptyIndex,
  addEntry,
  removeEntry,
  findEntry,
  listEntries,
  formatIndex,
  loadIndex,
  saveIndex,
} from "./snapshot-index";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile() {
  return path.join(os.tmpdir(), `envsnap-idx-test-${Date.now()}.json`);
}

describe("snapshot-index", () => {
  it("starts empty", () => {
    expect(emptyIndex().entries).toHaveLength(0);
  });

  it("adds an entry", () => {
    const idx = addEntry(emptyIndex(), { label: "prod", file: "prod.json", createdAt: "2024-01-01T00:00:00Z" });
    expect(idx.entries).toHaveLength(1);
    expect(idx.entries[0].label).toBe("prod");
  });

  it("updates existing entry on add", () => {
    let idx = addEntry(emptyIndex(), { label: "prod", file: "old.json", createdAt: "2024-01-01T00:00:00Z" });
    idx = addEntry(idx, { label: "prod", file: "new.json", createdAt: "2024-02-01T00:00:00Z" });
    expect(idx.entries).toHaveLength(1);
    expect(idx.entries[0].file).toBe("new.json");
  });

  it("removes an entry", () => {
    let idx = addEntry(emptyIndex(), { label: "prod", file: "prod.json", createdAt: "2024-01-01T00:00:00Z" });
    idx = removeEntry(idx, "prod");
    expect(idx.entries).toHaveLength(0);
  });

  it("finds an entry by label", () => {
    const idx = addEntry(emptyIndex(), { label: "staging", file: "s.json", createdAt: "2024-01-01T00:00:00Z" });
    expect(findEntry(idx, "staging")?.file).toBe("s.json");
    expect(findEntry(idx, "missing")).toBeUndefined();
  });

  it("lists entries filtered by tag", () => {
    let idx = addEntry(emptyIndex(), { label: "a", file: "a.json", createdAt: "t", tags: ["prod"] });
    idx = addEntry(idx, { label: "b", file: "b.json", createdAt: "t", tags: ["dev"] });
    expect(listEntries(idx, "prod")).toHaveLength(1);
    expect(listEntries(idx, "prod")[0].label).toBe("a");
    expect(listEntries(idx)).toHaveLength(2);
  });

  it("formats index as readable string", () => {
    const idx = addEntry(emptyIndex(), { label: "prod", file: "p.json", createdAt: "2024-01-01T00:00:00Z", tags: ["live"], description: "production" });
    const out = formatIndex(idx.entries);
    expect(out).toContain("prod");
    expect(out).toContain("live");
    expect(out).toContain("production");
  });

  it("formats empty index", () => {
    expect(formatIndex([])).toBe("No snapshots indexed.");
  });

  it("persists and loads index from disk", () => {
    const f = tmpFile();
    try {
      const idx = addEntry(emptyIndex(), { label: "x", file: "x.json", createdAt: "t" });
      saveIndex(f, idx);
      const loaded = loadIndex(f);
      expect(loaded.entries[0].label).toBe("x");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("returns empty index for missing file", () => {
    expect(loadIndex("/nonexistent/path/index.json").entries).toHaveLength(0);
  });
});
