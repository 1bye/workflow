import {cpSync, existsSync, mkdirSync} from 'node:fs';
import {basename, resolve} from 'node:path';
import {cli, isMain, readJSON, root, writeJSON} from './io.mjs';

export function initProject(destination) {
  if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
  mkdirSync(destination, {recursive: true});
  cpSync(resolve(root, 'templates/remotion-template/src'), resolve(destination, 'src'), {recursive: true});
  for (const item of ['scripts', 'schemas', 'package.json', 'package-lock.json']) {
    cpSync(resolve(root, item), resolve(destination, item), {recursive: true,
      filter: (path) => basename(path) !== 'init-project.mjs'});
  }
  const pkg = readJSON(resolve(destination, 'package.json'));
  delete pkg.scripts.test;
  delete pkg.scripts['eval:fixtures'];
  writeJSON(resolve(destination, 'package.json'), pkg);
  mkdirSync(resolve(destination, 'data/states'), {recursive: true});
  mkdirSync(resolve(destination, 'public/assets'), {recursive: true});
  writeJSON(resolve(destination, 'data/manifest.json'), {
    version: 1, milestones: [], omitted: [], traversal: 'two supplied sources', budgetSeconds: 300,
    reference: 'No external reference; restrained shared-element UI transformation.', assumptions: [],
    review: {frames: 'pending', playback: 'not-inspected', notes: []},
  });
  console.log(`Created ${destination}. Fill the states and manifest, then run plan.mjs.`);
}
if (isMain(import.meta.url)) cli(() => {
  if (!process.argv[2]) throw new Error('Usage: init-project.mjs NEW_PROJECT_DIRECTORY');
  initProject(resolve(process.argv[2]));
});
