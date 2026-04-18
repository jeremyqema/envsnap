import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import {
  loadBaseline,
  setBaseline,
  clearBaseline,
  compareToBaseline,
} from "./baseline";
import { Snapshot } from "./snapshot";

function tmpFile(): string {
  return path.join(os.tmpdir(), `baseline-test-${Date.now()}.json`);
}

function makeSnapshot(env: Record<string, string>): Snapshot {
  return { env, capturedAt: new Date().toISOString() };
}

describe("baseline", () => {
  it("returns null when file does not exist", () => {
    expect(loadBaseline("/nonexistent/path.json")).toBeNull();
  });

  it("saves and loads a baseline", () => {
    const file = tmpFile();
    try {
      const snap = makeSnapshot({ FOO: "bar" });
      const entry = setBaseline(file, "v1", snap);
      expect(entry.label).toBe("v1");
      const loaded = loadBaseline(file);
      expect(loaded).not.toBeNull();
      expect(loaded!.label).toBe("v1");
      expect(loaded!.snapshot.env.FOO).toBe("bar");
    } finally {
      fs.unlinkSync(file);
    }
  });

  it("clears a baseline file", () => {
    const file = tmpFile();
    setBaseline(file, "v1", makeSnapshot({ A: "1" }));
    clearBaseline(file);
    expect(fs.existsSync(file)).toBe(false);
  });

  it("detects added, removed, and changed keys", () => {
    const base = makeSnapshot({ A: "1", B: "2", C: "3" });
    const entry = { label: "base", snapshot: base, createdAt: "" };
    const current = makeSnapshot({ A: "1", B: "changed", D: "4" });
    const result = compareToBaseline(entry, current);
    expect(result.added).toContain("D");
    expect(result.removed).toContain("C");
    expect(result.changed).toContain("B");
    expect(result.changed).not.toContain("A");
  });
});
