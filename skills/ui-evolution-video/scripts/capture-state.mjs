import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {cli, isMain, readJSON, writeJSON} from './io.mjs';
import {validateState} from './validate.mjs';

export async function capture({url, id, out, source, map, width = 1080, height = 1080, ready, browserPath}) {
  const browser = await chromium.launch(browserPath ? {executablePath: browserPath} : {});
  try {
    const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1, reducedMotion: 'reduce'});
    page.setDefaultTimeout(30000);
    await page.goto(url, {waitUntil: 'load', timeout: 30000});
    if (ready) await page.locator(ready).waitFor({state: 'visible'});
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
    await page.evaluate(() => window.scrollTo(0, 0));
    const result = await page.evaluate(({mapping, stateId}) => {
      const entries = mapping ?? [...document.querySelectorAll('[data-anim-id]')].map((e) => ({
        id: e.getAttribute('data-anim-id'), selector: `[data-anim-id="${CSS.escape(e.getAttribute('data-anim-id'))}"]`,
        kind: e.getAttribute('data-anim-kind') || undefined,
      }));
      if (!entries.length) throw new Error('No tagged elements. Supply --map with [{id,selector,kind?}] or instrument the isolated source.');
      const selected = entries.map((entry) => {
        const nodes = document.querySelectorAll(entry.selector);
        if (nodes.length !== 1) throw new Error(`${entry.id}: selector must identify exactly one element`);
        return {entry, node: nodes[0]};
      });
      const warnings = [];
      const elements = selected.map(({entry, node}, index) => {
        const css = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (css.display === 'none' || css.visibility !== 'visible' || !rect.width || !rect.height) {
          throw new Error(`${entry.id}: element is hidden or has zero geometry`);
        }
        let ancestor = node.parentElement;
        let parent = null;
        let opacity = Number(css.opacity);
        while (ancestor) {
          const match = selected.find((item) => item.node === ancestor);
          if (!parent && match) parent = match.entry.id;
          const parentStyle = getComputedStyle(ancestor);
          opacity *= Number(parentStyle.opacity);
          if (parentStyle.overflow !== 'visible' && parentStyle.overflow !== 'clip') warnings.push(`${entry.id}: inspect ancestor clipping`);
          ancestor = ancestor.parentElement;
        }
        const kind = entry.kind ?? (node.children.length ? 'box' : 'text');
        if (css.transform !== 'none' || css.backgroundImage !== 'none' || css.filter !== 'none' || css.clipPath !== 'none') {
          warnings.push(`${entry.id}: transform, image, filter, or clip-path needs an asset or custom layer`);
        }
        if (['INPUT', 'SELECT', 'TEXTAREA', 'CANVAS', 'SVG', 'IMG'].includes(node.tagName) && kind !== 'image') {
          warnings.push(`${entry.id}: native control or media needs explicit editable primitives or an image layer`);
        }
        const style = kind === 'text' ? {
          color: css.color, fontFamily: css.fontFamily, fontSize: parseFloat(css.fontSize), fontWeight: css.fontWeight,
          lineHeight: css.lineHeight, letterSpacing: css.letterSpacing, textAlign: css.textAlign,
          whiteSpace: css.whiteSpace, padding: css.padding,
        } : {
          backgroundColor: css.backgroundColor, borderColor: css.borderTopColor, borderWidth: parseFloat(css.borderTopWidth),
          borderStyle: css.borderTopStyle, borderRadius: css.borderRadius, boxShadow: css.boxShadow,
        };
        if (new Set([css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth, css.borderLeftWidth]).size > 1) {
          warnings.push(`${entry.id}: asymmetric borders need a custom layer`);
        }
        return {
          id: entry.id, parent, kind,
          rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
          style, opacity, z: entry.z ?? index,
          ...(kind === 'text' ? {text: node.value ?? node.innerText ?? node.textContent ?? ''} : {}),
          ...(kind === 'image' ? {asset: `assets/${encodeURIComponent(stateId)}--${encodeURIComponent(entry.id)}.png`} : {}),
          evidence: {selector: entry.selector, role: node.getAttribute('role') ?? node.tagName.toLowerCase(),
            name: node.getAttribute('aria-label') ?? node.getAttribute('name') ?? ''},
        };
      });
      const body = getComputedStyle(document.body).backgroundColor;
      const html = getComputedStyle(document.documentElement).backgroundColor;
      return {elements, warnings: [...new Set(warnings)], background: body !== 'rgba(0, 0, 0, 0)' ? body : html !== 'rgba(0, 0, 0, 0)' ? html : '#ffffff'};
    }, {mapping: map, stateId: id});
    const project = resolve(dirname(out), '../..');
    for (const element of result.elements.filter((e) => e.kind === 'image')) {
      // Capture each visual once; omit its descendants from the selector map to avoid duplication.
      const path = resolve(project, 'public', element.asset);
      mkdirSync(dirname(path), {recursive: true});
      await page.locator(element.evidence.selector).screenshot({path, animations: 'disabled'});
      element.style = {objectFit: 'contain'};
    }
    mkdirSync(dirname(out), {recursive: true});
    const screenshot = out.replace(/\.json$/, '') + '.png';
    await page.screenshot({path: screenshot, animations: 'disabled'});
    const state = {version: 1, id, viewport: {width, height}, source, screenshot: screenshot.split('/').pop(), ...result};
    validateState(state, project);
    writeJSON(out, state);
    return state;
  } finally {
    await browser.close();
  }
}

if (isMain(import.meta.url)) cli(async () => {
  const {values: v} = parseArgs({options: Object.fromEntries(['url', 'id', 'out', 'source', 'map', 'width', 'height', 'ready', 'browser'].map((key) => [key, {type: 'string'}]))});
  if (!v.url || !v.id || !v.out || !v.source) throw new Error('Usage: capture-state.mjs --url URL --id a --out PROJECT/data/states/a.json --source source.json [--map selectors.json] [--browser PATH]');
  const state = await capture({url: v.url, id: v.id, out: resolve(v.out), source: readJSON(v.source),
    map: v.map ? readJSON(v.map) : undefined, width: Number(v.width ?? 1080), height: Number(v.height ?? 1080), ready: v.ready,
    browserPath: v.browser ?? process.env.UI_EVOLUTION_BROWSER});
  console.log(`Captured ${state.id}: ${state.elements.length} elements, ${state.warnings.length} warnings`);
});
