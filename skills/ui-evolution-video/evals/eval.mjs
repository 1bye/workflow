import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, isMain, readJSON, root, writeJSON} from '../scripts/io.mjs';
import {loadProject} from '../scripts/validate.mjs';
import {makeFixtures} from './fixtures.mjs';

export function score(caseId, project, fixtureDir) {
  const testCase = readJSON(resolve(root, 'evals/cases', `${caseId}.json`));
  const raw = readJSON(resolve(fixtureDir, 'sources.json'));
  const scene = loadProject(project);
  const checks = [];
  const check = (name, pass) => checks.push({name, pass: Boolean(pass)});
  const first = scene.states[0];
  const last = scene.states.at(-1);
  if (testCase.start) check('start revision is immutable and correct', first.source.revision === raw.revisions[testCase.start]);
  check('end source is correct', testCase.check === 'screenshot'
    ? last.source.kind === 'code' && /after\.html$/.test(last.source.ref)
    : last.source.revision === raw.revisions[testCase.end]);
  check('mapping evidence is specific', scene.correspondence.transitions.every((t) => t.matches.every((m) =>
    m.reason.trim().split(/\s+/).length >= 4)));
  check('video delivered', existsSync(resolve(project, 'artifacts/evolution.mp4')));
  check('export frames extracted', existsSync(resolve(project, 'artifacts/review/index.json')));
  if (testCase.check === 'reparent') {
    const a = first.elements.find((e) => e.id === 'delete-button');
    const b = last.elements.find((e) => e.id === 'delete-button');
    check('reparented control retains identity', a && b && a.parent !== b.parent &&
      scene.correspondence.transitions.some((t) => t.matches.some((m) => m.category === 'persistent' && m.a.includes(a.id) && m.b.includes(b.id))));
  }
  if (testCase.check === 'screenshot') {
    check('screenshot reconstruction is disclosed', first.source.kind === 'screenshot' && first.source.method === 'screenshot-rebuild' && first.source.assumptions.length > 0);
  }
  if (testCase.check === 'selection') {
    const shas = scene.states.map((s) => s.source.revision);
    check('visual intermediate retained', shas.includes(raw.revisions.aligned));
    check('documentation commit omitted', !shas.includes(raw.revisions.docs) && scene.manifest.omitted.some((o) => o.ref === raw.revisions.docs));
  }
  if (testCase.check === 'fallback') {
    const attempts = first.source.attempts;
    const failed = attempts.findIndex((a) => a.method === 'full-app' && ['failed', 'timeout', 'skipped'].includes(a.status));
    const success = attempts.findIndex((a) => a.status === 'succeeded' && a.method !== 'full-app');
    check('failure and fallback recorded in order', failed >= 0 && success > failed && first.source.method !== 'full-app');
    check('budget retained', scene.manifest.budgetSeconds === 2 && attempts.filter((a) =>
      ['full-app', 'component-harness'].includes(a.method)).reduce((sum, a) => sum + a.seconds, 0) <= 3.5);
  }
  return {case: caseId, score: Math.round(100 * checks.filter((c) => c.pass).length / checks.length), checks,
    visualReview: 'Separate human rubric; the artifact score does not establish motion quality.'};
}

if (isMain(import.meta.url)) cli(async () => {
  const [command, caseId, project, fixtureDir] = process.argv.slice(2);
  if (command === 'fixtures') {
    const destination = resolve(caseId ?? 'evals/runs/fixtures');
    await makeFixtures(destination, process.env.UI_EVOLUTION_BROWSER);
    console.log(`Raw fixtures: ${destination}`);
  } else if (command === 'score' && caseId && project && fixtureDir) {
    const result = score(caseId, resolve(project), resolve(fixtureDir));
    writeJSON(resolve(project, 'artifacts/eval-score.json'), result);
    console.log(JSON.stringify(result, null, 2));
    if (result.checks.some((c) => !c.pass)) process.exitCode = 1;
  } else throw new Error('Usage: eval.mjs fixtures NEW_DIRECTORY | score CASE PROJECT FIXTURE_DIRECTORY');
});
