import {
  emptyLabelIndex,
  attachLabel,
  detachLabel,
  getLabelsForSnapshot,
  getSnapshotsForLabel,
  listAllLabels,
  loadLabelIndex,
  saveLabelIndex,
} from "./snapshot-label";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile(): string {
  return path.join(os.tmpdir(), `label-test-${Date.now()}-${Math.random()}.json`);
}

describe("snapshot-label", () => {
  it("starts empty", () => {
    const idx = emptyLabelIndex();
    expect(idx.labels).toEqual({});
    expect(idx.snapshots).toEqual({});
  });

  it("attaches a label to a snapshot", () => {
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "prod-v1", "production");
    expect(getLabelsForSnapshot(idx, "prod-v1")).toContain("production");
    expect(getSnapshotsForLabel(idx, "production")).toContain("prod-v1");
  });

  it("does not duplicate labels on re-attach", () => {
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "prod-v1", "production");
    idx = attachLabel(idx, "prod-v1", "production");
    expect(getLabelsForSnapshot(idx, "prod-v1").length).toBe(1);
  });

  it("detaches a label", () => {
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "prod-v1", "production");
    idx = detachLabel(idx, "prod-v1", "production");
    expect(getLabelsForSnapshot(idx, "prod-v1")).toHaveLength(0);
    expect(getSnapshotsForLabel(idx, "production")).toHaveLength(0);
  });

  it("removes empty keys after detach", () => {
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "prod-v1", "production");
    idx = detachLabel(idx, "prod-v1", "production");
    expect(idx.labels["production"]).toBeUndefined();
    expect(idx.snapshots["prod-v1"]).toBeUndefined();
  });

  it("lists all labels", () => {
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "snap-a", "beta");
    idx = attachLabel(idx, "snap-b", "alpha");
    expect(listAllLabels(idx)).toEqual(["alpha", "beta"]);
  });

  it("persists and loads from disk", () => {
    const file = tmpFile();
    let idx = emptyLabelIndex();
    idx = attachLabel(idx, "snap-x", "staging");
    saveLabelIndex(file, idx);
    const loaded = loadLabelIndex(file);
    expect(getLabelsForSnapshot(loaded, "snap-x")).toContain("staging");
    fs.unlinkSync(file);
  });

  it("returns empty index when file does not exist", () => {
    const idx = loadLabelIndex("/tmp/nonexistent-label-index-xyz.json");
    expect(idx).toEqual(emptyLabelIndex());
  });
});
