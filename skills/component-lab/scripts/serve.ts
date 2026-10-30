import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cp, lstat, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer, type Plugin } from "vite";
import { exampleRoot, labConfig } from "../vite.config.ts";
import { isRecord, validateSettings } from "../assets/settings.ts";

export { validateSettings };

export async function initialize(project: string): Promise<string> {
  const root = await realpath(project);

  if (!(await stat(root)).isDirectory()) throw new Error("Project must be a directory.");

  const workspace = join(root, ".component-lab");

  const existing = await lstat(workspace).catch((error: unknown) => {
    if (!isRecord(error) || error.code !== "ENOENT") throw error;

    return null;
  });

  if (existing?.isSymbolicLink() || (existing && !existing.isDirectory()))
    throw new Error(".component-lab must be a regular directory.");

  if (!existing) {
    await cp(exampleRoot, workspace, { recursive: true, force: false, errorOnExist: true });
  }

  const config = {
    extends: relative(workspace, resolve(exampleRoot, "../../tsconfig.json")).replaceAll("\\", "/"),
    compilerOptions: {
      types: [resolve(exampleRoot, "../../node_modules/vite/client.d.ts")],
      paths: {
        "@local": [resolve(exampleRoot, "../schema/index.ts")],
        react: [resolve(exampleRoot, "../../node_modules/@types/react/index.d.ts")],
        "react/*": [resolve(exampleRoot, "../../node_modules/@types/react/*")],
      },
    },
    include: ["components/**/*.ts", "components/**/*.tsx"],
  };

  await writeFile(join(workspace, "tsconfig.json"), `${JSON.stringify(config, null, 2)}\n`, {
    flag: "wx",
  }).catch((error: unknown) => {
    if (!isRecord(error) || error.code !== "EEXIST") throw error;
  });

  if (!(await stat(join(workspace, "components"))).isDirectory())
    throw new Error("The draft workspace needs a components directory.");

  validateSettings(JSON.parse(await readFile(join(workspace, "settings.json"), "utf8")));

  return workspace;
}

async function workspaceFile(workspace: string, name: string): Promise<string> {
  const file = await realpath(resolve(workspace, name));
  const path = relative(workspace, file);

  if (path === ".." || path.startsWith("../") || isAbsolute(path))
    throw new Error("File is outside the workspace.");

  return file;
}

export async function createLabServer(workspace: string, { port = 4317 } = {}) {
  const config = labConfig(workspace);

  const workspaceId = createHash("sha256")
    .update(await realpath(workspace))
    .digest("hex");

  const nonce = randomBytes(16).toString("base64");

  const settingsPlugin: Plugin = {
    name: "component-lab-settings",
    configureServer(server) {
      server.watcher.add(workspace);
      server.middlewares.use(async (request, response, next) => {
        const address = server.httpServer?.address();

        if (!address || typeof address === "string") {
          next(new Error("The workbench requires a TCP listener."));

          return;
        }

        const host = `127.0.0.1:${address.port}`;

        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Component-Lab-Workspace", workspaceId);
        response.setHeader(
          "Content-Security-Policy",
          `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://${host}; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`,
        );

        if (request.headers.host !== host) {
          response.writeHead(403).end("Invalid host.");

          return;
        }

        let url: URL | undefined;

        try {
          url = new URL(request.url ?? "/", `http://${host}`);

          if (url.pathname === "/api/settings") {
            if (request.method === "GET") {
              const file = await workspaceFile(workspace, "settings.json");

              response
                .writeHead(200, { "Content-Type": "application/json" })
                .end(await readFile(file));
            } else if (request.method === "POST") {
              if (
                request.headers.origin !== `http://${host}` ||
                request.headers["content-type"] !== "application/json"
              ) {
                response.writeHead(403).end("Save must originate from this workbench.");

                return;
              }

              const chunks: Buffer[] = [];
              let length = 0;

              for await (const chunk of request) {
                const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

                length += bytes.length;

                if (length > 65536) {
                  response.writeHead(413).end("Settings are too large.");

                  return;
                }

                chunks.push(bytes);
              }

              const settings = validateSettings(JSON.parse(Buffer.concat(chunks).toString()));
              const target = join(workspace, "settings.json");

              if ((await lstat(target)).isSymbolicLink())
                throw new Error("Settings must be a regular file.");

              const temporary = join(workspace, `.settings-${randomUUID()}.json`);

              try {
                await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, {
                  flag: "wx",
                });
                await rename(temporary, target);
              } finally {
                await unlink(temporary).catch(() => {});
              }

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
          response
            .writeHead(url?.pathname === "/api/settings" ? 400 : 404, {
              "Content-Type": "text/plain",
            })
            .end(error instanceof Error ? error.message : String(error));
        }
      });
    },
  };

  return createServer({
    ...config,
    html: { cspNonce: nonce },
    server: { ...config.server, port },
    plugins: [...config.plugins, settingsPlugin],
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values, positionals } = parseArgs({
      options: { port: { type: "string", default: "4317" }, help: { type: "boolean" } },
      allowPositionals: true,
    });

    if (values.help) console.log("Usage: npm run dev -- [project-directory] [--port 4317]");
    else {
      const port = Number(values.port);

      if (!Number.isInteger(port) || port < 1 || port > 65535 || positionals.length > 1)
        throw new Error("Provide one project directory and a port between 1 and 65535.");

      const workspace = await initialize(resolve(positionals[0] ?? process.cwd()));
      const server = await createLabServer(workspace, { port });

      try {
        await server.listen();
      } catch (error) {
        await server.close();

        throw error;
      }

      console.log(
        `Component Lab · ${basename(dirname(workspace))}\nhttp://127.0.0.1:${port}\nDrafts: ${workspace}\nPress Ctrl+C to stop.`,
      );
      process.once("SIGINT", () => server.close());
      process.once("SIGTERM", () => server.close());
    }
  } catch (error) {
    console.error(`Component Lab: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
