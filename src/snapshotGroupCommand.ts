import * as fs from 'fs/promises';
import {
  emptyGroupIndex,
  createGroup,
  deleteGroup,
  addLabelToGroup,
  removeLabelFromGroup,
  listGroups,
  GroupIndex,
} from './snapshot-group';

async function loadIndex(file: string): Promise<GroupIndex> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as GroupIndex;
  } catch {
    return emptyGroupIndex();
  }
}

async function saveIndex(file: string, index: GroupIndex): Promise<void> {
  await fs.writeFile(file, JSON.stringify(index, null, 2), 'utf8');
}

export async function cmdGroupCreate(
  indexFile: string,
  name: string,
  labels: string[]
): Promise<void> {
  const index = await loadIndex(indexFile);
  const updated = createGroup(index, name, labels);
  await saveIndex(indexFile, updated);
  console.log(`Group "${name}" created with ${labels.length} label(s).`);
}

export async function cmdGroupDelete(
  indexFile: string,
  name: string
): Promise<void> {
  const index = await loadIndex(indexFile);
  const updated = deleteGroup(index, name);
  await saveIndex(indexFile, updated);
  console.log(`Group "${name}" deleted.`);
}

export async function cmdGroupAdd(
  indexFile: string,
  name: string,
  label: string
): Promise<void> {
  const index = await loadIndex(indexFile);
  const updated = addLabelToGroup(index, name, label);
  await saveIndex(indexFile, updated);
  console.log(`Label "${label}" added to group "${name}".`);
}

export async function cmdGroupRemove(
  indexFile: string,
  name: string,
  label: string
): Promise<void> {
  const index = await loadIndex(indexFile);
  const updated = removeLabelFromGroup(index, name, label);
  await saveIndex(indexFile, updated);
  console.log(`Label "${label}" removed from group "${name}".`);
}

export async function cmdGroupList(indexFile: string): Promise<void> {
  const index = await loadIndex(indexFile);
  const groups = listGroups(index);
  if (groups.length === 0) {
    console.log('No groups defined.');
    return;
  }
  for (const g of groups) {
    console.log(`${g.name} (${g.labels.length} snapshots): ${g.labels.join(', ')}`);
  }
}

export function cmdGroupUsage(): void {
  console.log(`
Usage: envsnap group <subcommand> [options]

Subcommands:
  create <name> [labels...]   Create a new group
  delete <name>               Delete a group
  add    <name> <label>       Add a snapshot label to a group
  remove <name> <label>       Remove a snapshot label from a group
  list                        List all groups
`);
}
