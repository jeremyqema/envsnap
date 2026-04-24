import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadRenameIndex,
  saveRenameIndex,
  renameSnapshot,
  resolveCurrentLabel,
} from "./rename";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envsnap-rename-"));
}

describe("renameSnapshot", () => {
  it("renames the snapshot file and records history", () => {
    const dir = tmpDir();
    const indexFile = path.join(dir, ".rename-index.json");
    fs.writeFileSync(path.join(dir, "prod.json"), JSON.stringify({ env: {} }));

    renameSnapshot(dir, "prod", "prod-v2", indexFile);

    expect(fs.existsSync(path.join(dir, "prod.json"))).toBe(false);
    expect(fs.existsSync(path.join(dir, "prod-v2.json"))).toBe(true);

    const index = loadRenameIndex(indexFile);
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].oldLabel).toBe("prod");
    expect(index.entries[0].newLabel).toBe("prod-v2");
  });

  it("throws if source snapshot does not exist", () => {
    const dir = tmpDir();
    const indexFile = path.join(dir, ".rename-index.json");
    expect(() => renameSnapshot(dir, "missing", "new", indexFile)).toThrow(
      'Snapshot "missing" not found.'
    );
  });

  it("throws if destination snapshot already exists", () => {
    const dir = tmpDir();
    const indexFile = path.join(dir, ".rename-index.json");
    fs.writeFileSync(path.join(dir, "a.json"), "{}");
    fs.writeFileSync(path.join(dir, "b.json"), "{}");
    expect(() => renameSnapshot(dir, "a", "b", indexFile)).toThrow(
      'Snapshot "b" already exists.'
    );
  });
});

describe("resolveCurrentLabel", () => {
  it("returns the latest label after a chain of renames", () => {
    const dir = tmpDir();
    const indexFile = path.join(dir, ".rename-index.json");
    const index = {
      entries: [
        { oldLabel: "v1", newLabel: "v2", renamedAt: "2024-01-01T00:00:00.000Z" },
        { oldLabel: "v2", newLabel: "v3", renamedAt: "2024-01-02T00:00:00.000Z" },
      ],
    };
    saveRenameIndex(indexFile, index);
    expect(resolveCurrentLabel("v1", indexFile)).toBe("v3");
  });

  it("returns the label unchanged if no renames recorded", () => {
    const dir = tmpDir();
    const indexFile = path.join(dir, ".rename-index.json");
    expect(resolveCurrentLabel("stable", indexFile)).toBe("stable");
  });
});
