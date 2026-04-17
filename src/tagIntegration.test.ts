import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addTag, removeTag, loadTags, saveTags } from './tag';
import { cmdTagAdd, cmdTagList } from './tagCommand';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap_tagint_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe('tag integration', () => {
  it('supports multiple snapshots under one tag', () => {
    const f = tmpFile();
    cmdTagAdd('snap_v1.json', 'release', f);
    cmdTagAdd('snap_v2.json', 'release', f);
    const idx = loadTags(f);
    expect(idx['release']).toHaveLength(2);
    fs.unlinkSync(f);
  });

  it('preserves other tags when removing one entry', () => {
    const f = tmpFile();
    let idx = addTag({}, 'prod', 'a.json');
    idx = addTag(idx, 'staging', 'b.json');
    idx = removeTag(idx, 'prod', 'a.json');
    saveTags(f, idx);
    const loaded = loadTags(f);
    expect(loaded['staging']).toEqual(['b.json']);
    expect(loaded['prod']).toBeUndefined();
    fs.unlinkSync(f);
  });

  it('cmdTagList shows no-tags message on empty index', () => {
    const f = tmpFile();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdTagList(undefined, f);
    expect(spy).toHaveBeenCalledWith('No tags defined.');
    spy.mockRestore();
  });
});
