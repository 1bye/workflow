import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, inside, isMain, readJSON, writeJSON} from './io.mjs';
import {validate, validateState} from './validate.mjs';

export function proposeMatches(a, b) {
  const unused = new Map(b.elements.map((e) => [e.id, e]));
  const matches = [];
  for (const element of a.elements) {
    let target = unused.get(element.id);
    let reason = 'Same explicit semantic ID; inspect identity and visual evidence.';
    let confidence = 0.99;
    if (!target) {
      const candidates = [...unused.values()].filter((e) => e.kind === element.kind &&
        ((element.text?.trim() && e.text === element.text) || (element.evidence.name && e.evidence.name === element.evidence.name)) &&
        e.evidence.role === element.evidence.role);
      const peers = a.elements.filter((e) => e.kind === element.kind && e.text === element.text &&
        e.evidence.name === element.evidence.name && e.evidence.role === element.evidence.role);
      target = candidates.length === 1 && peers.length === 1 ? candidates[0] : undefined;
      reason = 'Unique text or accessible name with matching role and kind; inspect meaning.';
      confidence = 0.85;
    }
    if (target) {
      unused.delete(target.id);
      matches.push({id: `m${matches.length}`, a: [element.id], b: [target.id],
        category: element.text !== target.text || element.kind !== target.kind ? 'content-change' : 'persistent',
        reason, confidence, reviewed: false});
    } else matches.push({id: `m${matches.length}`, a: [element.id], b: [], category: 'removed',
      reason: 'No unambiguous counterpart found; verify removal or supply a manual match.', confidence: 0.4, reviewed: false});
  }
  for (const element of unused.values()) matches.push({id: `m${matches.length}`, a: [], b: [element.id], category: 'added',
    reason: 'No unambiguous counterpart found; verify addition or supply a manual match.', confidence: 0.4, reviewed: false});
  return {from: a.id, to: b.id, matches};
}

export function plan(project) {
  const data = resolve(project, 'data');
  const manifest = validate('manifest', readJSON(resolve(data, 'manifest.json')));
  const states = manifest.milestones.map((m) => validateState(readJSON(inside(data, m.file)), project));
  for (const name of ['correspondence.json', 'timeline.json']) {
    if (existsSync(resolve(data, name))) throw new Error(`Refusing to overwrite ${name}; edit the existing plan or move it aside.`);
  }
  const transitions = states.slice(1).map((b, i) => proposeMatches(states[i], b));
  const fps = 60;
  let cursor = 60;
  const timings = transitions.map((t) => {
    const start = cursor;
    const end = start + 300;
    cursor = end + 60;
    return {from: t.from, to: t.to, start, end,
      tracks: t.matches.map((m, i) => ({match: m.id, start: start + Math.min(i, 8) * 4, end: end - (8 - Math.min(i, 8)) * 3}))};
  });
  writeJSON(resolve(data, 'correspondence.json'), {version: 1, transitions});
  writeJSON(resolve(data, 'timeline.json'), {version: 1, width: Math.ceil(states[0].viewport.width / 2) * 2, height: Math.ceil(states[0].viewport.height / 2) * 2,
    fps, durationInFrames: cursor + 120, transitions: timings});
  console.log('Draft written. Inspect identity, grouping, confidence, and track order; set reviewed:true only after inspection.');
}
if (isMain(import.meta.url)) cli(() => plan(resolve(process.argv[2] ?? '.')));
