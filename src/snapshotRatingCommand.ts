import * as path from "path";
import {
  loadRatingIndex,
  saveRatingIndex,
  setRating,
  removeRating,
  getRating,
  listRatings,
  topRated,
} from "./snapshot-rating";

const DEFAULT_FILE = path.join(process.cwd(), ".envsnap", "ratings.json");

export function cmdRatingUsage(): void {
  console.log(
    [
      "Usage: envsnap rating <subcommand> [options]",
      "",
      "Subcommands:",
      "  set <label> <1-5> [note]   Set a rating for a snapshot",
      "  remove <label>             Remove rating for a snapshot",
      "  show <label>               Show rating for a snapshot",
      "  list                       List all ratings",
      "  top [n]                    Show top-rated snapshots (default: 5)",
    ].join("\n")
  );
}

export function cmdRatingSet(
  label: string,
  rating: number,
  note?: string,
  file = DEFAULT_FILE
): void {
  let index = loadRatingIndex(file);
  index = setRating(index, label, rating, note);
  saveRatingIndex(file, index);
  console.log(`Rated snapshot "${label}": ${rating}/5${note ? ` (${note})` : ""}`);
}

export function cmdRatingRemove(label: string, file = DEFAULT_FILE): void {
  let index = loadRatingIndex(file);
  index = removeRating(index, label);
  saveRatingIndex(file, index);
  console.log(`Removed rating for "${label}"`);
}

export function cmdRatingShow(label: string, file = DEFAULT_FILE): void {
  const index = loadRatingIndex(file);
  const entry = getRating(index, label);
  if (!entry) {
    console.log(`No rating found for "${label}"`);
    return;
  }
  console.log(`${entry.label}: ${entry.rating}/5${entry.note ? ` — ${entry.note}` : ""} (${entry.ratedAt})`);
}

export function cmdRatingList(file = DEFAULT_FILE): void {
  const index = loadRatingIndex(file);
  const entries = listRatings(index);
  if (entries.length === 0) {
    console.log("No ratings recorded.");
    return;
  }
  for (const e of entries) {
    console.log(`  ${e.label.padEnd(30)} ${e.rating}/5${e.note ? `  # ${e.note}` : ""}`);
  }
}

export function cmdRatingTop(n = 5, file = DEFAULT_FILE): void {
  const index = loadRatingIndex(file);
  const entries = topRated(index, n);
  if (entries.length === 0) {
    console.log("No ratings recorded.");
    return;
  }
  console.log(`Top ${n} rated snapshots:`);
  entries.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.label} — ${e.rating}/5${e.note ? ` (${e.note})` : ""}`);
  });
}
