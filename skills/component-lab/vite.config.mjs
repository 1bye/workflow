import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const here = dirname(fileURLToPath(import.meta.url));

export const appRoot = join(here, "assets/app");
export const exampleRoot = join(here, "assets/workspace");

export function labConfig(workspace = exampleRoot) {
  return {
    root: appRoot,
    cacheDir: join(here, "node_modules/.vite", createHash("sha256").update(workspace).digest("hex").slice(0, 12)),
    configFile: false,
    appType: "mpa",
    plugins: [
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
      },
      react(),
      tailwind(),
    ],
    resolve: { alias: { "@drafts": workspace }, dedupe: ["react", "react-dom"] },
    server: {
      host: "127.0.0.1",
      strictPort: true,
      fs: { strict: true, allow: [appRoot, workspace, join(here, "node_modules")] },
    },
    build: {
      outDir: resolve(here, "dist"),
      emptyOutDir: true,
      rolldownOptions: { input: { app: join(appRoot, "index.html"), preview: join(appRoot, "preview.html") } },
    },
  };
}

export default labConfig();
