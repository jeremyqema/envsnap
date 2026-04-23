import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadAnnotations,
  saveAnnotations,
  addAnnotation,
  removeAnnotation,
  getAnnotation,
  listAnnotations,
} from "./annotate";

function tmpFile(): string {
  return path.join(os.tmpdir(), `annotate-test-${Date.now()}.json`);
}

describe("loadAnnotations", () => {
  it("returns empty object when file does not exist", () => {
    expect(loadAnnotations("/nonexistent/path.json")).toEqual({});
  });

  it("loads saved annotations", () => {
    const f = tmpFile();
    const data = { foo: { label: "foo", note: "bar", createdAt: "2024-01-01T00:00:00.000Z" } };
    fs.writeFileSync(f, JSON.stringify(data));
    expect(loadAnnotations(f)).toEqual(data);
    fs.unlinkSync(f);
  });
});

describe("saveAnnotations / loadAnnotations roundtrip", () => {
  it("persists and retrieves annotations", () => {
    const f = tmpFile();
    let store = addAnnotation({}, "v1.0", "initial release", "alice");
    saveAnnotations(f, store);
    const loaded = loadAnnotations(f);
    expect(loaded["v1.0"].note).toBe("initial release");
    expect(loaded["v1.0"].author).toBe("alice");
    fs.unlinkSync(f);
  });
});

describe("addAnnotation", () => {
  it("adds a new entry", () => {
    const store = addAnnotation({}, "deploy-42", "hotfix");
    expect(store["deploy-42"]).toBeDefined();
    expect(store["deploy-42"].note).toBe("hotfix");
  });

  it("overwrites existing entry", () => {
    let store = addAnnotation({}, "deploy-42", "original");
    store = addAnnotation(store, "deploy-42", "updated");
    expect(store["deploy-42"].note).toBe("updated");
  });
});

describe("removeAnnotation", () => {
  it("removes an existing entry", () => {
    let store = addAnnotation({}, "x", "note");
    store = removeAnnotation(store, "x");
    expect(store["x"]).toBeUndefined();
  });

  it("is a no-op for missing label", () => {
    const store = removeAnnotation({}, "missing");
    expect(store).toEqual({});
  });
});

describe("getAnnotation", () => {
  it("returns undefined for missing label", () => {
    expect(getAnnotation({}, "nope")).toBeUndefined();
  });
});

describe("listAnnotations", () => {
  it("returns entries sorted by createdAt", () => {
    let store = addAnnotation({}, "b", "second");
    store = addAnnotation(store, "a", "first");
    // force ordering by manipulating createdAt
    store["a"].createdAt = "2024-01-01T00:00:00.000Z";
    store["b"].createdAt = "2024-06-01T00:00:00.000Z";
    const list = listAnnotations(store);
    expect(list[0].label).toBe("a");
    expect(list[1].label).toBe("b");
  });
});
