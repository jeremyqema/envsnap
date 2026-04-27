import { loadNoteIndex, saveNoteIndex, setNote, removeNote, getNote, listNotes } from './snapshot-note';

export function cmdNoteUsage(): void {
  console.log(`Usage: envsnap note <subcommand> [options]

Subcommands:
  set <label> <note>   Attach a note to a snapshot
  remove <label>       Remove the note from a snapshot
  show <label>         Show the note for a snapshot
  list                 List all snapshot notes
`);
}

export function cmdNoteSet(args: string[], indexPath: string): void {
  const [label, ...rest] = args;
  if (!label || rest.length === 0) {
    console.error('Usage: envsnap note set <label> <note>');
    process.exit(1);
  }
  const note = rest.join(' ');
  const index = loadNoteIndex(indexPath);
  const updated = setNote(index, label, note);
  saveNoteIndex(indexPath, updated);
  console.log(`Note set for snapshot "${label}".`);
}

export function cmdNoteRemove(args: string[], indexPath: string): void {
  const [label] = args;
  if (!label) {
    console.error('Usage: envsnap note remove <label>');
    process.exit(1);
  }
  const index = loadNoteIndex(indexPath);
  const updated = removeNote(index, label);
  saveNoteIndex(indexPath, updated);
  console.log(`Note removed from snapshot "${label}".`);
}

export function cmdNoteShow(args: string[], indexPath: string): void {
  const [label] = args;
  if (!label) {
    console.error('Usage: envsnap note show <label>');
    process.exit(1);
  }
  const index = loadNoteIndex(indexPath);
  const entry = getNote(index, label);
  if (!entry) {
    console.log(`No note found for snapshot "${label}".`);
    return;
  }
  console.log(`Label:   ${entry.label}`);
  console.log(`Note:    ${entry.note}`);
  console.log(`Created: ${entry.createdAt}`);
  console.log(`Updated: ${entry.updatedAt}`);
}

export function cmdNoteList(indexPath: string): void {
  const index = loadNoteIndex(indexPath);
  const notes = listNotes(index);
  if (notes.length === 0) {
    console.log('No notes found.');
    return;
  }
  for (const entry of notes) {
    console.log(`${entry.label.padEnd(30)} ${entry.note}`);
  }
}
