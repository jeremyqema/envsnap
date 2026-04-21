import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { restoreSnapshot, listRestorableSnapshots } from "./restore";
import { saveHistory } from "./history";
import { saveSnapshot, loadSnapshot } from "./snapshot";

function tmpFile(suffix = ".json"): string {
  return path.join(os.tmpdir(), `envsnap-restore-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);
}

describe("restoreSnapshot", () => {
  it("returns error when label not found", () => {
    const histFile = tmpFile();
    saveHistory(histFile, { entries: [] });
    const result = restoreSnapshot(histFile, "nonexistent", tmpFile());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/No history entry found/);
    fs.unlinkSync(histFile);
  });

  it("returns error when snapshot file missing", () => {
    const histFile = tmpFile();
    const ghostFile = tmpFile();
    saveHistory(histFile, {
      entries: [{ label: "v1", file: ghostFile, timestamp: new Date().toISOString() }],
    });
    const result = restoreSnapshot(histFile, "v1", tmpFile());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Snapshot file not found/);
    fs.unlinkSync(histFile);
  });

  it("restores snapshot to target file", () => {
    const histFile = tmpFile();
    const snapFile = tmpFile();
    const targetFile = tmpFile();
    const snapshot = { timestamp: new Date().toISOString(), env: { FOO: "bar", BAZ: "qux" } };
    saveSnapshot(snapshot, snapFile);
    saveHistory(histFile, {
      entries: [{ label: "prod-v2", file: snapFile, timestamp: snapshot.timestamp }],
    });
    const result = restoreSnapshot(histFile, "prod-v2", targetFile);
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Successfully restored/);
    const restored = loadSnapshot(targetFile);
    expect(restored.env).toEqual({ FOO: "bar", BAZ: "qux" });
    fs.unlinkSync(histFile);
    fs.unlinkSync(snapFile);
    fs.unlinkSync(targetFile);
  });

  it("captures previous snapshot before overwrite", () => {
    const histFile = tmpFile();
    const snapFile = tmpFile();
    const targetFile = tmpFile();
    const oldSnap = { timestamp: new Date().toISOString(), env: { OLD: "value" } };
    const newSnap = { timestamp: new Date().toISOString(), env: { NEW: "value" } };
    saveSnapshot(oldSnap, targetFile);
    saveSnapshot(newSnap, snapFile);
    saveHistory(histFile, {
      entries: [{ label: "new-label", file: snapFile, timestamp: newSnap.timestamp }],
    });
    const result = restoreSnapshot(histFile, "new-label", targetFile);
    expect(result.success).toBe(true);
    expect(result.previousSnapshot?.env).toEqual({ OLD: "value" });
    [histFile, snapFile, targetFile].forEach((f) => fs.unlinkSync(f));
  });
});

describe("listRestorableSnapshots", () => {
  it("returns only entries whose files exist", () => {
    const histFile = tmpFile();
    const existingSnap = tmpFile();
    saveSnapshot({ timestamp: new Date().toISOString(), env: {} }, existingSnap);
    saveHistory(histFile, {
      entries: [
        { label: "exists", file: existingSnap, timestamp: new Date().toISOString() },
        { label: "missing", file: "/tmp/does-not-exist-envsnap.json", timestamp: new Date().toISOString() },
      ],
    });
    const restorable = listRestorableSnapshots(histFile);
    expect(restorable).toHaveLength(1);
    expect(restorable[0].label).toBe("exists");
    fs.unlinkSync(histFile);
    fs.unlinkSync(existingSnap);
  });
});
