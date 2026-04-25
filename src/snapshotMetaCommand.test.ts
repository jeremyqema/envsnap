import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdMetaSet,
  cmdMetaGet,
  cmdMetaRemove,
  cmdMetaList,
  cmdMetaUsage,
} from "./snapshotMetaCommand";

function tmpFile(): string {
  return path.join(os.tmpdir(), `metacmd-${Date.now()}-${Math.random()}.json`);
}

describe("cmdMetaUsage", () => {
  it("prints usage without throwing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdMetaUsage();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("cmdMetaSet", () => {
  it("sets metadata and persists it", () => {
    const file = tmpFile();
    try {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      cmdMetaSet(["prod", "--desc", "Production env", "--author", "alice"], file);
      expect(log).toHaveBeenCalledWith(expect.stringContaining("prod"));
      log.mockRestore();
      const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
      expect(raw["prod"].description).toBe("Production env");
      expect(raw["prod"].author).toBe("alice");
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("exits if label is missing", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    cmdMetaSet([], tmpFile());
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    err.mockRestore();
  });
});

describe("cmdMetaGet", () => {
  it("prints metadata for existing label", () => {
    const file = tmpFile();
    try {
      cmdMetaSet(["snap", "--source", "ci"], file);
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      cmdMetaGet(["snap"], file);
      const output = log.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("ci");
      log.mockRestore();
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("prints not found for missing label", () => {
    const file = tmpFile();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdMetaGet(["ghost"], file);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("No metadata"));
    log.mockRestore();
  });
});

describe("cmdMetaRemove", () => {
  it("removes an existing entry", () => {
    const file = tmpFile();
    try {
      cmdMetaSet(["snap", "--author", "bob"], file);
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      cmdMetaRemove(["snap"], file);
      log.mockRestore();
      const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
      expect(raw["snap"]).toBeUndefined();
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });
});

describe("cmdMetaList", () => {
  it("lists all entries", () => {
    const file = tmpFile();
    try {
      cmdMetaSet(["a", "--author", "alice"], file);
      cmdMetaSet(["b", "--desc", "second"], file);
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      cmdMetaList(file);
      const output = log.mock.calls.map((c) => c[0]).join("\n");
      expect(output).toContain("[a]");
      expect(output).toContain("[b]");
      log.mockRestore();
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it("prints message when no entries exist", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdMetaList(tmpFile());
    expect(log).toHaveBeenCalledWith(expect.stringContaining("No metadata"));
    log.mockRestore();
  });
});
