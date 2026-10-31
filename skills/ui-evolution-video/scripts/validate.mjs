import Ajv from 'ajv';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, inside, isMain, readJSON, root} from './io.mjs';

const ajv = new Ajv({allErrors: true, strict: false});
const schemas = new Map();
export function validate(kind, value) {
  if (!schemas.has(kind)) schemas.set(kind, ajv.compile(readJSON(resolve(root, 'schemas', `${kind}.schema.json`))));
  const check = schemas.get(kind);
  if (!check(value)) throw new Error(`${kind}: ${ajv.errorsText(check.errors, {separator: '\n'})}`);
  return value;
}
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const unique = (values, context) => requireThat(new Set(values).size === values.length, `Duplicate ${context}`);

export function validateState(state, project) {
  validate('state', state);
  unique(state.elements.map((e) => e.id), `element IDs in ${state.id}`);
  const elements = new Map(state.elements.map((e) => [e.id, e]));
  if (state.source.kind === 'git') requireThat(state.source.revision, `${state.id}: missing immutable revision`);
  for (const element of elements.values()) {
    let parent = element.parent;
    const visited = new Set([element.id]);
    while (parent !== null) {
      requireThat(elements.has(parent), `${element.id}: missing parent ${parent}`);
      requireThat(!visited.has(parent), `${element.id}: parent cycle`);
      visited.add(parent);
      parent = elements.get(parent).parent;
    }
    if (element.kind === 'image' && project) {
      requireThat(existsSync(inside(resolve(project, 'public'), element.asset)), `Missing asset ${element.asset}`);
    }
  }
  return state;
}

export function loadProject(project, {draft = false} = {}) {
  const data = resolve(project, 'data');
  const manifest = validate('manifest', readJSON(resolve(data, 'manifest.json')));
  for (const font of manifest.fonts ?? []) {
    requireThat(existsSync(inside(resolve(project, 'public'), font.src)), `Missing font ${font.src}`);
  }
  unique(manifest.milestones.map((m) => m.id), 'milestone IDs');
  const states = manifest.milestones.map((m) => {
    const state = validateState(readJSON(inside(data, m.file)), project);
    requireThat(state.id === m.id, `Milestone ID differs from state file: ${m.id}`);
    return state;
  });
  const correspondence = validate('correspondence', readJSON(resolve(data, 'correspondence.json')));
  const timeline = validate('timeline', readJSON(resolve(data, 'timeline.json')));
  requireThat(correspondence.transitions.length === states.length - 1, 'Correspondence must cover adjacent milestones');
  requireThat(timeline.transitions.length === states.length - 1, 'Timeline must cover adjacent milestones');
  for (const state of states) {
    requireThat(state.viewport.width === states[0].viewport.width && state.viewport.height === states[0].viewport.height,
      'Normalize all captured viewports before planning');
  }
  let previousEnd = -1;
  correspondence.transitions.forEach((transition, i) => {
    const a = states[i];
    const b = states[i + 1];
    const timing = timeline.transitions[i];
    requireThat(transition.from === a.id && transition.to === b.id, 'Correspondence order differs from manifest');
    requireThat(timing.from === a.id && timing.to === b.id, 'Timeline order differs from manifest');
    requireThat(timing.start > previousEnd && timing.end > timing.start && timing.end < timeline.durationInFrames,
      'Transitions must be ordered, nonoverlapping, and inside the video');
    previousEnd = timing.end;
    unique(transition.matches.map((m) => m.id), 'match IDs');
    unique(timing.tracks.map((t) => t.match), 'track IDs');
    const seen = {a: new Set(), b: new Set()};
    for (const match of transition.matches) {
      const sizes = [match.a.length, match.b.length];
      const shape = {
        persistent: sizes[0] === 1 && sizes[1] === 1,
        'content-change': sizes[0] === 1 && sizes[1] === 1,
        added: sizes[0] === 0 && sizes[1] === 1,
        removed: sizes[0] === 1 && sizes[1] === 0,
        split: sizes[0] === 1 && sizes[1] > 1,
        merge: sizes[0] > 1 && sizes[1] === 1,
      }[match.category];
      requireThat(shape, `Wrong cardinality for ${match.category}: ${match.id}`);
      if (!draft) requireThat(match.reviewed, `Review correspondence before rendering: ${match.id}`);
      for (const [side, state] of [['a', a], ['b', b]]) {
        for (const id of match[side]) {
          requireThat(state.elements.some((e) => e.id === id), `Unknown ${side} element: ${id}`);
          requireThat(!seen[side].has(id), `Element mapped twice: ${id}`);
          seen[side].add(id);
        }
      }
      const track = timing.tracks.find((t) => t.match === match.id);
      requireThat(track && track.start >= timing.start && track.end <= timing.end && track.end > track.start,
        `Missing or invalid track: ${match.id}`);
    }
    requireThat(timing.tracks.length === transition.matches.length, 'Timeline has unknown tracks');
    requireThat(seen.a.size === a.elements.length && seen.b.size === b.elements.length, 'Correspondence omits elements');
  });
  return {states, correspondence, timeline, manifest};
}

if (isMain(import.meta.url)) cli(() => {
  const scene = loadProject(resolve(process.argv[2] ?? '.'), {draft: process.argv.includes('--draft')});
  console.log(`Valid: ${scene.states.length} states, ${scene.correspondence.transitions.length} transitions`);
});
