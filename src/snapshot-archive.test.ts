import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyArchiveIndex,
  archiveSnapshot,
  unarchiveSnapshot,
  isArchived,
  listArchived,
  loadArchiveIndex,
  saveArchiveIndex,
} from "./snapshot-archive";

function tmpFile(): string {
  return path.join(os.tmpdir(), `archive-test-${Date.now()}-${Math.random()}.json`);
}

describe("archiveSnapshot", () => {
  it("adds an entry to the index", () => {
    const index = emptyArchiveIndex();
    const updated = archiveSnapshot(index, "snap-1", "deprecated");
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].label).toBe("snap-1");
    expect(updated.entries[0].reason).toBe("deprecated");
  });

  it("throws if snapshot is already archived", () => {
    const index = emptyArchiveIndex();
    const updated = archiveSnapshot(index, "snap-1");
    expect(() => archiveSnapshot(updated, "snap-1")).toThrow();
  });

  it("stores archivedAt as ISO string", () => {
    const before = Date.now();
    const updated = archiveSnapshot(emptyArchiveIndex(), "snap-x");
    const after = Date.now();
    const ts = new Date(updated.entries[0].archivedAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("unarchiveSnapshot", () => {
  it("removes an archived entry", () => {
    let index = emptyArchiveIndex();
    index = archiveSnapshot(index, "snap-2");
    const updated = unarchiveSnapshot(index, "snap-2");
    expect(updated.entries).toHaveLength(0);
  });

  it("throws if snapshot is not archived", () => {
    expect(() => unarchiveSnapshot(emptyArchiveIndex(), "missing")).toThrow();
  });
});

describe("isArchived", () => {
  it("returns true for archived labels", () => {
    const index = archiveSnapshot(emptyArchiveIndex(), "snap-3");
    expect(isArchived(index, "snap-3")).toBe(true);
  });

  it("returns false for non-archived labels", () => {
    expect(isArchived(emptyArchiveIndex(), "snap-3")).toBe(false);
  });
});

describe("listArchived", () => {
  it("returns all archived entries", () => {
    let index = emptyArchiveIndex();
    index = archiveSnapshot(index, "a");
    index = archiveSnapshot(index, "b");
    const list = listArchived(index);
    expect(list.map((e) => e.label)).toEqual(["a", "b"]);
  });
});

describe("loadArchiveIndex / saveArchiveIndex", () => {
  it("round-trips through disk", () => {
    const file = tmpFile();
    try {
      let index = emptyArchiveIndex();
      index = archiveSnapshot(index, "snap-disk", "test");
      saveArchiveIndex(file, index);
      const loaded = loadArchiveIndex(file);
      expect(loaded.entries).toHaveLength(1);
      expect(loaded.entries[0].label).toBe("snap-disk");
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("returns empty index when file does not exist", () => {
    const index = loadArchiveIndex("/nonexistent/path/archive.json");
    expect(index.entries).toHaveLength(0);
  });
});
