import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyCommentIndex,
  loadCommentIndex,
  saveCommentIndex,
  setComment,
  removeComment,
  getComment,
  listComments,
} from "./snapshot-comment";

function tmpFile(): string {
  return path.join(os.tmpdir(), `comment-test-${Date.now()}.json`);
}

describe("emptyCommentIndex", () => {
  it("returns an index with no comments", () => {
    const index = emptyCommentIndex();
    expect(index.comments).toEqual({});
  });
});

describe("loadCommentIndex", () => {
  it("returns empty index when file does not exist", () => {
    const index = loadCommentIndex("/nonexistent/path.json");
    expect(index).toEqual(emptyCommentIndex());
  });

  it("loads existing index from disk", () => {
    const file = tmpFile();
    const data = { comments: { snap1: { label: "snap1", comment: "hello", updatedAt: "2024-01-01T00:00:00.000Z" } } };
    fs.writeFileSync(file, JSON.stringify(data), "utf-8");
    const index = loadCommentIndex(file);
    expect(index.comments["snap1"].comment).toBe("hello");
    fs.unlinkSync(file);
  });
});

describe("saveCommentIndex", () => {
  it("writes index to disk and reloads correctly", () => {
    const file = tmpFile();
    let index = emptyCommentIndex();
    index = setComment(index, "snap1", "first comment");
    saveCommentIndex(file, index);
    const loaded = loadCommentIndex(file);
    expect(loaded.comments["snap1"].comment).toBe("first comment");
    fs.unlinkSync(file);
  });
});

describe("setComment", () => {
  it("adds a new comment entry", () => {
    let index = emptyCommentIndex();
    index = setComment(index, "mysnap", "looks good");
    expect(index.comments["mysnap"].comment).toBe("looks good");
    expect(index.comments["mysnap"].label).toBe("mysnap");
    expect(index.comments["mysnap"].updatedAt).toBeDefined();
  });

  it("overwrites an existing comment", () => {
    let index = emptyCommentIndex();
    index = setComment(index, "mysnap", "old");
    index = setComment(index, "mysnap", "new");
    expect(index.comments["mysnap"].comment).toBe("new");
  });
});

describe("removeComment", () => {
  it("removes an existing comment", () => {
    let index = emptyCommentIndex();
    index = setComment(index, "snap1", "test");
    index = removeComment(index, "snap1");
    expect(index.comments["snap1"]).toBeUndefined();
  });

  it("is a no-op for unknown label", () => {
    const index = emptyCommentIndex();
    const result = removeComment(index, "ghost");
    expect(result.comments).toEqual({});
  });
});

describe("getComment", () => {
  it("returns the entry for a known label", () => {
    let index = emptyCommentIndex();
    index = setComment(index, "s1", "hi");
    expect(getComment(index, "s1")?.comment).toBe("hi");
  });

  it("returns undefined for unknown label", () => {
    expect(getComment(emptyCommentIndex(), "nope")).toBeUndefined();
  });
});

describe("listComments", () => {
  it("returns all comments sorted by label", () => {
    let index = emptyCommentIndex();
    index = setComment(index, "beta", "b");
    index = setComment(index, "alpha", "a");
    const list = listComments(index);
    expect(list.map((e) => e.label)).toEqual(["alpha", "beta"]);
  });

  it("returns empty array for empty index", () => {
    expect(listComments(emptyCommentIndex())).toEqual([]);
  });
});
