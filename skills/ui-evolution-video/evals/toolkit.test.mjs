import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {capture} from '../scripts/capture-state.mjs';
import {initProject} from '../scripts/init-project.mjs';
import {inside, readJSON, root, writeJSON} from '../scripts/io.mjs';
import {geometry, layersAt, progress, reviewFrames} from '../scripts/motion.mjs';
import {plan, proposeMatches} from '../scripts/plan.mjs';
import {runBounded} from '../scripts/run-bounded.mjs';
import {snapshot} from '../scripts/snapshot-revision.mjs';
import {loadProject, validateState} from '../scripts/validate.mjs';
import {score} from './eval.mjs';
import {makeFixtures, settingsHTML} from './fixtures.mjs';

const browserPath = process.env.UI_EVOLUTION_BROWSER;
const source = (ref = 'fixture') => ({kind: 'fixture', ref, method: 'full-app', assumptions: [], attempts: []});
const element = (id, text = 'Name', parent = null) => ({id, parent, kind: 'text', text,
  rect: {x: 0, y: 0, width: 100, height: 30}, style: {fontSize: 18, color: '#222'}, opacity: 1, z: 0,
  evidence: {role: 'label', name: text}});
const state = (id, elements) => ({version: 1, id, source: source(), viewport: {width: 1080, height: 1080}, background: '#eee', warnings: [], elements});

