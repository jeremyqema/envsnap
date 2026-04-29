import * as fs from "fs";

export interface CommentEntry {
  label: string;
  comment: string;
  updatedAt: string;
}

export interface CommentIndex {
  comments: Record<string, CommentEntry>;
}

export function emptyCommentIndex(): CommentIndex {
  return { comments: {} };
}

export function loadCommentIndex(filePath: string): CommentIndex {
  if (!fs.existsSync(filePath)) return emptyCommentIndex();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as CommentIndex;
}

export function saveCommentIndex(filePath: string, index: CommentIndex): void {
  fs.writeFileSync(filePath, JSON.stringify(index, null, 2), "utf-8");
}

export function setComment(
  index: CommentIndex,
  label: string,
  comment: string
): CommentIndex {
  return {
    ...index,
    comments: {
      ...index.comments,
      [label]: { label, comment, updatedAt: new Date().toISOString() },
    },
  };
}

export function removeComment(
  index: CommentIndex,
  label: string
): CommentIndex {
  const updated = { ...index.comments };
  delete updated[label];
  return { ...index, comments: updated };
}

export function getComment(
  index: CommentIndex,
  label: string
): CommentEntry | undefined {
  return index.comments[label];
}

export function listComments(index: CommentIndex): CommentEntry[] {
  return Object.values(index.comments).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}
