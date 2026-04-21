import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { rollback, listRollbackPoints, createRollbackPoint } from "./rollback";
import { saveSnapshot, loadSnapshot } from "./snapshot";
import { saveHistory, addHistoryEntry } from "./history";

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap-rollback-test-${Math.random().toString(36).slice(2)}.json`);
}

const snap1 = { APP_ENV: "staging", PORT: "3000", DEBUG: "false" };
const snap2 = { APP_ENV: "production", PORT: "8080", DEBUG: "false", NEW_VAR: "hello" };
const snap3 = { APP_ENV: "production", PORT: "8080", DEBUG: "true", NEW_VAR: "hello", EXTRA: "x" };

describe("createRollbackPoint", () => {
  it("saves a labelled snapshot to the rollback store", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      const points = listRollbackPoints(file);
      expect(points).toHaveLength(1);
      expect(points[0].label).toBe("v1");
      expect(points[0].snapshot).toEqual(snap1);
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("appends multiple rollback points", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      createRollbackPoint(file, "v2", snap2);
      createRollbackPoint(file, "v3", snap3);
      const points = listRollbackPoints(file);
      expect(points).toHaveLength(3);
      expect(points.map((p) => p.label)).toEqual(["v1", "v2", "v3"]);
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });
});

describe("listRollbackPoints", () => {
  it("returns empty array when file does not exist", () => {
    const file = tmpFile();
    expect(listRollbackPoints(file)).toEqual([]);
  });

  it("includes timestamps for each point", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      const points = listRollbackPoints(file);
      expect(typeof points[0].timestamp).toBe("string");
      expect(new Date(points[0].timestamp).getTime()).not.toBeNaN();
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });
});

describe("rollback", () => {
  it("returns the snapshot for a given label", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      createRollbackPoint(file, "v2", snap2);
      const result = rollback(file, "v1");
      expect(result).toEqual(snap1);
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("returns the most recent snapshot when label is 'latest'", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      createRollbackPoint(file, "v2", snap2);
      createRollbackPoint(file, "v3", snap3);
      const result = rollback(file, "latest");
      expect(result).toEqual(snap3);
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("throws when label is not found", () => {
    const file = tmpFile();
    try {
      createRollbackPoint(file, "v1", snap1);
      expect(() => rollback(file, "v99")).toThrow(/not found/);
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("throws when rollback store is empty", () => {
    const file = tmpFile();
    expect(() => rollback(file, "latest")).toThrow(/no rollback points/);
  });
});
