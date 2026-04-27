import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdLifecycleRecord,
  cmdLifecycleHistory,
  cmdLifecycleRecent,
  cmdLifecycleClear,
} from "./snapshotLifecycleCommand";
import { loadLifecycleIndex } from "./snapshot-lifecycle";

function tmpFile(): string {
  return path.join(os.tmpdir(), `lc-cmd-${Date.now()}.json`);
}

test("cmdLifecycleRecord writes entry to file", () => {
  const file = tmpFile();
  cmdLifecycleRecord(["snap1", "created", "--actor", "ci", "--note", "deploy"], file);
  const idx = loadLifecycleIndex(file);
  expect(idx.entries).toHaveLength(1);
  expect(idx.entries[0].label).toBe("snap1");
  expect(idx.entries[0].event).toBe("created");
  expect(idx.entries[0].actor).toBe("ci");
  expect(idx.entries[0].note).toBe("deploy");
  fs.unlinkSync(file);
});

test("cmdLifecycleRecord without optional flags", () => {
  const file = tmpFile();
  cmdLifecycleRecord(["snap2", "updated"], file);
  const idx = loadLifecycleIndex(file);
  expect(idx.entries[0].actor).toBeUndefined();
  fs.unlinkSync(file);
});

test("cmdLifecycleHistory prints entries (no throw)", () => {
  const file = tmpFile();
  cmdLifecycleRecord(["snap1", "created"], file);
  cmdLifecycleRecord(["snap1", "archived"], file);
  expect(() => cmdLifecycleHistory(["snap1"], file)).not.toThrow();
  fs.unlinkSync(file);
});

test("cmdLifecycleHistory prints message when empty", () => {
  const file = tmpFile();
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  cmdLifecycleHistory(["ghost"], file);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining("No lifecycle history"));
  spy.mockRestore();
});

test("cmdLifecycleRecent prints recent events", () => {
  const file = tmpFile();
  cmdLifecycleRecord(["snap1", "created"], file);
  cmdLifecycleRecord(["snap2", "updated"], file);
  expect(() => cmdLifecycleRecent(["--limit", "5"], file)).not.toThrow();
  fs.unlinkSync(file);
});

test("cmdLifecycleClear removes entries for label", () => {
  const file = tmpFile();
  cmdLifecycleRecord(["snap1", "created"], file);
  cmdLifecycleRecord(["snap2", "created"], file);
  cmdLifecycleClear(["snap1"], file);
  const idx = loadLifecycleIndex(file);
  expect(idx.entries.filter((e) => e.label === "snap1")).toHaveLength(0);
  expect(idx.entries.filter((e) => e.label === "snap2")).toHaveLength(1);
  fs.unlinkSync(file);
});
