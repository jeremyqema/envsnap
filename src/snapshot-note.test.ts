import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  emptyNoteIndex,
  loadNoteIndex,
  saveNoteIndex,
  setNote,
  removeNote,
  getNote,
  listNotes,
} from './snapshot-note';

function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'envsnap-note-'));
  return join(dir, 'notes.json');
}

describe('snapshot-note', () => {
  it('emptyNoteIndex returns empty structure', () => {
    const idx = emptyNoteIndex();
    expect(idx.notes).toEqual({});
  });

  it('loadNoteIndex returns empty index for missing file', () => {
    const idx = loadNoteIndex('/nonexistent/path/notes.json');
    expect(idx.notes).toEqual({});
  });

  it('saveNoteIndex and loadNoteIndex round-trip', () => {
    const path = tmpFile();
    const idx = setNote(emptyNoteIndex(), 'prod-v1', 'initial production snapshot');
    saveNoteIndex(path, idx);
    const loaded = loadNoteIndex(path);
    expect(loaded.notes['prod-v1'].note).toBe('initial production snapshot');
  });

  it('setNote creates a new note entry', () => {
    const idx = setNote(emptyNoteIndex(), 'staging', 'staging env note');
    const entry = idx.notes['staging'];
    expect(entry.label).toBe('staging');
    expect(entry.note).toBe('staging env note');
    expect(entry.createdAt).toBeDefined();
    expect(entry.updatedAt).toBeDefined();
  });

  it('setNote preserves createdAt on update', () => {
    let idx = setNote(emptyNoteIndex(), 'dev', 'first note');
    const original = idx.notes['dev'].createdAt;
    idx = setNote(idx, 'dev', 'updated note');
    expect(idx.notes['dev'].createdAt).toBe(original);
    expect(idx.notes['dev'].note).toBe('updated note');
  });

  it('removeNote deletes the entry', () => {
    let idx = setNote(emptyNoteIndex(), 'test', 'some note');
    idx = removeNote(idx, 'test');
    expect(idx.notes['test']).toBeUndefined();
  });

  it('getNote returns undefined for missing label', () => {
    const idx = emptyNoteIndex();
    expect(getNote(idx, 'missing')).toBeUndefined();
  });

  it('listNotes returns sorted entries', () => {
    let idx = emptyNoteIndex();
    idx = setNote(idx, 'z-label', 'note z');
    idx = setNote(idx, 'a-label', 'note a');
    idx = setNote(idx, 'm-label', 'note m');
    const notes = listNotes(idx);
    expect(notes.map(n => n.label)).toEqual(['a-label', 'm-label', 'z-label']);
  });
});
