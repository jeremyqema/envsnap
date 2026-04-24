import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadPins,
  pinSnapshot,
  unpinSnapshot,
  getPin,
  listPins,
} from "./pin";

function tmpFile(): string {
  return path.join(os.tmpdir(), `pins-${Date.now()}-${Math.random()}.json`);
}

describe("pin", () => {
  it("loadPins returns empty index when file does not exist", () => {
    const index = loadPins("/nonexistent/path.json");
    expect(index.pins).toEqual([]);
  });

  it("pinSnapshot adds a new entry", () => {
    const f = tmpFile();
    try {
      const entry = pinSnapshot(f, "prod-v1", "/snaps/prod-v1.json");
      expect(entry.label).toBe("prod-v1");
      expect(entry.snapshotPath).toBe("/snaps/prod-v1.json");
      expect(entry.note).toBeUndefined();
      const pins = listPins(f);
      expect(pins).toHaveLength(1);
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("pinSnapshot stores an optional note", () => {
    const f = tmpFile();
    try {
      const entry = pinSnapshot(f, "staging", "/snaps/staging.json", "before deploy");
      expect(entry.note).toBe("before deploy");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("pinSnapshot overwrites an existing label", () => {
    const f = tmpFile();
    try {
      pinSnapshot(f, "prod", "/snaps/old.json");
      pinSnapshot(f, "prod", "/snaps/new.json");
      const pins = listPins(f);
      expect(pins).toHaveLength(1);
      expect(pins[0].snapshotPath).toBe("/snaps/new.json");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("unpinSnapshot removes an existing pin and returns true", () => {
    const f = tmpFile();
    try {
      pinSnapshot(f, "dev", "/snaps/dev.json");
      const result = unpinSnapshot(f, "dev");
      expect(result).toBe(true);
      expect(listPins(f)).toHaveLength(0);
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("unpinSnapshot returns false when label not found", () => {
    const f = tmpFile();
    try {
      pinSnapshot(f, "dev", "/snaps/dev.json");
      const result = unpinSnapshot(f, "nonexistent");
      expect(result).toBe(false);
      expect(listPins(f)).toHaveLength(1);
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("getPin returns undefined for missing label", () => {
    const f = tmpFile();
    try {
      pinSnapshot(f, "x", "/x.json");
      expect(getPin(f, "y")).toBeUndefined();
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });

  it("getPin returns the correct entry", () => {
    const f = tmpFile();
    try {
      pinSnapshot(f, "alpha", "/alpha.json", "alpha note");
      pinSnapshot(f, "beta", "/beta.json");
      const pin = getPin(f, "alpha");
      expect(pin?.snapshotPath).toBe("/alpha.json");
      expect(pin?.note).toBe("alpha note");
    } finally {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  });
});
