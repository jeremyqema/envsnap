import { describe, it, expect } from "vitest";
import {
  emptyMetaIndex,
  setMeta,
  getMeta,
  removeMeta,
  listMeta,
  loadMetaIndex,
  saveMetaIndex,
} from "./snapshot-meta";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile(): string {
  return path.join(os.tmpdir(), `meta-${Date.now()}-${Math.random()}.json`);
}

describe("emptyMetaIndex", () => {
  it("returns empty object", () => {
    expect(emptyMetaIndex()).toEqual({});
  });
});

describe("setMeta / getMeta", () => {
  it("sets and retrieves metadata", () => {
    let idx = emptyMetaIndex();
    idx = setMeta(idx, "prod-v1", { description: "Production snapshot", author: "alice" });
    const m = getMeta(idx, "prod-v1");
    expect(m?.label).toBe("prod-v1");
    expect(m?.description).toBe("Production snapshot");
    expect(m?.author).toBe("alice");
    expect(m?.createdAt).toBeTruthy();
  });

  it("preserves createdAt on update", () => {
    let idx = emptyMetaIndex();
    idx = setMeta(idx, "snap", { author: "bob" });
    const first = getMeta(idx, "snap")!.createdAt;
    idx = setMeta(idx, "snap", { author: "carol" });
    expect(getMeta(idx, "snap")!.createdAt).toBe(first);
    expect(getMeta(idx, "snap")!.author).toBe("carol");
  });
});

describe("removeMeta", () => {
  it("removes an entry", () => {
    let idx = emptyMetaIndex();
    idx = setMeta(idx, "snap", {});
    idx = removeMeta(idx, "snap");
    expect(getMeta(idx, "snap")).toBeUndefined();
  });

  it("is a no-op for missing label", () => {
    const idx = emptyMetaIndex();
    expect(() => removeMeta(idx, "nonexistent")).not.toThrow();
  });
});

describe("listMeta", () => {
  it("returns entries sorted by createdAt", () => {
    let idx = emptyMetaIndex();
    idx = setMeta(idx, "b", {});
    idx = setMeta(idx, "a", {});
    const labels = listMeta(idx).map((e) => e.label);
    expect(labels).toContain("a");
    expect(labels).toContain("b");
  });
});

describe("loadMetaIndex / saveMetaIndex", () => {
  it("round-trips to disk", () => {
    const file = tmpFile();
    try {
      let idx = emptyMetaIndex();
      idx = setMeta(idx, "snap1", { description: "hello" });
      saveMetaIndex(file, idx);
      const loaded = loadMetaIndex(file);
      expect(getMeta(loaded, "snap1")?.description).toBe("hello");
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("returns empty index for missing file", () => {
    expect(loadMetaIndex("/nonexistent/path/meta.json")).toEqual({});
  });
});
