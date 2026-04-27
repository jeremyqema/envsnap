import {
  emptyLifecycleIndex,
  recordLifecycleEvent,
  getLifecycleHistory,
  getRecentEvents,
  clearLifecycleHistory,
  loadLifecycleIndex,
  saveLifecycleIndex,
} from "./snapshot-lifecycle";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile(): string {
  return path.join(os.tmpdir(), `lifecycle-${Date.now()}.json`);
}

test("emptyLifecycleIndex returns empty entries", () => {
  expect(emptyLifecycleIndex()).toEqual({ entries: [] });
});

test("recordLifecycleEvent adds entry", () => {
  const idx = emptyLifecycleIndex();
  const entry = recordLifecycleEvent(idx, "snap1", "created", "alice", "initial");
  expect(idx.entries).toHaveLength(1);
  expect(entry.label).toBe("snap1");
  expect(entry.event).toBe("created");
  expect(entry.actor).toBe("alice");
  expect(entry.note).toBe("initial");
  expect(entry.timestamp).toBeTruthy();
});

test("recordLifecycleEvent without actor/note", () => {
  const idx = emptyLifecycleIndex();
  const entry = recordLifecycleEvent(idx, "snap2", "archived");
  expect(entry.actor).toBeUndefined();
  expect(entry.note).toBeUndefined();
});

test("getLifecycleHistory filters by label", () => {
  const idx = emptyLifecycleIndex();
  recordLifecycleEvent(idx, "snap1", "created");
  recordLifecycleEvent(idx, "snap2", "updated");
  recordLifecycleEvent(idx, "snap1", "archived");
  expect(getLifecycleHistory(idx, "snap1")).toHaveLength(2);
  expect(getLifecycleHistory(idx, "snap2")).toHaveLength(1);
});

test("getRecentEvents returns sorted by timestamp desc", () => {
  const idx = emptyLifecycleIndex();
  recordLifecycleEvent(idx, "a", "created");
  recordLifecycleEvent(idx, "b", "updated");
  recordLifecycleEvent(idx, "c", "deleted");
  const recent = getRecentEvents(idx, 2);
  expect(recent).toHaveLength(2);
  expect(recent[0].timestamp >= recent[1].timestamp).toBe(true);
});

test("clearLifecycleHistory removes entries for label", () => {
  const idx = emptyLifecycleIndex();
  recordLifecycleEvent(idx, "snap1", "created");
  recordLifecycleEvent(idx, "snap2", "created");
  clearLifecycleHistory(idx, "snap1");
  expect(getLifecycleHistory(idx, "snap1")).toHaveLength(0);
  expect(getLifecycleHistory(idx, "snap2")).toHaveLength(1);
});

test("loadLifecycleIndex returns empty for missing file", () => {
  expect(loadLifecycleIndex("/nonexistent/path.json")).toEqual({ entries: [] });
});

test("saveLifecycleIndex and loadLifecycleIndex roundtrip", () => {
  const file = tmpFile();
  const idx = emptyLifecycleIndex();
  recordLifecycleEvent(idx, "snap1", "locked", "bob");
  saveLifecycleIndex(file, idx);
  const loaded = loadLifecycleIndex(file);
  expect(loaded.entries).toHaveLength(1);
  expect(loaded.entries[0].actor).toBe("bob");
  fs.unlinkSync(file);
});
