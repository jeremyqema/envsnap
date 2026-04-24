import { loadSnapshot, Snapshot } from './snapshot';

export interface SnapshotGroup {
  name: string;
  labels: string[];
  createdAt: string;
}

export interface GroupIndex {
  groups: Record<string, SnapshotGroup>;
}

export function emptyGroupIndex(): GroupIndex {
  return { groups: {} };
}

export function createGroup(
  index: GroupIndex,
  name: string,
  labels: string[]
): GroupIndex {
  if (index.groups[name]) {
    throw new Error(`Group "${name}" already exists`);
  }
  return {
    groups: {
      ...index.groups,
      [name]: { name, labels, createdAt: new Date().toISOString() },
    },
  };
}

export function deleteGroup(index: GroupIndex, name: string): GroupIndex {
  if (!index.groups[name]) {
    throw new Error(`Group "${name}" not found`);
  }
  const groups = { ...index.groups };
  delete groups[name];
  return { groups };
}

export function addLabelToGroup(
  index: GroupIndex,
  name: string,
  label: string
): GroupIndex {
  const group = index.groups[name];
  if (!group) throw new Error(`Group "${name}" not found`);
  if (group.labels.includes(label)) return index;
  return {
    groups: {
      ...index.groups,
      [name]: { ...group, labels: [...group.labels, label] },
    },
  };
}

export function removeLabelFromGroup(
  index: GroupIndex,
  name: string,
  label: string
): GroupIndex {
  const group = index.groups[name];
  if (!group) throw new Error(`Group "${name}" not found`);
  return {
    groups: {
      ...index.groups,
      [name]: { ...group, labels: group.labels.filter((l) => l !== label) },
    },
  };
}

export function listGroups(index: GroupIndex): SnapshotGroup[] {
  return Object.values(index.groups).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function resolveGroupSnapshots(
  group: SnapshotGroup,
  dir: string
): Promise<Array<{ label: string; snapshot: Snapshot }>> {
  const results: Array<{ label: string; snapshot: Snapshot }> = [];
  for (const label of group.labels) {
    try {
      const snapshot = await loadSnapshot(`${dir}/${label}.json`);
      results.push({ label, snapshot });
    } catch {
      // skip missing snapshots
    }
  }
  return results;
}
