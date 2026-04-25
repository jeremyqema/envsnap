import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdAccessRecord,
  cmdAccessHistory,
  cmdAccessRecent,
  cmdAccessClear,
} from "./snapshotAccessCommand";

function tmpFile(): string {
  return path.join(os.tmpdir(), `access-cmd-test-${Date.now()}.json`);
}

describe("snapshotAccessCommand", () => {
  let file: string;
  let logs: string[];

  beforeEach(() => {
    file = tmpFile();
    logs = [];
    vi.spyOn(console, "log").mockImplementation((...args) =>
      logs.push(args.join(" "))
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("cmdAccessRecord writes an entry and logs confirmation", () => {
    cmdAccessRecord(["prod", "read"], file);
    expect(logs[0]).toContain("read");
    expect(logs[0]).toContain("prod");
    expect(fs.existsSync(file)).toBe(true);
  });

  it("cmdAccessHistory shows entries for label", () => {
    cmdAccessRecord(["prod", "read"], file);
    cmdAccessRecord(["prod", "write"], file);
    logs = [];
    cmdAccessHistory(["prod"], file);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain("read");
  });

  it("cmdAccessHistory shows message when no history", () => {
    cmdAccessHistory(["unknown"], file);
    expect(logs[0]).toContain("No access history");
  });

  it("cmdAccessRecent shows recent entries", () => {
    cmdAccessRecord(["a", "read"], file);
    cmdAccessRecord(["b", "write"], file);
    logs = [];
    cmdAccessRecent(["--limit", "1"], file);
    expect(logs).toHaveLength(1);
  });

  it("cmdAccessRecent shows message when empty", () => {
    cmdAccessRecent([], file);
    expect(logs[0]).toContain("No access events");
  });

  it("cmdAccessClear removes entries for label", () => {
    cmdAccessRecord(["prod", "read"], file);
    cmdAccessClear(["prod"], file);
    logs = [];
    cmdAccessHistory(["prod"], file);
    expect(logs[0]).toContain("No access history");
  });

  it("cmdAccessClear logs confirmation", () => {
    cmdAccessRecord(["prod", "read"], file);
    logs = [];
    cmdAccessClear(["prod"], file);
    expect(logs[0]).toContain("Cleared");
    expect(logs[0]).toContain("prod");
  });
});
