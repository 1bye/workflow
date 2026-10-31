import {interpolateColors} from 'remotion';

const lerp = (a, b, p) => a + (b - a) * p;
export function progress(frame, start, end) {
  const p = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return 1 - (1 - p) ** 3;
}
export function geometry(a, b, p) {
  return Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, lerp(a[key], b[key], p)]));
}
function blendStyle(a, b, p) {
  if (p === 0) return a;
  if (p === 1) return b;
  const style = {...(p < 0.5 ? a : b)};
  for (const key of ['backgroundColor', 'borderColor', 'color']) {
    if (a[key] && b[key]) style[key] = interpolateColors(p, [0, 1], [a[key], b[key]]);
  }
  if (a.borderWidth !== undefined && b.borderWidth !== undefined) style.borderWidth = lerp(a.borderWidth, b.borderWidth, p);
  const ar = /^(\d+(?:\.\d+)?)px$/.exec(a.borderRadius ?? '');
  const br = /^(\d+(?:\.\d+)?)px$/.exec(b.borderRadius ?? '');
  if (ar && br) style.borderRadius = `${lerp(Number(ar[1]), Number(br[1]), p)}px`;
  return style;
}
const staticLayers = (state) => state.elements.map((element) => ({...element, key: element.id}));

export function layersAt(scene, frame) {
  const {states, correspondence, timeline} = scene;
  let i = timeline.transitions.findIndex((t) => frame <= t.end);
  if (i < 0) return {layers: staticLayers(states.at(-1)), background: states.at(-1).background};
  const transition = timeline.transitions[i];
  const a = states[i];
  const b = states[i + 1];
  if (frame < transition.start) return {layers: staticLayers(a), background: a.background};
  const amap = new Map(a.elements.map((e) => [e.id, e]));
  const bmap = new Map(b.elements.map((e) => [e.id, e]));
  const tracks = new Map(transition.tracks.map((t) => [t.match, t]));
  const layers = [];
  for (const match of correspondence.transitions[i].matches) {
    const track = tracks.get(match.id);
    const p = progress(frame, track.start, track.end);
    const left = match.a.map((id) => amap.get(id));
    const right = match.b.map((id) => bmap.get(id));
    if (!left.length) {
      for (const e of right) layers.push({...e, key: `${match.id}-b-${e.id}`, opacity: e.opacity * p});
    } else if (!right.length) {
      for (const e of left) layers.push({...e, key: `${match.id}-a-${e.id}`, opacity: e.opacity * (1 - p)});
    } else {
      // For a split/merge, the ordered first pair carries identity; remaining members enter/leave locally.
      const from = left[0];
      const to = right[0];
      const rect = geometry(from.rect, to.rect, p);
      const z = p < 0.5 ? from.z : to.z;
      const typeKeys = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'whiteSpace', 'textAlign', 'padding'];
      const radiusChangesWithoutInterpolation = from.style.borderRadius !== to.style.borderRadius &&
        ![from.style.borderRadius, to.style.borderRadius].every((r) => /^(\d+(?:\.\d+)?)px$/.test(r ?? ''));
      const replacement = from.kind !== to.kind || from.text !== to.text || from.asset !== to.asset ||
        [...typeKeys, 'boxShadow', 'borderStyle', 'objectFit'].some((key) => from.style[key] !== to.style[key]) ||
        radiusChangesWithoutInterpolation;
      if (replacement) {
        layers.push({...from, key: `${match.id}-a`, rect, z, opacity: from.opacity * (1 - p)});
        layers.push({...to, key: `${match.id}-b`, rect, z, opacity: to.opacity * p});
      } else layers.push({...from, key: match.id, rect, z, style: blendStyle(from.style, to.style, p), opacity: lerp(from.opacity, to.opacity, p)});
      left.slice(1).forEach((e) => layers.push({...e, key: `${match.id}-a-${e.id}`, opacity: e.opacity * (1 - p)}));
      right.slice(1).forEach((e) => layers.push({...e, key: `${match.id}-b-${e.id}`, opacity: e.opacity * p}));
    }
  }
  const p = progress(frame, transition.start, transition.end);
  return {layers: layers.filter((e) => e.opacity > 0), background: interpolateColors(p, [0, 1], [a.background, b.background])};
}

export function reviewFrames(timeline) {
  const frames = new Set([0, timeline.durationInFrames - 1]);
  for (const t of timeline.transitions) {
    for (const track of [t, ...t.tracks]) {
      for (const f of [track.start - 1, track.start, track.start + 1, Math.round((track.start + track.end) / 2), track.end - 1, track.end, track.end + 1]) {
        frames.add(Math.max(0, Math.min(timeline.durationInFrames - 1, f)));
      }
    }
  }
  return [...frames].sort((a, b) => a - b);
}
