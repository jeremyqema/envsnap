import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  emptyRatingIndex,
  loadRatingIndex,
  saveRatingIndex,
  setRating,
  removeRating,
  getRating,
  listRatings,
  topRated,
} from "./snapshot-rating";

function tmpFile(): string {
  return path.join(os.tmpdir(), `rating-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe("emptyRatingIndex", () => {
  it("returns an index with no ratings", () => {
    expect(emptyRatingIndex()).toEqual({ ratings: {} });
  });
});

describe("loadRatingIndex / saveRatingIndex", () => {
  it("returns empty index when file does not exist", () => {
    expect(loadRatingIndex("/nonexistent/file.json")).toEqual(emptyRatingIndex());
  });

  it("round-trips data correctly", () => {
    const file = tmpFile();
    let index = emptyRatingIndex();
    index = setRating(index, "prod-v1", 4, "stable");
    saveRatingIndex(file, index);
    const loaded = loadRatingIndex(file);
    expect(loaded.ratings["prod-v1"].rating).toBe(4);
    expect(loaded.ratings["prod-v1"].note).toBe("stable");
    fs.unlinkSync(file);
  });
});

describe("setRating", () => {
  it("adds a rating entry", () => {
    let index = emptyRatingIndex();
    index = setRating(index, "snap-a", 3);
    expect(index.ratings["snap-a"].rating).toBe(3);
    expect(index.ratings["snap-a"].ratedAt).toBeDefined();
  });

  it("throws for out-of-range rating", () => {
    expect(() => setRating(emptyRatingIndex(), "snap-a", 0)).toThrow(RangeError);
    expect(() => setRating(emptyRatingIndex(), "snap-a", 6)).toThrow(RangeError);
  });

  it("overwrites an existing rating", () => {
    let index = emptyRatingIndex();
    index = setRating(index, "snap-a", 2);
    index = setRating(index, "snap-a", 5, "upgraded");
    expect(index.ratings["snap-a"].rating).toBe(5);
    expect(index.ratings["snap-a"].note).toBe("upgraded");
  });
});

describe("removeRating", () => {
  it("removes an existing rating", () => {
    let index = emptyRatingIndex();
    index = setRating(index, "snap-a", 3);
    index = removeRating(index, "snap-a");
    expect(index.ratings["snap-a"]).toBeUndefined();
  });

  it("is a no-op for unknown label", () => {
    const index = emptyRatingIndex();
    expect(() => removeRating(index, "unknown")).not.toThrow();
  });
});

describe("getRating", () => {
  it("returns undefined for missing label", () => {
    expect(getRating(emptyRatingIndex(), "x")).toBeUndefined();
  });
});

describe("listRatings", () => {
  it("returns entries sorted by label", () => {
    let index = emptyRatingIndex();
    index = setRating(index, "b", 2);
    index = setRating(index, "a", 5);
    const result = listRatings(index);
    expect(result[0].label).toBe("a");
    expect(result[1].label).toBe("b");
  });
});

describe("topRated", () => {
  it("returns entries sorted by rating descending", () => {
    let index = emptyRatingIndex();
    index = setRating(index, "c", 1);
    index = setRating(index, "a", 5);
    index = setRating(index, "b", 3);
    const result = topRated(index, 2);
    expect(result[0].label).toBe("a");
    expect(result[1].label).toBe("b");
  });

  it("respects the n limit", () => {
    let index = emptyRatingIndex();
    for (let i = 1; i <= 10; i++) index = setRating(index, `snap-${i}`, (i % 5) + 1);
    expect(topRated(index, 3)).toHaveLength(3);
  });
});
