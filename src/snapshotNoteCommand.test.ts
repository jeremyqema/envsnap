import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { cmdNoteSet, cmdNoteRemove, cmdNoteShow, cmdNoteList } from './snapshotNoteCommand';
import { setNote, saveNoteIndex, emptyNoteIndex } from './snapshot-note';

function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'envsnap-notecmd-'));
  return join(dir, 'notes.json');
}

describe('snapshotNoteCommand', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('cmdNoteSet writes note to index', () => {
    const path = tmpFile();
    cmdNoteSet(['prod-v1', 'production', 'snapshot'], path);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('prod-v1'));
  });

  it('cmdNoteSet exits on missing args', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => cmdNoteSet([], '/tmp/x.json')).toThrow('exit');
    exitSpy.mockRestore();
  });

  it('cmdNoteRemove removes note from index', () => {
    const path = tmpFile();
    let idx = setNote(emptyNoteIndex(), 'old-snap', 'to remove');
    saveNoteIndex(path, idx);
    cmdNoteRemove(['old-snap'], path);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('old-snap'));
  });

  it('cmdNoteShow displays note details', () => {
    const path = tmpFile();
    const idx = setNote(emptyNoteIndex(), 'snap-1', 'my note');
    saveNoteIndex(path, idx);
    cmdNoteShow(['snap-1'], path);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('my note'));
  });

  it('cmdNoteShow prints message when note not found', () => {
    const path = tmpFile();
    cmdNoteShow(['nonexistent'], path);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No note found'));
  });

  it('cmdNoteList prints all notes', () => {
    const path = tmpFile();
    let idx = emptyNoteIndex();
    idx = setNote(idx, 'alpha', 'note alpha');
    idx = setNote(idx, 'beta', 'note beta');
    saveNoteIndex(path, idx);
    cmdNoteList(path);
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it('cmdNoteList prints message when no notes exist', () => {
    const path = tmpFile();
    cmdNoteList(path);
    expect(console.log).toHaveBeenCalledWith('No notes found.');
  });
});
