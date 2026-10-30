import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createLabServer, initialize } from "../scripts/serve.mjs";

test("initialization preserves drafts; the local server saves settings and confines file access", async () => {
  const project = await mkdtemp(join(tmpdir(), "component-lab-"));
  let server;

  try {
    const workspace = await initialize(project);
    const registry = join(workspace, "registry.js");

    await writeFile(registry, `${await readFile(registry, "utf8")}\n// A project-owned edit.\n`);
    await initialize(project);
    assert.match(await readFile(registry, "utf8"), /project-owned edit/);
    await writeFile(join(workspace, "components/ClassProbe.jsx"), 'export default function ClassProbe() { return <div className="min-w-[137px]" />; }');

    server = await createLabServer(workspace, { port: 0 });
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const get = (path) => fetch(`${origin}${path}`);

    const post = (value, requestOrigin = origin) => fetch(`${origin}/api/settings`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(value),
    });

    assert.equal((await get("/")).status, 200);
    assert.match((await get("/main.jsx")).headers.get("content-type"), /javascript/);
    const pin = await get("/drafts/components/pin/Pin.jsx");

    assert.equal(pin.status, 200);
    assert.match(await pin.text(), /jsxDEV|jsx-runtime/);
    const css = await get("/preview.css?direct");

    assert.equal(css.status, 200);
    assert.match(await css.text(), /min-width:\s*137px/);
    const settings = { version: 1, canvas: "map", components: { pin: { size: 55, label: "Saved place", showLabel: false } } };

    assert.equal((await post(settings)).status, 200);
    assert.deepEqual(JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")), settings);
    assert.deepEqual(await (await get("/api/settings")).json(), settings);
    assert.equal((await post(settings, "https://other.example")).status, 403);
    assert.equal((await post({ version: 9 })).status, 400);
    assert.equal((await post({ ...settings, components: { pin: { bad: [1, 2] } } })).status, 400);
    assert.equal((await post({ ...settings, extra: "x".repeat(70000) })).status, 413);
    assert.deepEqual(JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")), settings);

    const outside = join(project, "private.json");

    await writeFile(outside, '{"private":true}');
    await symlink(outside, join(workspace, "outside.json"));
    assert.equal((await get("/drafts/outside.json")).status, 404);
    assert.equal((await get("/drafts/%2e%2e%2fprivate.json")).status, 404);
    assert.equal((await get("/drafts/settings.json")).status, 200);
    assert.equal((await get("/private.json")).status, 404);

    assert.equal((await get(`/@fs/${outside}`)).status, 403);
  } finally {
    await server?.close();
    await rm(project, { recursive: true, force: true });
  }
});

test("initialization refuses a symlinked workspace", async () => {
  const project = await mkdtemp(join(tmpdir(), "component-lab-link-"));

  try {
    await symlink(project, join(project, ".component-lab"));
    await assert.rejects(initialize(project), /regular directory/);
  } finally { await rm(project, { recursive: true, force: true }); }
});
