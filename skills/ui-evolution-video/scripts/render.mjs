import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {cli, isMain, writeJSON} from './io.mjs';
import {loadProject} from './validate.mjs';
import {reviewFrames} from './motion.mjs';

export async function render(project, {preview = false, browserPath} = {}) {
  const scene = loadProject(project);
  const output = resolve(project, 'artifacts');
  mkdirSync(output, {recursive: true});
  writeJSON(resolve(project, 'data/scene.json'), scene);
  const serveUrl = await bundle({entryPoint: resolve(project, 'src/index.jsx'), publicDir: resolve(project, 'public')});
  const browser = await openBrowser('chrome', {browserExecutable: browserPath});
  try {
    const options = {serveUrl, inputProps: scene, puppeteerInstance: browser};
    const composition = await selectComposition({...options, id: 'Evolution'});
    if (preview) {
      const frames = reviewFrames(scene.timeline);
      const paths = [];
      for (const frame of frames) {
        const name = `preview-${String(frame).padStart(5, '0')}.png`;
        await renderStill({...options, composition, frame, output: resolve(output, name)});
        paths.push(name);
      }
      writeJSON(resolve(output, 'preview-index.json'), frames.map((frame, i) => ({frame, seconds: frame / scene.timeline.fps, file: paths[i]})));
      console.log(`Rendered ${frames.length} review frames to ${output}`);
    } else {
      await renderMedia({...options, composition, codec: 'h264', pixelFormat: 'yuv420p', concurrency: 2, outputLocation: resolve(output, 'evolution.mp4')});
      console.log(`Rendered ${resolve(output, 'evolution.mp4')}`);
    }
  } finally {
    await browser.close({silent: true});
  }
  // HTML keeps the precise frame/time labels separate from unmodified frame images.
  if (preview) {
    const index = reviewFrames(scene.timeline);
    writeFileSync(resolve(output, 'preview.html'), `<!doctype html><meta charset="utf-8"><title>Transition frames</title><style>body{background:#ddd;font:14px system-ui;display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:240px}img{width:100%}</style>${index.map((f) => `<figure><img src="preview-${String(f).padStart(5, '0')}.png"><figcaption>Frame ${f} · ${(f / scene.timeline.fps).toFixed(3)}s</figcaption></figure>`).join('')}`);
  }
}
if (isMain(import.meta.url)) cli(() => render(resolve(process.argv[2] ?? '.'), {
  preview: process.argv.includes('--preview'), browserPath: process.env.UI_EVOLUTION_BROWSER,
}));
