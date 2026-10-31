import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {capture} from '../scripts/capture-state.mjs';
import {initProject} from '../scripts/init-project.mjs';
import {cli, readJSON, writeJSON} from '../scripts/io.mjs';
import {plan} from '../scripts/plan.mjs';
import {snapshot} from '../scripts/snapshot-revision.mjs';
import {loadProject} from '../scripts/validate.mjs';
import {makeFixtures} from './fixtures.mjs';

// Integration fixture, not an independent agent evaluation or a screenshot reconstruction.
cli(async () => {
  const out = resolve(process.argv[2] ?? 'evals/runs/smoke');
  const raw = resolve(out, 'raw');
  const project = resolve(out, 'project');
  const revisions = await makeFixtures(raw, process.env.UI_EVOLUTION_BROWSER);
  initProject(project);
  const milestones = [];
  for (const name of ['baseline', 'aligned', 'separated']) {
    const directory = resolve(out, name);
    const revision = snapshot(resolve(raw, 'history'), revisions[name], directory);
    const source = {kind: 'git', ref: name, revision, method: 'full-app', assumptions: [],
      attempts: [{method: 'full-app', status: 'succeeded', seconds: 0, reason: 'Static fixture page renders directly from the exported revision.'}]};
    await capture({url: pathToFileURL(resolve(directory, 'index.html')).href, id: name, source,
      out: resolve(project, `data/states/${name}.json`), browserPath: process.env.UI_EVOLUTION_BROWSER});
    milestones.push({id: name, file: `states/${name}.json`, reason: `Visible ${name} layout from the fixture history.`});
  }
  const manifest = readJSON(resolve(project, 'data/manifest.json'));
  manifest.milestones = milestones;
  manifest.traversal = 'First-parent chronological fixture history.';
  manifest.omitted = [{ref: revisions.docs, reason: 'Documentation-only change; rendered markup is unchanged.'}];
  writeJSON(resolve(project, 'data/manifest.json'), manifest);
  plan(project);
  const correspondence = readJSON(resolve(project, 'data/correspondence.json'));
  for (const transition of correspondence.transitions) {
    for (const match of transition.matches) {
      // Stable IDs and known fixture additions/removals provide the test oracle.
      match.reviewed = true;
      match.reason = match.a.length && match.b.length
        ? 'Same explicit semantic ID and purpose in the controlled fixture.'
        : 'Known surface or section-label addition/removal in the controlled fixture.';
    }
  }
  writeJSON(resolve(project, 'data/correspondence.json'), correspondence);
  const timeline = readJSON(resolve(project, 'data/timeline.json'));
  timeline.durationInFrames = 540;
  timeline.transitions.forEach((transition, i) => {
    transition.start = i ? 230 : 45;
    transition.end = i ? 430 : 165;
    for (const track of transition.tracks) {
      const match = correspondence.transitions[i].matches.find((m) => m.id === track.match);
      const ids = [...match.a, ...match.b];
      const heading = ids.some((id) => id.endsWith('-heading'));
      const card = ids.includes('card');
      track.start = i ? heading ? 350 : card ? 230 : 265 : 45;
      track.end = i ? heading ? 430 : card ? 290 : 390 : 165;
    }
  });
  writeJSON(resolve(project, 'data/timeline.json'), timeline);
  loadProject(project);
  mkdirSync(resolve(project, 'artifacts'), {recursive: true});
  console.log(`Integration project prepared: ${project}`);
});
