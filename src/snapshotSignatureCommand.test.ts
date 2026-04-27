import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdSignatureSign,
  cmdSignatureVerify,
  cmdSignatureRemove,
  cmdSignatureList,
} from "./snapshotSignatureCommand";
import { loadSignatureIndex } from "./snapshot-signature";

function tmpFile(): string {
  return path.join(os.tmpdir(), `sig-cmd-${Date.now()}-${Math.random()}.json`);
}

describe("cmdSignatureSign", () => {
  it("creates a signature entry", () => {
    const indexPath = tmpFile();
    const snapFile = tmpFile();
    fs.writeFileSync(snapFile, JSON.stringify({ ENV_A: "1" }));
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSignatureSign(["prod", snapFile], indexPath);
    const index = loadSignatureIndex(indexPath);
    expect(index.signatures["prod"]).toBeDefined();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Signed"));
    spy.mockRestore();
    fs.unlinkSync(snapFile);
    fs.unlinkSync(indexPath);
  });

  it("exits on missing file", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    cmdSignatureSign(["prod", "/no/such/file.json"], tmpFile());
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    errSpy.mockRestore();
  });
});

describe("cmdSignatureVerify", () => {
  it("reports valid signature", () => {
    const indexPath = tmpFile();
    const snapFile = tmpFile();
    const content = JSON.stringify({ KEY: "val" });
    fs.writeFileSync(snapFile, content);
    cmdSignatureSign(["staging", snapFile], indexPath);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSignatureVerify(["staging", snapFile], indexPath);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("VALID"));
    spy.mockRestore();
    fs.unlinkSync(snapFile);
    fs.unlinkSync(indexPath);
  });

  it("exits 1 on invalid signature", () => {
    const indexPath = tmpFile();
    const snapFile = tmpFile();
    fs.writeFileSync(snapFile, "original");
    cmdSignatureSign(["dev", snapFile], indexPath);
    fs.writeFileSync(snapFile, "tampered");
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    cmdSignatureVerify(["dev", snapFile], indexPath);
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    errSpy.mockRestore();
    fs.unlinkSync(snapFile);
    fs.unlinkSync(indexPath);
  });
});

describe("cmdSignatureRemove", () => {
  it("removes an existing signature", () => {
    const indexPath = tmpFile();
    const snapFile = tmpFile();
    fs.writeFileSync(snapFile, "data");
    cmdSignatureSign(["qa", snapFile], indexPath);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSignatureRemove(["qa"], indexPath);
    const index = loadSignatureIndex(indexPath);
    expect(index.signatures["qa"]).toBeUndefined();
    spy.mockRestore();
    fs.unlinkSync(snapFile);
    fs.unlinkSync(indexPath);
  });
});

describe("cmdSignatureList", () => {
  it("lists signatures", () => {
    const indexPath = tmpFile();
    const snapFile = tmpFile();
    fs.writeFileSync(snapFile, "env=1");
    cmdSignatureSign(["alpha", snapFile], indexPath);
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSignatureList(indexPath);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("alpha"));
    spy.mockRestore();
    fs.unlinkSync(snapFile);
    fs.unlinkSync(indexPath);
  });

  it("prints empty message when no signatures", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    cmdSignatureList("/nonexistent/index.json");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No signatures"));
    spy.mockRestore();
  });
});
