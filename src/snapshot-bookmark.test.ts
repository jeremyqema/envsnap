import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyBookmarkIndex,
  loadBookmarkIndex,
  saveBookmarkIndex,
  addBookmark,
  removeBookmark,
  getBookmark,
  listBookmarks,
  findBookmarksByTag,
} from "./snapshot-bookmark";

function tmpFile(): string {
  return path.join(os.tmpdir(), `bookmark-test-${Date.now()}-${Math.random()}.json`);
}

describe("snapshot-bookmark", () => {
  test("emptyBookmarkIndex returns empty structure", () => {
    const idx = emptyBookmarkIndex();
    expect(idx.bookmarks).toEqual({});
  });

  test("loadBookmarkIndex returns empty index for missing file", () => {
    const idx = loadBookmarkIndex("/nonexistent/path/bookmarks.json");
    expect(idx.bookmarks).toEqual({});
  });

  test("saveBookmarkIndex and loadBookmarkIndex round-trip", () => {
    const file = tmpFile();
    try {
      let idx = emptyBookmarkIndex();
      idx = addBookmark(idx, "prod-v1", "Production snapshot v1", ["prod"]);
      saveBookmarkIndex(file, idx);
      const loaded = loadBookmarkIndex(file);
      expect(loaded.bookmarks["prod-v1"]).toBeDefined();
      expect(loaded.bookmarks["prod-v1"].description).toBe("Production snapshot v1");
    } finally {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  test("addBookmark adds a bookmark with tags", () => {
    let idx = emptyBookmarkIndex();
    idx = addBookmark(idx, "staging-v2", "Staging v2", ["staging", "v2"]);
    const bm = getBookmark(idx, "staging-v2");
    expect(bm).toBeDefined();
    expect(bm!.tags).toContain("staging");
    expect(bm!.tags).toContain("v2");
  });

  test("addBookmark defaults tags to empty array", () => {
    let idx = emptyBookmarkIndex();
    idx = addBookmark(idx, "no-tags", "No tags here");
    expect(getBookmark(idx, "no-tags")!.tags).toEqual([]);
  });

  test("removeBookmark removes the entry", () => {
    let idx = emptyBookmarkIndex();
    idx = addBookmark(idx, "to-remove", "Will be removed");
    idx = removeBookmark(idx, "to-remove");
    expect(getBookmark(idx, "to-remove")).toBeUndefined();
  });

  test("listBookmarks returns bookmarks sorted by createdAt", () => {
    let idx = emptyBookmarkIndex();
    idx = addBookmark(idx, "first", "First");
    idx = addBookmark(idx, "second", "Second");
    const list = listBookmarks(idx);
    expect(list.length).toBe(2);
    expect(list[0].label).toBe("first");
  });

  test("findBookmarksByTag filters correctly", () => {
    let idx = emptyBookmarkIndex();
    idx = addBookmark(idx, "a", "A", ["prod"]);
    idx = addBookmark(idx, "b", "B", ["staging"]);
    idx = addBookmark(idx, "c", "C", ["prod", "stable"]);
    const prodBookmarks = findBookmarksByTag(idx, "prod");
    expect(prodBookmarks.map((b) => b.label)).toEqual(["a", "c"]);
  });
});
