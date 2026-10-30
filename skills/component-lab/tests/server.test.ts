import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createLabServer, initialize } from "../scripts/serve.ts";

test("initialization preserves drafts; the local server saves settings and confines file access", async () => {
  const project = await mkdtemp(join(tmpdir(), "component-lab-"));
  let server: Awaited<ReturnType<typeof createLabServer>> | undefined;

  try {
    const workspace = await initialize(project);
    const registry = join(workspace, "components/pin/index.ts");
    const configPath = join(workspace, "tsconfig.json");
    const originalConfig = `${await readFile(configPath, "utf8")}\n// Project-owned configuration.\n`;

    await writeFile(configPath, originalConfig);
    await writeFile(registry, `${await readFile(registry, "utf8")}\n// A project-owned edit.\n`);
    await initialize(project);
    assert.match(await readFile(registry, "utf8"), /project-owned edit/);
    assert.equal(await readFile(configPath, "utf8"), originalConfig);
    await writeFile(
      join(workspace, "components/ClassProbe.tsx"),
      'export default function ClassProbe() { return <div className="min-w-[137px]" />; }',
    );
    const compiler = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url));

    execFileSync(process.execPath, [compiler, "--project", join(workspace, "tsconfig.json")], {
      cwd: workspace,
      stdio: "pipe",
    });

    server = await createLabServer(workspace, { port: 0 });
    await server.listen();
    const address = server.httpServer?.address();

    assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const get = (path: string) => fetch(`${origin}${path}`);

    const post = (value: unknown, requestOrigin = origin) =>
      fetch(`${origin}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: requestOrigin },
        body: JSON.stringify(value),
      });

    assert.equal((await get("/")).status, 200);
    assert.match((await get("/main.tsx")).headers.get("content-type") ?? "", /javascript/);
    const pin = await get("/drafts/components/pin/Pin.tsx");

    assert.equal(pin.status, 200);
    assert.match(await pin.text(), /jsxDEV|jsx-runtime/);
    const css = await get("/preview.css?direct");

    assert.equal(css.status, 200);
    assert.match(await css.text(), /min-width:\s*137px/);

    const lateComponent = join(workspace, "components/late");

    await mkdir(lateComponent);
    await writeFile(
      join(lateComponent, "Late.tsx"),
      'export default function Late() { return <div className="rounded-[37px]" />; }',
    );
    let updatedCss = "";

    for (let attempt = 0; attempt < 40; attempt++) {
      updatedCss = await (await get("/preview.css?direct")).text();

      if (/border-radius:\s*37px/.test(updatedCss)) break;

      await delay(25);
    }

    assert.ok(
      /border-radius:\s*37px/.test(updatedCss),
      "New component classes should refresh live CSS",
    );
    const settings = {
      version: 1,
      components: { pin: { size: 55, label: "Saved place", showLabel: false } },
    };

    assert.equal((await post(settings)).status, 200);
    assert.deepEqual(
      JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")),
      settings,
    );
    assert.deepEqual(await (await get("/api/settings")).json(), settings);
    assert.equal((await post(settings, "https://other.example")).status, 403);
    assert.equal((await post({ version: 9 })).status, 400);
    assert.equal((await post({ ...settings, components: { pin: { bad: [1, 2] } } })).status, 400);
    assert.equal((await post({ ...settings, extra: "x".repeat(70000) })).status, 413);
    assert.deepEqual(
      JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")),
      settings,
    );

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
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test("browser storage identity survives server restarts and stays separate between projects", async () => {
  const projects = await Promise.all([
    mkdtemp(join(tmpdir(), "component-lab-storage-a-")),
    mkdtemp(join(tmpdir(), "component-lab-storage-b-")),
  ]);

  async function identity(project: string) {
    const workspace = await initialize(project);
    const server = await createLabServer(workspace, { port: 0 });

    try {
      await server.listen();
      const address = server.httpServer?.address();

      assert.ok(address && typeof address !== "string");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/settings`);
      const id = response.headers.get("X-Component-Lab-Workspace");

      assert.equal(response.status, 200);
      assert.match(id ?? "", /^[a-f0-9]{64}$/);

      return id;
    } finally {
      await server.close();
    }
  }

  try {
    const original = await identity(projects[0]);

    assert.equal(await identity(projects[0]), original);
    assert.notEqual(await identity(projects[1]), original);
  } finally {
    await Promise.all(projects.map((project) => rm(project, { recursive: true, force: true })));
  }
});
