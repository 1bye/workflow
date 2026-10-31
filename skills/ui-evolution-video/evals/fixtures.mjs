import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {writeJSON} from '../scripts/io.mjs';

// Explicit primitive layers make the fixtures measurable without app dependencies.
export function settingsHTML(stage = 0) {
  const aligned = stage > 0;
  const separated = stage > 1;
  const box = (id, x, y, w, h, color = '#fafafa', parent = '') => `<div data-anim-id="${id}" data-anim-kind="box" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};border:1px solid #e5e5e5;border-radius:10px">${parent}</div>`;
  const text = (id, value, x, y, w = 260, size = 18, color = '#222') => `<span data-anim-id="${id}" data-anim-kind="text" style="left:${x}px;top:${y}px;width:${w}px;height:28px;font-size:${size}px;line-height:28px;color:${color}">${value}</span>`;
  const input = (id, value, x, y) => box(id, x, y, 310, 32, '#fff', text(`${id}-value`, value, 12, 2, 285, 15));
  const fields = text('name-label', 'Workspace name', 22, 12) + input('name-input', 'Acme', aligned ? 385 : 22, aligned ? 10 : 45) +
    text('url-label', 'Workspace URL', 22, aligned ? 68 : 104) + input('url-input', 'acme.example.dev', aligned ? 385 : 22, aligned ? 66 : 137);
  const toggle = (id, label, y, on) => text(`${id}-label`, label, 22, y) +
    box(`${id}-track`, aligned ? 646 : 22, aligned ? y + 3 : y + 35, 46, 24, on ? '#202020' : '#e5e5e5',
      box(`${id}-knob`, on ? 24 : 2, 2, 18, 18, '#fff'));
  const notifications = toggle('digest', 'Email digest', 12, true) + toggle('mentions', 'Mentions', aligned ? 64 : 91, true) + toggle('weekly', 'Weekly summary', aligned ? 116 : 170, false);
  const button = box('delete-button', aligned ? 500 : 22, aligned ? 13 : 45, 193, 34, '#ffdddd', text('delete-button-text', 'Delete workspace', 12, 3, 170, 15, '#bd3038'));
  const generalY = separated ? 200 : 190;
  const notificationY = separated ? 420 : aligned ? 330 : 410;
  const dangerY = separated ? 690 : aligned ? 520 : 700;
  const general = box('general', 180, generalY, 720, aligned ? 118 : 196, separated ? '#fff' : '#fafafa', fields);
  const notify = box('notifications', 180, notificationY, 720, aligned ? 170 : 254, separated ? '#fff' : '#fafafa', notifications);
  const danger = box('danger', 180, dangerY, 720, aligned ? 62 : 90, separated ? '#fff' : '#fafafa',
    text('delete-label', 'Delete workspace', 22, 14) + (separated ? '' : button));
  const actions = box('actions', separated ? 180 : 155, separated ? dangerY : 140, 720, separated ? 62 : 750, 'transparent', separated ? button : '');
  const headings = separated ? text('general-heading', 'General', 180, 162, 300, 16, '#777') +
    text('notifications-heading', 'Notifications', 180, 382, 300, 16, '#777') +
    text('danger-heading', 'Danger zone', 180, 652, 300, 16, '#777') : '';
  const title = text('title', 'Workspace', 180, separated ? 110 : 145, 400, 25);
  return `<!doctype html><meta charset="utf-8"><title>Workspace fixture</title><style>*{box-sizing:border-box}body{margin:0;background:#e7e7e7;font-family:Arial,sans-serif}body>div,body>span,div>div,div>span{position:absolute}span{white-space:pre-wrap} [data-anim-id="actions"]{border:0!important;pointer-events:none}</style>${separated ? '' : box('card', 145, 120, 790, aligned ? 490 : 710, '#fff')}${title}${headings}${general}${notify}${danger}${actions}`;
}

function git(repo, args, env = {}) {
  const result = spawnSync('git', ['-C', repo, ...args], {encoding: 'utf8', env: {...process.env, ...env}});
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}
export async function makeFixtures(out, browserPath) {
  if (existsSync(out)) throw new Error(`Fixture destination already exists: ${out}`);
  const repo = resolve(out, 'history');
  mkdirSync(repo, {recursive: true});
  git(repo, ['init', '-q']);
  const revisions = {};
  let day = 1;
  const commit = (id) => {
    git(repo, ['add', '.']);
    const date = `2020-01-${String(day++).padStart(2, '0')}T12:00:00Z`;
    git(repo, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', id],
      {GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date});
    revisions[id] = git(repo, ['rev-parse', 'HEAD']);
  };
  mkdirSync(resolve(repo, 'src'));
  writeFileSync(resolve(repo, 'src/settings.html'), settingsHTML(0));
  writeFileSync(resolve(repo, 'index.html'), '<!doctype html><meta charset="utf-8"><div id="root"></div><script type="module" src="./historical-unavailable.js"></script>');
  writeJSON(resolve(repo, 'package.json'), {private: true, scripts: {build: 'node -e "process.exit(1)"'}});
  commit('broken');
  writeFileSync(resolve(repo, 'index.html'), settingsHTML(0));
  writeJSON(resolve(repo, 'package.json'), {private: true, scripts: {build: 'node -e "process.exit(0)"'}});
  commit('baseline');
  writeFileSync(resolve(repo, 'notes.md'), 'Documentation only. No visual change.\n');
  commit('docs');
  writeFileSync(resolve(repo, 'index.html'), settingsHTML(1));
  commit('aligned');
  writeFileSync(resolve(repo, 'index.html'), settingsHTML(2));
  commit('separated');
  writeFileSync(resolve(out, 'before.html'), settingsHTML(0));
  writeFileSync(resolve(out, 'after.html'), settingsHTML(2));
  const browser = await chromium.launch(browserPath ? {executablePath: browserPath} : {});
  try {
    const page = await browser.newPage({viewport: {width: 1080, height: 1080}, deviceScaleFactor: 1});
    await page.goto(pathToFileURL(resolve(out, 'before.html')).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path: resolve(out, 'before.png')});
  } finally { await browser.close(); }
  writeJSON(resolve(out, 'sources.json'), {repo: 'history', revisions, screenshot: 'before.png', code: 'after.html'});
  return revisions;
}
