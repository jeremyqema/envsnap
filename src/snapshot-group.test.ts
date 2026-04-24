import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  emptyGroupIndex,
  createGroup,
  deleteGroup,
  addLabelToGroup,
  removeLabelFromGroup,
  listGroups,
} from './snapshot-group';
import {
  cmdGroupCreate,
  cmdGroupDelete,
  cmdGroupAdd,
  cmdGroupRemove,
  cmdGroupList,
} from './snapshotGroupCommand';

async function tmpFile(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'envsnap-group-'));
  return path.join(dir, 'groups.json');
}

describe('snapshot-group core', () => {
  test('emptyGroupIndex returns empty groups', () => {
    expect(emptyGroupIndex()).toEqual({ groups: {} });
  });

  test('createGroup adds a group', () => {
    const idx = emptyGroupIndex();
    const updated = createGroup(idx, 'prod', ['snap-1', 'snap-2']);
    expect(updated.groups['prod']).toBeDefined();
    expect(updated.groups['prod'].labels).toEqual(['snap-1', 'snap-2']);
  });

  test('createGroup throws if group exists', () => {
    const idx = createGroup(emptyGroupIndex(), 'prod', []);
    expect(() => createGroup(idx, 'prod', [])).toThrow('already exists');
  });

  test('deleteGroup removes a group', () => {
    const idx = createGroup(emptyGroupIndex(), 'prod', ['snap-1']);
    const updated = deleteGroup(idx, 'prod');
    expect(updated.groups['prod']).toBeUndefined();
  });

  test('deleteGroup throws if group missing', () => {
    expect(() => deleteGroup(emptyGroupIndex(), 'missing')).toThrow('not found');
  });

  test('addLabelToGroup appends label', () => {
    const idx = createGroup(emptyGroupIndex(), 'staging', ['a']);
    const updated = addLabelToGroup(idx, 'staging', 'b');
    expect(updated.groups['staging'].labels).toEqual(['a', 'b']);
  });

  test('addLabelToGroup is idempotent', () => {
    const idx = createGroup(emptyGroupIndex(), 'staging', ['a']);
    const updated = addLabelToGroup(idx, 'staging', 'a');
    expect(updated.groups['staging'].labels).toEqual(['a']);
  });

  test('removeLabelFromGroup removes label', () => {
    const idx = createGroup(emptyGroupIndex(), 'staging', ['a', 'b']);
    const updated = removeLabelFromGroup(idx, 'staging', 'a');
    expect(updated.groups['staging'].labels).toEqual(['b']);
  });

  test('listGroups returns sorted array', () => {
    let idx = emptyGroupIndex();
    idx = createGroup(idx, 'z-group', []);
    idx = createGroup(idx, 'a-group', []);
    const list = listGroups(idx);
    expect(list[0].name).toBe('a-group');
    expect(list[1].name).toBe('z-group');
  });
});

describe('snapshotGroupCommand', () => {
  test('cmdGroupCreate and cmdGroupList', async () => {
    const file = await tmpFile();
    await cmdGroupCreate(file, 'prod', ['snap-1']);
    const lines: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => lines.push(msg);
    await cmdGroupList(file);
    console.log = orig;
    expect(lines.some((l) => l.includes('prod'))).toBe(true);
  });

  test('cmdGroupAdd and cmdGroupRemove', async () => {
    const file = await tmpFile();
    await cmdGroupCreate(file, 'dev', []);
    await cmdGroupAdd(file, 'dev', 'snap-x');
    const raw = JSON.parse(await fs.readFile(file, 'utf8'));
    expect(raw.groups['dev'].labels).toContain('snap-x');
    await cmdGroupRemove(file, 'dev', 'snap-x');
    const raw2 = JSON.parse(await fs.readFile(file, 'utf8'));
    expect(raw2.groups['dev'].labels).not.toContain('snap-x');
  });

  test('cmdGroupDelete removes group', async () => {
    const file = await tmpFile();
    await cmdGroupCreate(file, 'temp', ['s1']);
    await cmdGroupDelete(file, 'temp');
    const raw = JSON.parse(await fs.readFile(file, 'utf8'));
    expect(raw.groups['temp']).toBeUndefined();
  });
});
