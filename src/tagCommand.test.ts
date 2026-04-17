import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdTagAdd, cmdTagRemove, cmdTagList } from './tagCommand';
import { loadTags } from './tag';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsnap_tagcmd_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe('cmdTagAdd', () => {
  it('persists a tag to the index', () => {
    const f = tmpFile();
    cmdTagAdd('snap.json', 'prod', f);
    const idx = loadTags(f);
    expect(idx['prod']).toContain('snap.json');
    fs.unlinkSync(f);
  });
});

describe('cmdTagRemove', () => {
  it('removes a tag entry from the index', () => {
    const f = tmpFile();
    cmdTagAdd('snap.json', 'prod', f);
    cmdTagRemove('snap.json', 'prod', f);
    const idx = loadTags(f);
    expect(idx['prod']).toBeUndefined();
    fs.unlinkSync(f);
  });
});

describe('cmdTagList', () => {
  it('prints snapshots for a given tag', () => {
    const f = tmpFile();
    cmdTagAdd('a.json', 'staging', f);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdTagList('staging', f);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('a.json'));
    spy.mockRestore();
    fs.unlinkSync(f);
  });

  it('prints all tags when no tag specified', () => {
    const f = tmpFile();
    cmdTagAdd('a.json', 'prod', f);
    cmdTagAdd('b.json', 'staging', f);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdTagList(undefined, f);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('prod');
    expect(output).toContain('staging');
    spy.mockRestore();
    fs.unlinkSync(f);
  });
});
