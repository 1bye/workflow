import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
export function writeJSON(path, value) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
export function inside(base, path) {
  const target = resolve(base, path);
  const rel = relative(resolve(base), target);
  if (isAbsolute(path) || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) {
    throw new Error(`Expected a path inside ${base}: ${path}`);
  }
  return target;
}
export const isMain = (url) => process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url);
export function cli(action) {
  Promise.resolve().then(action).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
