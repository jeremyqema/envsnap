import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdLockAdd,
  cmdLockRemove,
  cmdLockShow,
  cmdLockList,
} from "./snapshotLockCommand";

function tmpFile(): string {
  return path.join(os.tmpdir(), `locks-${Date.now()}-${Math.random()}.json`);
}

describe("cmdLockAdd", () => {
  it("creates a lock entry", () => {
    const f = tmpFile();
    cmdLockAdd("prod", "freeze for release", f);
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw.locked["prod"].reason).toBe("freeze for release");
  });

  it("throws when label is missing", () => {
    expect(() => cmdLockAdd("", "reason", tmpFile())).toThrow("Label");
  });

  it("throws when reason is missing", () => {
    expect(() => cmdLockAdd("prod", "", tmpFile())).toThrow("reason");
  });

  it("throws when already locked", () => {
    const f = tmpFile();
    cmdLockAdd("prod", "first", f);
    expect(() => cmdLockAdd("prod", "second", f)).toThrow("already locked");
  });
});

describe("cmdLockRemove", () => {
  it("removes an existing lock", () => {
    const f = tmpFile();
    cmdLockAdd("staging", "temp lock", f);
    cmdLockRemove("staging", f);
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    expect(raw.locked["staging"]).toBeUndefined();
  });

  it("throws when not locked", () => {
    expect(() => cmdLockRemove("ghost", tmpFile())).toThrow("not locked");
  });
});

describe("cmdLockShow", () => {
  it("prints lock info", () => {
    const f = tmpFile();
    cmdLockAdd("v3", "compliance hold", f);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (m: string) => logs.push(m);
    cmdLockShow("v3", f);
    console.log = orig;
    expect(logs.join(" ")).toContain("compliance hold");
  });
});

describe("cmdLockList", () => {
  it("lists all locks", () => {
    const f = tmpFile();
    cmdLockAdd("a", "reason-a", f);
    cmdLockAdd("b", "reason-b", f);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (m: string) => logs.push(m);
    cmdLockList(f);
    console.log = orig;
    expect(logs.some((l) => l.includes("a"))).toBe(true);
    expect(logs.some((l) => l.includes("b"))).toBe(true);
  });

  it("prints empty message when no locks", () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (m: string) => logs.push(m);
    cmdLockList(tmpFile());
    console.log = orig;
    expect(logs[0]).toMatch(/no locked/i);
  });
});
