import * as fs from "fs";

export interface Bookmark {
  label: string;
  description: string;
  createdAt: string;
  tags?: string[];
}

export interface BookmarkIndex {
  bookmarks: Record<string, Bookmark>;
}

export function emptyBookmarkIndex(): BookmarkIndex {
  return { bookmarks: {} };
}

export function loadBookmarkIndex(file: string): BookmarkIndex {
  if (!fs.existsSync(file)) return emptyBookmarkIndex();
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as BookmarkIndex;
  } catch {
    return emptyBookmarkIndex();
  }
}

export function saveBookmarkIndex(file: string, index: BookmarkIndex): void {
  fs.writeFileSync(file, JSON.stringify(index, null, 2), "utf8");
}

export function addBookmark(
  index: BookmarkIndex,
  label: string,
  description: string,
  tags?: string[]
): BookmarkIndex {
  const bookmark: Bookmark = {
    label,
    description,
    createdAt: new Date().toISOString(),
    tags: tags ?? [],
  };
  return { bookmarks: { ...index.bookmarks, [label]: bookmark } };
}

export function removeBookmark(index: BookmarkIndex, label: string): BookmarkIndex {
  const updated = { ...index.bookmarks };
  delete updated[label];
  return { bookmarks: updated };
}

export function getBookmark(index: BookmarkIndex, label: string): Bookmark | undefined {
  return index.bookmarks[label];
}

export function listBookmarks(index: BookmarkIndex): Bookmark[] {
  return Object.values(index.bookmarks).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function findBookmarksByTag(index: BookmarkIndex, tag: string): Bookmark[] {
  return listBookmarks(index).filter((b) => (b.tags ?? []).includes(tag));
}