function temporary(t) {
  const dir = mkdtempSync(resolve(tmpdir(), 'ui-evolution-test-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  return dir;
}
function projectWithStates(dir, states) {
  initProject(dir);
  states.forEach((s) => writeJSON(resolve(dir, 'data/states', `${s.id}.json`), s));
  const manifest = readJSON(resolve(dir, 'data/manifest.json'));
  manifest.milestones = states.map((s) => ({id: s.id, file: `states/${s.id}.json`, reason: 'Visible layout milestone from fixture evidence.'}));
  writeJSON(resolve(dir, 'data/manifest.json'), manifest);
  plan(dir);
}
function review(dir) {
  const path = resolve(dir, 'data/correspondence.json');
  const map = readJSON(path);
  map.transitions.forEach((t) => t.matches.forEach((m) => { m.reviewed = true; }));
  writeJSON(path, map);
}

test('geometry and timing preserve endpoints and choose review boundaries', () => {
  const a = {x: 20, y: 30, width: 120, height: 20};
  const b = {x: 620, y: 450, width: 240, height: 30};
  assert.deepEqual(geometry(a, b, 0), a);
  assert.deepEqual(geometry(a, b, 1), b);
  assert.equal(progress(-1, 0, 10), 0);
  assert.equal(progress(20, 0, 10), 1);
  const frames = reviewFrames({durationInFrames: 200, transitions: [{start: 30, end: 150, tracks: [{start: 40, end: 120}]}]});
  for (const frame of [0, 29, 30, 31, 40, 80, 120, 150, 151, 199]) assert(frames.includes(frame));
});

test('matching does not guess between repeated labels', () => {
  const a = state('a', [element('old', 'Save')]);
  const b = state('b', [element('new-1', 'Save'), element('new-2', 'Save')]);
  const map = proposeMatches(a, b);
  assert.equal(map.matches.filter((m) => m.category === 'persistent').length, 0);
  assert(map.matches.every((m) => !m.reviewed && m.confidence < 0.8));
});

test('project contracts reject omitted, duplicated, unreviewed, and mistimed mappings', (t) => {
  const dir = resolve(temporary(t), 'project');
  projectWithStates(dir, [state('a', [element('field')]), state('b', [{...element('field'), rect: {x: 300, y: 0, width: 100, height: 30}}])]);
  assert.throws(() => loadProject(dir), /Review correspondence/);
  assert(loadProject(dir, {draft: true}));
  review(dir);
  const valid = readJSON(resolve(dir, 'data/correspondence.json'));
  const invalid = structuredClone(valid);
  invalid.transitions[0].matches[0].a = ['missing'];
  writeJSON(resolve(dir, 'data/correspondence.json'), invalid);
  assert.throws(() => loadProject(dir), /Unknown a element/);
  writeJSON(resolve(dir, 'data/correspondence.json'), valid);
  const duplicate = structuredClone(valid);
  duplicate.transitions[0].matches.push({...duplicate.transitions[0].matches[0], id: 'duplicate'});
  writeJSON(resolve(dir, 'data/correspondence.json'), duplicate);
  assert.throws(() => loadProject(dir), /mapped twice|Missing or invalid track/);
  writeJSON(resolve(dir, 'data/correspondence.json'), valid);
  const omitted = structuredClone(valid);
  omitted.transitions[0].matches[0].b = [];
  omitted.transitions[0].matches[0].category = 'removed';
  writeJSON(resolve(dir, 'data/correspondence.json'), omitted);
  assert.throws(() => loadProject(dir), /omits elements/);
  writeJSON(resolve(dir, 'data/correspondence.json'), valid);
  const timeline = readJSON(resolve(dir, 'data/timeline.json'));
  assert.equal(timeline.durationInFrames / timeline.fps, 9);
  timeline.transitions[0].tracks[0].end = timeline.durationInFrames + 2;
  writeJSON(resolve(dir, 'data/timeline.json'), timeline);
  assert.throws(() => loadProject(dir), /invalid track/);
  const cyclic = state('cycle', [{...element('one'), parent: 'one'}]);
  assert.throws(() => validateState(cyclic), /cycle/);
  assert.throws(() => inside(dir, '../outside'), /inside/);
  assert.throws(() => plan(dir), /overwrite/);
});

test('reparenting keeps a persistent control on a continuous screen-space path', (t) => {
  const dir = resolve(temporary(t), 'project');
  const left = element('control', 'Acme', 'old-parent');
  const right = {...element('control', 'Acme', 'new-parent'), rect: {x: 400, y: 200, width: 100, height: 30}};
  projectWithStates(dir, [state('a', [element('old-parent'), left]), state('b', [element('new-parent'), right])]);
  review(dir);
  const scene = loadProject(dir);
  const track = scene.timeline.transitions[0].tracks.find((t) => t.match === 'm1');
  const first = layersAt(scene, track.start).layers.find((l) => l.id === 'control');
  const last = layersAt(scene, track.end).layers.find((l) => l.id === 'control');
  const middle = layersAt(scene, (track.start + track.end) / 2).layers.find((l) => l.id === 'control');
  assert.deepEqual(first.rect, left.rect);
  assert.deepEqual(last.rect, right.rect);
  assert(middle.rect.x > left.rect.x && middle.rect.x < right.rect.x);
  assert.equal(layersAt(scene, track.start).layers.filter((l) => l.id === 'control').length, 1);
});

test('split mappings retain every endpoint element', (t) => {
  const dir = resolve(temporary(t), 'project');
  projectWithStates(dir, [state('a', [element('one')]), state('b', [element('two'), element('three')])]);
  const path = resolve(dir, 'data/correspondence.json');
  writeJSON(path, {version: 1, transitions: [{from: 'a', to: 'b', matches: [
    {id: 'split', a: ['one'], b: ['two', 'three'], category: 'split', reason: 'One group becomes two independent groups.', confidence: 1, reviewed: true},
  ]}]});
  const timeline = readJSON(resolve(dir, 'data/timeline.json'));
  timeline.transitions[0].tracks = [{match: 'split', start: 60, end: 240}];
  writeJSON(resolve(dir, 'data/timeline.json'), timeline);
  const scene = loadProject(dir);
  assert.equal(layersAt(scene, 60).layers.length, 1);
  assert.equal(layersAt(scene, 240).layers.length, 2);
});

test('noninterpolable appearance changes crossfade locally without stretching text', (t) => {
  const dir = resolve(temporary(t), 'project');
  const a = element('field', 'Acme');
  const b = {...element('field', 'Acme'), style: {...a.style, fontSize: 22},
    rect: {x: 400, y: 200, width: 120, height: 30}};
  projectWithStates(dir, [state('a', [a]), state('b', [b])]);
  review(dir);
  const scene = loadProject(dir);
  const track = scene.timeline.transitions[0].tracks[0];
  const middle = layersAt(scene, (track.start + track.end) / 2).layers;
  assert.equal(middle.length, 2);
  assert.deepEqual(middle[0].rect, middle[1].rect);
  assert.equal(middle[0].style.fontSize, 18);
  assert.equal(middle[1].style.fontSize, 22);
  assert.equal(middle[0].opacity + middle[1].opacity, 1);
});

test('bounded commands report failure and terminate stalled processes', async () => {
  assert.equal((await runBounded(process.execPath, ['-e', 'process.exit(2)'], {cwd: root, seconds: 2})).status, 'failed');
  const started = Date.now();
  assert.equal((await runBounded(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {cwd: root, seconds: 0.15})).status, 'timeout');
  assert(Date.now() - started < 3000);
});

test('capture records explicit selectors, assets, and real parent changes', async (t) => {
  const dir = temporary(t);
  const project = resolve(dir, 'project');
  initProject(project);
  const captures = [];
  for (const [i, stage] of [1, 2].entries()) {
    const html = resolve(dir, `${i}.html`);
    writeFileSync(html, settingsHTML(stage));
    captures.push(await capture({url: pathToFileURL(html).href, id: `s${i}`, source: source(html),
      out: resolve(project, `data/states/s${i}.json`), browserPath}));
  }
  const [a, b] = captures.map((s) => s.elements.find((e) => e.id === 'delete-button'));
  assert.equal(a.parent, 'danger');
  assert.equal(b.parent, 'actions');
  const inputA = captures[0].elements.find((e) => e.id === 'name-input');
  assert.equal(inputA.rect.width, 310);
  const imageState = await capture({url: pathToFileURL(resolve(dir, '0.html')).href, id: 'image', source: source(),
    out: resolve(project, 'data/states/image.json'), map: [{id: 'piece', selector: '[data-anim-id="name-input"]', kind: 'image'}], browserPath});
  assert(existsSync(resolve(project, 'public', imageState.elements[0].asset)));
  await assert.rejects(() => capture({url: pathToFileURL(resolve(dir, '0.html')).href, id: 'bad', source: source(),
    out: resolve(project, 'data/states/bad.json'), map: [{id: 'bad', selector: 'span'}], browserPath}), /exactly one/);
});

test('raw history includes nonvisual commits, failed builds, snapshots, and screenshot evidence', async (t) => {
  const dir = temporary(t);
  const fixtures = resolve(dir, 'fixtures');
  const revisions = await makeFixtures(fixtures, browserPath);
  const beforeStatus = spawnSync('git', ['-C', resolve(fixtures, 'history'), 'status', '--porcelain'], {encoding: 'utf8'}).stdout;
  const exportDir = resolve(dir, 'export');
  assert.equal(snapshot(resolve(fixtures, 'history'), revisions.broken, exportDir), revisions.broken);
  assert.equal(spawnSync('npm', ['run', 'build'], {cwd: exportDir}).status, 1);
  assert(!readFileSync(resolve(exportDir, 'index.html'), 'utf8').includes('Workspace name'));
  assert(readFileSync(resolve(exportDir, 'src/settings.html'), 'utf8').includes('Workspace name'));
  assert(existsSync(resolve(fixtures, 'before.png')));
  assert.equal(readFileSync(resolve(fixtures, 'history/index.html'), 'utf8'), settingsHTML(2));
  assert.equal(spawnSync('git', ['-C', resolve(fixtures, 'history'), 'status', '--porcelain'], {encoding: 'utf8'}).stdout, beforeStatus);
  assert.throws(() => snapshot(resolve(fixtures, 'history'), revisions.broken, exportDir), /already exists/);
  const project = resolve(dir, 'project');
  projectWithStates(project, [state('a', [element('field')]), state('b', [element('field')])]);
  review(project);
  const result = score('broken-revision', project, fixtures);
  assert(result.checks.some((c) => c.name.includes('fallback') && !c.pass));
  assert(result.checks.some((c) => c.name.includes('revision') && !c.pass));
});
