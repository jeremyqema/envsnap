import { describe, it, expect, beforeEach } from "vitest";
import {
  emptySignatureIndex,
  computeHash,
  signSnapshot,
  verifySnapshot,
  removeSignature,
  listSignatures,
  loadSignatureIndex,
  saveSignatureIndex,
} from "./snapshot-signature";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function tmpFile(): string {
  return path.join(os.tmpdir(), `sig-test-${Date.now()}-${Math.random()}.json`);
}

describe("computeHash", () => {
  it("produces consistent sha256 hash", () => {
    const h1 = computeHash("hello");
    const h2 = computeHash("hello");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("produces different hashes for different content", () => {
    expect(computeHash("a")).not.toBe(computeHash("b"));
  });

  it("supports sha512", () => {
    const h = computeHash("hello", "sha512");
    expect(h).toHaveLength(128);
  });
});

describe("signSnapshot / verifySnapshot", () => {
  it("signs and verifies successfully", () => {
    const index = emptySignatureIndex();
    signSnapshot(index, "prod", "ENV_A=1");
    const result = verifySnapshot(index, "prod", "ENV_A=1");
    expect(result.valid).toBe(true);
  });

  it("detects tampered content", () => {
    const index = emptySignatureIndex();
    signSnapshot(index, "prod", "ENV_A=1");
    const result = verifySnapshot(index, "prod", "ENV_A=2");
    expect(result.valid).toBe(false);
    expect(result.expected).toBeDefined();
    expect(result.actual).toBeDefined();
  });

  it("returns invalid for unknown label", () => {
    const index = emptySignatureIndex();
    const result = verifySnapshot(index, "unknown", "content");
    expect(result.valid).toBe(false);
    expect(result.expected).toBeUndefined();
  });

  it("overwrites existing signature on re-sign", () => {
    const index = emptySignatureIndex();
    signSnapshot(index, "prod", "ENV_A=1");
    signSnapshot(index, "prod", "ENV_A=2");
    expect(verifySnapshot(index, "prod", "ENV_A=2").valid).toBe(true);
    expect(verifySnapshot(index, "prod", "ENV_A=1").valid).toBe(false);
  });
});

describe("removeSignature", () => {
  it("removes existing entry", () => {
    const index = emptySignatureIndex();
    signSnapshot(index, "prod", "content");
    expect(removeSignature(index, "prod")).toBe(true);
    expect(index.signatures["prod"]).toBeUndefined();
  });

  it("returns false for missing label", () => {
    const index = emptySignatureIndex();
    expect(removeSignature(index, "nope")).toBe(false);
  });
});

describe("listSignatures", () => {
  it("returns all entries", () => {
    const index = emptySignatureIndex();
    signSnapshot(index, "a", "1");
    signSnapshot(index, "b", "2");
    const entries = listSignatures(index);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.label)).toContain("a");
  });
});

describe("loadSignatureIndex / saveSignatureIndex", () => {
  it("round-trips to disk", () => {
    const file = tmpFile();
    const index = emptySignatureIndex();
    signSnapshot(index, "staging", "ENV=1");
    saveSignatureIndex(file, index);
    const loaded = loadSignatureIndex(file);
    expect(loaded.signatures["staging"]).toBeDefined();
    fs.unlinkSync(file);
  });

  it("returns empty index when file missing", () => {
    const loaded = loadSignatureIndex("/nonexistent/path.json");
    expect(loaded.signatures).toEqual({});
  });
});
