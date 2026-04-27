import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { cmdIndexAdd, cmdIndexRemove, cmdIndexShow, cmdIndexList } from "./snapshotIndexCommand";

function tmpFile() {
  return path.join(os.tmpdir(), `envsnap-idx-cmd-${Date.now()}.json`);
}

describe("snapshotIndexCommand", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("cmdIndexAdd creates an entry", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["prod", "prod.json"], f);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("prod"));
      const data = JSON.parse(fs.readFileSync(f, "utf-8"));
      expect(data.entries[0].label).toBe("prod");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexAdd supports --tag and --desc flags", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["staging", "s.json", "--tag", "live", "--desc", "staging env"], f);
      const data = JSON.parse(fs.readFileSync(f, "utf-8"));
      expect(data.entries[0].tags).toContain("live");
      expect(data.entries[0].description).toBe("staging env");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexRemove removes an entry", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["dev", "dev.json"], f);
      cmdIndexRemove(["dev"], f);
      const data = JSON.parse(fs.readFileSync(f, "utf-8"));
      expect(data.entries).toHaveLength(0);
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexRemove errors on missing label", () => {
    const f = tmpFile();
    try {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
      cmdIndexRemove(["ghost"], f);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
      exitSpy.mockRestore();
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexShow prints entry JSON", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["prod", "prod.json"], f);
      cmdIndexShow(["prod"], f);
      const output = consoleSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("prod.json");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexList lists all entries", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["a", "a.json", "--tag", "x"], f);
      cmdIndexAdd(["b", "b.json", "--tag", "y"], f);
      cmdIndexList([], f);
      const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(output).toContain("a");
      expect(output).toContain("b");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("cmdIndexList filters by --tag", () => {
    const f = tmpFile();
    try {
      cmdIndexAdd(["a", "a.json", "--tag", "prod"], f);
      cmdIndexAdd(["b", "b.json", "--tag", "dev"], f);
      consoleSpy.mockClear();
      cmdIndexList(["--tag", "prod"], f);
      const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(output).toContain("a");
      expect(output).not.toContain("b");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });
});
