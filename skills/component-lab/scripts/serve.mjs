#!/usr/bin/env node
import { randomBytes, randomUUID } from "node:crypto";
import { cp, lstat, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";
import { exampleRoot, labConfig } from "../vite.config.mjs";

export async function initialize(project) {
  const root = await realpath(project);

  if (!(await stat(root)).isDirectory()) throw new Error("Project must be a directory.");

  const workspace = join(root, ".component-lab");

  const existing = await lstat(workspace).catch((error) => {
    if (error.code !== "ENOENT") throw error;

    return null;
  });

  if (existing?.isSymbolicLink() || (existing && !existing.isDirectory())) throw new Error(".component-lab must be a regular directory.");

  if (!existing) await cp(exampleRoot, workspace, { recursive: true, force: false, errorOnExist: true });

  await readFile(join(workspace, "registry.js"));
  validateSettings(JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")));

  return workspace;
}

export function validateSettings(value) {
  const object = (item) => item !== null && typeof item === "object" && !Array.isArray(item);

  if (!object(value) || value.version !== 1 || !["paper", "map", "dark"].includes(value.canvas) || !object(value.components)) throw new Error("Invalid settings: expected version 1, a canvas, and component values.");

  for (const [id, props] of Object.entries(value.components)) {
    if (!/^[a-z][a-z0-9-]*$/.test(id) || !object(props)) throw new Error("Invalid component settings.");

    for (const prop of Object.values(props)) {
      if (!(typeof prop === "boolean" || (typeof prop === "number" && Number.isFinite(prop)) || (typeof prop === "string" && prop.length <= 500))) throw new Error("Control values must be strings, finite numbers, or booleans.");
    }
  }

  return value;
}

async function workspaceFile(workspace, name) {
  const file = await realpath(resolve(workspace, name));
  const path = relative(workspace, file);

  if (path === ".." || path.startsWith("../") || isAbsolute(path)) throw new Error("File is outside the workspace.");

  return file;
}

export async function createLabServer(workspace, { port = 4317 } = {}) {
  const config = labConfig(workspace);
  const session = randomUUID();
  const nonce = randomBytes(16).toString("base64");

  config.html = { cspNonce: nonce };
  config.server.port = port;
  config.plugins.push({
    name: "component-lab-settings",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const host = `127.0.0.1:${server.httpServer.address()?.port}`;

        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Component-Lab-Session", session);
        response.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://${host}; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`);

        if (request.headers.host !== host) { response.writeHead(403).end("Invalid host.");

 return; }

        let url;

        try {
          url = new URL(request.url, `http://${host}`);

          if (url.pathname === "/api/settings") {
            if (request.method === "GET") {
              const file = await workspaceFile(workspace, "settings.json");

              response.writeHead(200, { "Content-Type": "application/json" }).end(await readFile(file));
            } else if (request.method === "POST") {
              if (request.headers.origin !== `http://${host}` || request.headers["content-type"] !== "application/json") { response.writeHead(403).end("Save must originate from this workbench.");

 return; }

              const chunks = [];
              let length = 0;

              for await (const chunk of request) {
                length += chunk.length;

                if (length > 65536) { response.writeHead(413).end("Settings are too large.");

 return; }

                chunks.push(chunk);
              }

              const settings = validateSettings(JSON.parse(Buffer.concat(chunks).toString()));
              const target = join(workspace, "settings.json");

              if ((await lstat(target)).isSymbolicLink()) throw new Error("Settings must be a regular file.");

              const temporary = join(workspace, `.settings-${randomUUID()}.json`);

              try {
                await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, { flag: "wx" });
                await rename(temporary, target);
              } finally { await unlink(temporary).catch(() => {}); }

              response.writeHead(200, { "Content-Type": "application/json" }).end('{"saved":true}');
            } else response.writeHead(405, { Allow: "GET, POST" }).end("Method not allowed.");

            return;
          }

          if (url.pathname.startsWith("/drafts/")) {
            const file = await workspaceFile(workspace, decodeURIComponent(url.pathname.slice(8)));

            request.url = `/@fs/${file}${url.search}`;
          }

          next();
        } catch (error) {
          response.writeHead(url?.pathname === "/api/settings" ? 400 : 404, { "Content-Type": "text/plain" }).end(error.message);
        }
      });
    },
  });

  return createServer(config);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values, positionals } = parseArgs({ options: { port: { type: "string", default: "4317" }, help: { type: "boolean" } }, allowPositionals: true });

    if (values.help) console.log("Usage: node serve.mjs [project-directory] [--port 4317]");
    else {
      const port = Number(values.port);

      if (!Number.isInteger(port) || port < 1 || port > 65535 || positionals.length > 1) throw new Error("Provide one project directory and a port between 1 and 65535.");

      const workspace = await initialize(resolve(positionals[0] ?? process.cwd()));
      const server = await createLabServer(workspace, { port });

      try { await server.listen(); } catch (error) { await server.close();

 throw error; }

      console.log(`Component Lab · ${basename(dirname(workspace))}\nhttp://127.0.0.1:${port}\nDrafts: ${workspace}\nPress Ctrl+C to stop.`);
      process.once("SIGINT", () => server.close());
      process.once("SIGTERM", () => server.close());
    }
  } catch (error) { console.error(`Component Lab: ${error.message}`); process.exitCode = 1; }
}
