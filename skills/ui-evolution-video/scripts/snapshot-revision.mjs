import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, isMain} from './io.mjs';

export function snapshot(repo, ref, destination) {
  if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
  const revision = spawnSync('git', ['-C', repo, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], {encoding: 'utf8'});
  if (revision.status !== 0) throw new Error(revision.stderr || 'Cannot resolve revision');
  const sha = revision.stdout.trim();
  const archive = spawnSync('git', ['-C', repo, 'archive', '--format=tar', sha], {maxBuffer: 256 * 1024 * 1024});
  if (archive.status !== 0) throw new Error(archive.stderr.toString());
  mkdirSync(destination, {recursive: true});
  const extract = spawnSync('tar', ['-xf', '-', '-C', destination], {input: archive.stdout});
  if (extract.status !== 0) throw new Error(extract.stderr.toString());
  return sha;
}
if (isMain(import.meta.url)) cli(() => {
  const [repo, ref, out] = process.argv.slice(2);
  if (!repo || !ref || !out) throw new Error('Usage: snapshot-revision.mjs REPOSITORY REVISION NEW_DIRECTORY');
  console.log(snapshot(resolve(repo), ref, resolve(out)));
});
