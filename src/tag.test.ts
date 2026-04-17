import { addTag, removeTag, listByTag, listAllTags, loadTags, saveTags, TagIndex } from './tag';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap_tag_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe('addTag', () => {
  it('adds a snapshot to a tag', () => {
    const idx = addTag({}, 'prod', 'snap1.json');
    expect(idx['prod']).toEqual(['snap1.json']);
  });

  it('does not duplicate entries', () => {
    let idx = addTag({}, 'prod', 'snap1.json');
    idx = addTag(idx, 'prod', 'snap1.json');
    expect(idx['prod'].length).toBe(1);
  });
});

describe('removeTag', () => {
  it('removes a snapshot from a tag', () => {
    let idx = addTag({}, 'prod', 'snap1.json');
    idx = addTag(idx, 'prod', 'snap2.json');
    idx = removeTag(idx, 'prod', 'snap1.json');
    expect(idx['prod']).toEqual(['snap2.json']);
  });

  it('deletes tag key when empty', () => {
    let idx = addTag({}, 'prod', 'snap1.json');
    idx = removeTag(idx, 'prod', 'snap1.json');
    expect(idx['prod']).toBeUndefined();
  });
});

describe('listByTag / listAllTags', () => {
  it('returns entries for a tag', () => {
    const idx = addTag(addTag({}, 'prod', 'a.json'), 'prod', 'b.json');
    expect(listByTag(idx, 'prod')).toEqual(['a.json', 'b.json']);
  });

  it('returns empty array for unknown tag', () => {
    expect(listByTag({}, 'missing')).toEqual([]);
  });

  it('lists all tag names', () => {
    const idx: TagIndex = { prod: ['a.json'], staging: ['b.json'] };
    expect(listAllTags(idx).sort()).toEqual(['prod', 'staging']);
  });
});

describe('loadTags / saveTags', () => {
  it('round-trips tag index to disk', () => {
    const f = tmpFile();
    const idx: TagIndex = { prod: ['snap.json'] };
    saveTags(f, idx);
    expect(loadTags(f)).toEqual(idx);
    fs.unlinkSync(f);
  });

  it('returns empty object for missing file', () => {
    expect(loadTags('/nonexistent/path/tags.json')).toEqual({});
  });
});
