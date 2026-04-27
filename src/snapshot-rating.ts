import * as fs from "fs";

export interface RatingEntry {
  label: string;
  rating: number; // 1-5
  note?: string;
  ratedAt: string;
}

export interface RatingIndex {
  ratings: Record<string, RatingEntry>;
}

export function emptyRatingIndex(): RatingIndex {
  return { ratings: {} };
}

export function loadRatingIndex(file: string): RatingIndex {
  if (!fs.existsSync(file)) return emptyRatingIndex();
  return JSON.parse(fs.readFileSync(file, "utf8")) as RatingIndex;
}

export function saveRatingIndex(file: string, index: RatingIndex): void {
  fs.writeFileSync(file, JSON.stringify(index, null, 2));
}

export function setRating(
  index: RatingIndex,
  label: string,
  rating: number,
  note?: string
): RatingIndex {
  if (rating < 1 || rating > 5) {
    throw new RangeError(`Rating must be between 1 and 5, got ${rating}`);
  }
  return {
    ...index,
    ratings: {
      ...index.ratings,
      [label]: { label, rating, note, ratedAt: new Date().toISOString() },
    },
  };
}

export function removeRating(index: RatingIndex, label: string): RatingIndex {
  const { [label]: _removed, ...rest } = index.ratings;
  return { ...index, ratings: rest };
}

export function getRating(
  index: RatingIndex,
  label: string
): RatingEntry | undefined {
  return index.ratings[label];
}

export function listRatings(index: RatingIndex): RatingEntry[] {
  return Object.values(index.ratings).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export function topRated(index: RatingIndex, n = 5): RatingEntry[] {
  return Object.values(index.ratings)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, n);
}
