import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { cloneSnapshot, formatCloneResult } from "./snapshot-clone";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envsnap-clone-"));
}

const sampleSnapshot = {
  timestamp: "2024-01-01T00:00:00.000Z",
  env: { NODE_ENV: "production", PORT: "3000" },
};

describe("cloneSnapshot", () => {
  it("clones a snapshot file to a new destination", () => {
    const dir = tmpDir();
    const src = path.join(dir, "source.json");
    const dst = path.join(dir, "clone.json");
    fs.writeFileSync(src, JSON.stringify(sampleSnapshot));

    const result = cloneSnapshot(src, dst);
    expect(result.success).toBe(true);
    expect(result.source).toBe(src);
    expect(result.destination).toBe(dst);
    const cloned = JSON.parse(fs.readFileSync(dst, "utf-8"));
    expect(cloned.env).toEqual(sampleSnapshot.env);
    expect(cloned.clonedFrom).toBe(src);
    expect(cloned.clonedAt).toBeDefined();
  });

  it("returns error if source does not exist", () => {
    const dir = tmpDir();
    const result = cloneSnapshot(path.join(dir, "missing.json"), path.join(dir, "out.json"));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Source file not found/);
  });

  it("returns error if destination exists and overwrite is false", () => {
    const dir = tmpDir();
    const src = path.join(dir, "source.json");
    const dst = path.join(dir, "clone.json");
    fs.writeFileSync(src, JSON.stringify(sampleSnapshot));
    fs.writeFileSync(dst, JSON.stringify(sampleSnapshot));

    const result = cloneSnapshot(src, dst, { overwrite: false });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Destination already exists/);
  });

  it("overwrites destination when overwrite is true", () => {
    const dir = tmpDir();
    const src = path.join(dir, "source.json");
    const dst = path.join(dir, "clone.json");
    fs.writeFileSync(src, JSON.stringify(sampleSnapshot));
    fs.writeFileSync(dst, JSON.stringify({ env: { OLD: "value" } }));

    const result = cloneSnapshot(src, dst, { overwrite: true });
    expect(result.success).toBe(true);
    const cloned = JSON.parse(fs.readFileSync(dst, "utf-8"));
    expect(cloned.env).toEqual(sampleSnapshot.env);
  });

  it("appends suffix to destination filename", () => {
    const dir = tmpDir();
    const src = path.join(dir, "source.json");
    fs.writeFileSync(src, JSON.stringify(sampleSnapshot));
    const dst = path.join(dir, "clone.json");

    const result = cloneSnapshot(src, dst, { suffix: "-backup" });
    expect(result.success).toBe(true);
    expect(result.destination).toBe(path.join(dir, "clone-backup.json"));
    expect(fs.existsSync(path.join(dir, "clone-backup.json"))).toBe(true);
  });
});

describe("formatCloneResult", () => {
  it("formats a successful clone", () => {
    const msg = formatCloneResult({ source: "a.json", destination: "b.json", success: true });
    expect(msg).toContain("Cloned");
    expect(msg).toContain("a.json");
    expect(msg).toContain("b.json");
  });

  it("formats a failed clone", () => {
    const msg = formatCloneResult({ source: "a.json", destination: "b.json", success: false, error: "oops" });
    expect(msg).toContain("Clone failed");
    expect(msg).toContain("oops");
  });
});
