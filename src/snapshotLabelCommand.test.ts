import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  cmdLabelAttach,
  cmdLabelDetach,
  cmdLabelShow,
  cmdLabelList,
  cmdLabelAll,
} from "./snapshotLabelCommand";
import { loadLabelIndex } from "./snapshot-label";

function tmpFile(): string {
  return path.join(os.tmpdir(), `label-cmd-test-${Date.now()}-${Math.random()}.json`);
}

describe("snapshotLabelCommand", () => {
  it("cmdLabelAttach writes to index", () => {
    const f = tmpFile();
    cmdLabelAttach(["snap-1", "production"], f);
    const idx = loadLabelIndex(f);
    expect(idx.snapshots["snap-1"]).toContain("production");
    fs.unlinkSync(f);
  });

  it("cmdLabelDetach removes from index", () => {
    const f = tmpFile();
    cmdLabelAttach(["snap-1", "production"], f);
    cmdLabelDetach(["snap-1", "production"], f);
    const idx = loadLabelIndex(f);
    expect(idx.snapshots["snap-1"]).toBeUndefined();
    fs.unlinkSync(f);
  });

  it("cmdLabelShow prints labels", () => {
    const f = tmpFile();
    cmdLabelAttach(["snap-2", "staging"], f);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    cmdLabelShow(["snap-2"], f);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("staging"));
    spy.mockRestore();
    fs.unlinkSync(f);
  });

  it("cmdLabelShow prints message when no labels", () => {
    const f = tmpFile();
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    cmdLabelShow(["snap-none"], f);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No labels"));
    spy.mockRestore();
  });

  it("cmdLabelList prints snapshots for label", () => {
    const f = tmpFile();
    cmdLabelAttach(["snap-3", "canary"], f);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    cmdLabelList(["canary"], f);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("snap-3"));
    spy.mockRestore();
    fs.unlinkSync(f);
  });

  it("cmdLabelAll lists all labels", () => {
    const f = tmpFile();
    cmdLabelAttach(["snap-a", "alpha"], f);
    cmdLabelAttach(["snap-b", "beta"], f);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    cmdLabelAll(f);
    const output = spy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("alpha");
    expect(output).toContain("beta");
    spy.mockRestore();
    fs.unlinkSync(f);
  });
});
