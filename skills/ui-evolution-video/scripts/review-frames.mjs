import {spawnSync} from 'node:child_process';
import {mkdirSync, readdirSync, unlinkSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, isMain, writeJSON} from './io.mjs';
import {loadProject} from './validate.mjs';
import {reviewFrames} from './motion.mjs';

function command(name, args) {
  const result = spawnSync(name, args, {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024});
  if (result.status !== 0) throw new Error(`${name}: ${result.error?.message ?? result.stderr}`);
  return result.stdout;
}
export function extractReview(project) {
  const scene = loadProject(project);
  const video = resolve(project, 'artifacts/evolution.mp4');
  const dir = resolve(project, 'artifacts/review');
  mkdirSync(dir, {recursive: true});
  const probe = JSON.parse(command('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video]));
  const stream = probe.streams.find((s) => s.codec_type === 'video');
  const [n, d] = stream.avg_frame_rate.split('/').map(Number);
  const t = scene.timeline;
  if (stream.width !== t.width || stream.height !== t.height || Math.abs(n / d - t.fps) > 0.001 ||
    Math.abs(Number(stream.duration ?? probe.format.duration) - t.durationInFrames / t.fps) > 1 / t.fps + 0.001) {
    throw new Error('Export dimensions, rate, or duration differ from the planned timeline');
  }
  const frames = reviewFrames(t);
  for (const name of readdirSync(dir)) {
    if (/^frame-\d+\.png$/.test(name)) unlinkSync(resolve(dir, name));
  }
  const select = frames.map((f) => `eq(n\\,${f})`).join('+');
  command('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `select=${select}`, '-fps_mode', 'vfr', resolve(dir, 'frame-%04d.png')]);
  const columns = 5;
  command('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', resolve(dir, 'frame-%04d.png'),
    '-vf', `scale=260:-1,tile=${columns}x${Math.ceil(frames.length / columns)}`, '-frames:v', '1', resolve(dir, 'contact-sheet.png')]);
  const index = frames.map((frame, i) => ({frame, seconds: frame / t.fps, file: `frame-${String(i + 1).padStart(4, '0')}.png`}));
  writeJSON(resolve(dir, 'index.json'), index);
  writeJSON(resolve(dir, 'probe.json'), probe);
  writeFileSync(resolve(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Export review</title><style>body{background:#ddd;font:14px system-ui;display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:260px}img{width:100%}</style>${index.map((f) => `<figure><img src="${f.file}"><figcaption>Frame ${f.frame} · ${f.seconds.toFixed(3)}s</figcaption></figure>`).join('')}`);
  console.log(`Extracted ${frames.length} frames. Inspect ${resolve(dir, 'contact-sheet.png')} and index.html; extraction does not mark review complete.`);
  return index;
}
if (isMain(import.meta.url)) cli(() => extractReview(resolve(process.argv[2] ?? '.')));
