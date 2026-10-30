import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { normalizePath } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import type { InlineConfig, PluginOption } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

export const appRoot = join(here, "assets/app");
export const exampleRoot = join(here, "assets/workspace");

export function labConfig(workspace = exampleRoot) {
  const plugins: PluginOption[] = [
    {
      name: "component-lab-tailwind-sources",
      enforce: "pre",
      transform: {
        order: "pre",
        handler(source, id) {
          const file = id.split("?")[0];

          if (file === join(appRoot, "styles.css") || file === join(appRoot, "preview.css")) {
            return `${source}\n@source ${JSON.stringify(workspace)};\n`;
          }
        },
      },
      hotUpdate({ file, modules, timestamp }) {
        if (
          !normalizePath(file).startsWith(`${normalizePath(workspace)}/`) ||
          !/\.tsx?$/.test(file)
        )
          return;

        // New draft files must also refresh Tailwind's cached source scan.
        const graph = this.environment.moduleGraph;

        const styles = ["styles.css", "preview.css"].flatMap((name) => [
          ...(graph.getModulesByFile(join(appRoot, name)) ?? []),
        ]);

        for (const style of styles) graph.invalidateModule(style, undefined, timestamp, true);

        return [...new Set([...modules, ...styles])];
      },
    },
    react(),
    tailwind(),
  ];

  return {
    root: appRoot,
    cacheDir: join(
      here,
      "node_modules/.vite",
      createHash("sha256").update(workspace).digest("hex").slice(0, 12),
    ),
    configFile: false,
    appType: "mpa",
    plugins,
    resolve: {
      alias: { "@drafts": workspace, "@local": join(here, "assets/schema/index.ts") },
      dedupe: ["react", "react-dom"],
    },
    server: {
      host: "127.0.0.1",
      strictPort: true,
      fs: { strict: true, allow: [join(here, "assets"), workspace, join(here, "node_modules")] },
    },
    build: {
      outDir: resolve(here, "dist"),
      emptyOutDir: true,
      rolldownOptions: {
        input: { app: join(appRoot, "index.html"), preview: join(appRoot, "preview.html") },
      },
    },
  } satisfies InlineConfig;
}

export default labConfig();
