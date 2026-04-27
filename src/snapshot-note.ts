import { readFileSync, writeFileSync } from 'fs';

export interface NoteEntry {
  label: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteIndex {
  notes: Record<string, NoteEntry>;
}

export function emptyNoteIndex(): NoteIndex {
  return { notes: {} };
}

export function loadNoteIndex(path: string): NoteIndex {
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as NoteIndex;
  } catch {
    return emptyNoteIndex();
  }
}

export function saveNoteIndex(path: string, index: NoteIndex): void {
  writeFileSync(path, JSON.stringify(index, null, 2), 'utf-8');
}

export function setNote(index: NoteIndex, label: string, note: string): NoteIndex {
  const now = new Date().toISOString();
  const existing = index.notes[label];
  return {
    ...index,
    notes: {
      ...index.notes,
      [label]: {
        label,
        note,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      },
    },
  };
}

export function removeNote(index: NoteIndex, label: string): NoteIndex {
  const notes = { ...index.notes };
  delete notes[label];
  return { ...index, notes };
}

export function getNote(index: NoteIndex, label: string): NoteEntry | undefined {
  return index.notes[label];
}

export function listNotes(index: NoteIndex): NoteEntry[] {
  return Object.values(index.notes).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}
