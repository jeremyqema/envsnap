import * as path from 'path';
import { loadTags, saveTags, addTag, removeTag, listByTag, listAllTags } from './tag';

const DEFAULT_INDEX = path.join(process.cwd(), '.envsnap_tags.json');

export function cmdTagAdd(snapshotPath: string, tag: string, indexPath = DEFAULT_INDEX): void {
  const index = loadTags(indexPath);
  const updated = addTag(index, tag, snapshotPath);
  saveTags(indexPath, updated);
  console.log(`Tagged '${snapshotPath}' with '${tag}'.`);
}

export function cmdTagRemove(snapshotPath: string, tag: string, indexPath = DEFAULT_INDEX): void {
  const index = loadTags(indexPath);
  const updated = removeTag(index, tag, snapshotPath);
  saveTags(indexPath, updated);
  console.log(`Removed tag '${tag}' from '${snapshotPath}'.`);
}

export function cmdTagList(tag: string | undefined, indexPath = DEFAULT_INDEX): void {
  const index = loadTags(indexPath);
  if (tag) {
    const entries = listByTag(index, tag);
    if (entries.length === 0) {
      console.log(`No snapshots tagged '${tag}'.`);
    } else {
      console.log(`Snapshots tagged '${tag}':\n` + entries.map(e => `  ${e}`).join('\n'));
    }
  } else {
    const tags = listAllTags(index);
    if (tags.length === 0) {
      console.log('No tags defined.');
    } else {
      tags.forEach(t => console.log(`${t} (${index[t].length})`));
    }
  }
}
