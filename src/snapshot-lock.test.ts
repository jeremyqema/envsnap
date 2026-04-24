import { describe, it, expect } from "vitest";
import {
  emptyLockIndex,
  lockSnapshot,
  unlockSnapshot,
  isLocked,
  getLock,
  listLocks,
} from "./snapshot-lock";

describe("lockSnapshot", () => {
  it("adds a lock entry", () => {
    const index = emptyLockIndex();
    const updated = lockSnapshot(index, "prod-v1", "Do not overwrite");
    expect(updated.locked["prod-v1"]).toBeDefined();
    expect(updated.locked["prod-v1"].reason).toBe("Do not overwrite");
  });

  it("throws if already locked", () => {
    let index = emptyLockIndex();
    index = lockSnapshot(index, "prod-v1", "reason");
    expect(() => lockSnapshot(index, "prod-v1", "other")).toThrow(
      'already locked'
    );
  });
});

describe("unlockSnapshot", () => {
  it("removes a lock entry", () => {
    let index = emptyLockIndex();
    index = lockSnapshot(index, "prod-v1", "reason");
    index = unlockSnapshot(index, "prod-v1");
    expect(index.locked["prod-v1"]).toBeUndefined();
  });

  it("throws if not locked", () => {
    const index = emptyLockIndex();
    expect(() => unlockSnapshot(index, "prod-v1")).toThrow("not locked");
  });
});

describe("isLocked", () => {
  it("returns true when locked", () => {
    let index = emptyLockIndex();
    index = lockSnapshot(index, "staging", "freeze");
    expect(isLocked(index, "staging")).toBe(true);
  });

  it("returns false when not locked", () => {
    expect(isLocked(emptyLockIndex(), "staging")).toBe(false);
  });
});

describe("getLock", () => {
  it("returns lock metadata", () => {
    let index = emptyLockIndex();
    index = lockSnapshot(index, "v2", "audit requirement");
    const lock = getLock(index, "v2");
    expect(lock?.reason).toBe("audit requirement");
    expect(lock?.lockedAt).toBeTruthy();
  });

  it("returns undefined for unknown label", () => {
    expect(getLock(emptyLockIndex(), "missing")).toBeUndefined();
  });
});

describe("listLocks", () => {
  it("returns all locked entries", () => {
    let index = emptyLockIndex();
    index = lockSnapshot(index, "a", "reason-a");
    index = lockSnapshot(index, "b", "reason-b");
    const locks = listLocks(index);
    expect(locks).toHaveLength(2);
    expect(locks.map((l) => l.label)).toContain("a");
    expect(locks.map((l) => l.label)).toContain("b");
  });

  it("returns empty array when none locked", () => {
    expect(listLocks(emptyLockIndex())).toHaveLength(0);
  });
});
