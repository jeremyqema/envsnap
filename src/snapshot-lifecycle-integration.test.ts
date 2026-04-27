import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadLifecycleIndex,
  saveLifecycleIndex,
  recordLifecycleEvent,
  getLifecycleHistory,
  getRecentEvents,
} from "./snapshot-lifecycle";

function tmpFile(): string {
  return path.join(os.tmpdir(), `lc-int-${Date.now()}.json`);
}

test("full lifecycle workflow for a snapshot", () => {
  const file = tmpFile();
  const idx = loadLifecycleIndex(file);

  recordLifecycleEvent(idx, "prod-v1", "created", "deploy-bot", "initial deploy");
  recordLifecycleEvent(idx, "prod-v1", "updated", "alice");
  recordLifecycleEvent(idx, "prod-v1", "locked", "admin", "freeze for audit");
  saveLifecycleIndex(file, idx);

  const reloaded = loadLifecycleIndex(file);
  const history = getLifecycleHistory(reloaded, "prod-v1");
  expect(history).toHaveLength(3);
  expect(history.map((e) => e.event)).toEqual(["created", "updated", "locked"]);

  fs.unlinkSync(file);
});

test("multiple snapshots tracked independently", () => {
  const file = tmpFile();
  const idx = loadLifecycleIndex(file);

  recordLifecycleEvent(idx, "staging-v1", "created");
  recordLifecycleEvent(idx, "prod-v1", "created");
  recordLifecycleEvent(idx, "staging-v1", "archived");
  recordLifecycleEvent(idx, "prod-v1", "updated");
  saveLifecycleIndex(file, idx);

  const reloaded = loadLifecycleIndex(file);
  expect(getLifecycleHistory(reloaded, "staging-v1")).toHaveLength(2);
  expect(getLifecycleHistory(reloaded, "prod-v1")).toHaveLength(2);

  const recent = getRecentEvents(reloaded, 10);
  expect(recent).toHaveLength(4);

  fs.unlinkSync(file);
});

test("getRecentEvents respects limit", () => {
  const file = tmpFile();
  const idx = loadLifecycleIndex(file);
  for (let i = 0; i < 10; i++) {
    recordLifecycleEvent(idx, `snap-${i}`, "created");
  }
  saveLifecycleIndex(file, idx);
  const reloaded = loadLifecycleIndex(file);
  expect(getRecentEvents(reloaded, 3)).toHaveLength(3);
  fs.unlinkSync(file);
});
