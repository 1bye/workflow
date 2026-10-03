/**
 * Covers: installed spacing and shadcn rules, safe fixes, and formatter stability.
 * Real: installer, Oxlint, both JS plugins, Biome, and a local Tailwind theme.
 * Doubles: none; projects and source examples are temporary fixtures.
 * Requires: installed development dependencies, Node, and Bun; no network.
 */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { WorkflowInstaller } from "./install";

const repository = resolve(import.meta.dir, "..");
const temporary: string[] = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function fixture() {
  const target = mkdtempSync(join(tmpdir(), "workflow-lint-"));

  temporary.push(target);
  WorkflowInstaller.apply(WorkflowInstaller.plan({ target, configs: true }));
  symlinkSync(join(repository, "node_modules"), join(target, "node_modules"));

  return target;
}

function write(target: string, path: string, content: string) {
  mkdirSync(dirname(join(target, path)), { recursive: true });
  writeFileSync(join(target, path), content);
}

function lint(target: string, paths: string[], fix = false) {
  const result = Bun.spawnSync(
    [
      join(repository, "node_modules/.bin/oxlint"),
      ...paths,
      "--format",
      "json",
      ...(fix ? ["--fix"] : []),
    ],
    { cwd: target },
  );

  const output = JSON.parse(result.stdout.toString()) as {
    diagnostics: { code: string; filename: string }[];
  };

  return { ...result, diagnostics: output.diagnostics };
}

test("installed spacing rules fix gaps and remain stable with the shared Biome formatter", () => {
  const target = fixture();
  const path = "sample.ts";

  write(
    target,
    path,
    `export function compute(enabled: boolean) {

  if (!enabled) return 0;
  const first = 1;
  const second = 2;
  const options = {
    count: first + second,
  };
  console.log(options);
  if (options.count < 0) {
    throw new Error("Invalid count");
  }
  for (const value of [first, second]) {
    console.log(value);
  }
  const result = options.count;
  console.log(result);


  console.log(second);
  return options.count;

}
`,
  );

  const before = lint(target, [path]);

  expect(before.exitCode).toBe(1);
  expect(new Set(before.diagnostics.map(({ code }) => code))).toEqual(
    new Set([
      "@stylistic(padding-line-between-statements)",
      "@stylistic(no-multiple-empty-lines)",
      "@stylistic(padded-blocks)",
    ]),
  );
  expect(lint(target, [path], true).exitCode).toBe(0);

  const fixed = readFileSync(join(target, path), "utf8");

  expect(fixed).toContain("  const first = 1;\n  const second = 2;");
  expect(fixed).toContain("  if (!enabled) return 0;\n\n  const first");
  expect(fixed).toContain("  const second = 2;\n\n  const options");
  expect(fixed).toContain("  };\n\n  console.log(options);");
  expect(fixed).toContain("  console.log(options);\n\n  if (options.count");
  expect(fixed).toContain('  if (options.count < 0) {\n    throw new Error("Invalid count");\n  }\n\n  for');
  expect(fixed).toContain("  }\n\n  const result = options.count;\n\n  console.log(result);");
  expect(fixed).toContain("  console.log(second);\n\n  return options.count;");
  expect(fixed).toContain("{\n  if (!enabled) return 0;");
  expect(fixed).toEndWith("  return options.count;\n}\n");

  const format = () =>
    Bun.spawnSync([join(repository, "node_modules/.bin/biome"), "format", "--write", path], {
      cwd: target,
    });

  expect(format().exitCode).toBe(0);
  const formatted = readFileSync(join(target, path), "utf8");

  expect(lint(target, [path]).exitCode).toBe(0);
  expect(lint(target, [path], true).exitCode).toBe(0);
  expect(format().exitCode).toBe(0);
  expect(readFileSync(join(target, path), "utf8")).toBe(formatted);
}, 30_000);

test("combined config recognizes theme and components while retaining spacing rules", () => {
  const target = fixture();

  write(target, "package.json", '{"private":true,"type":"module"}');
  write(
    target,
    "tsconfig.json",
    JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
  );
  write(
    target,
    "components.json",
    JSON.stringify({
      style: "new-york",
      rsc: false,
      tsx: true,
      tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true },
      aliases: { components: "@/components", ui: "@/components/ui", utils: "@/lib/utils" },
    }),
  );
  write(target, "src/index.css", '@import "tailwindcss";\n@theme { --color-primary: #123456; }\n');
  write(
    target,
    "src/components/ui/button.tsx",
    `export function Button({ className }: { className?: string }) {
  return <button className={className}>Save</button>;
}
`,
  );
  write(
    target,
    "src/components/ui/wrapper.tsx",
    `import { Button } from "@/components/ui/button";
export const Wrapped = () => <Button className="p-4 bg-primary" />;
`,
  );
  write(
    target,
    "src/valid.tsx",
    `import { Button } from "@/components/ui/button";
export const View = () => <Button className="mt-4 w-full" />;
export const Heading = () => <h1 className="bg-primary">Heading</h1>;
`,
  );
  write(
    target,
    "src/invalid.tsx",
    `import { Button } from "@/components/ui/button";
export const Restyled = () => <Button className="p-4" />;
export const Raw = () => <div className="bg-red-500" />;
export const Unknown = () => <div className="rounded-does-not-exist" />;
export function value() {
  const result = 1;
  return result;
}
`,
  );

  const valid = lint(target, ["src/valid.tsx", "src/components/ui"]);

  expect(valid.diagnostics).toEqual([]);
  expect(valid.exitCode).toBe(0);

  const invalid = lint(target, ["src/invalid.tsx"]);

  expect(invalid.exitCode).toBe(1);
  expect(new Set(invalid.diagnostics.map(({ code }) => code))).toEqual(
    new Set([
      "shadcn(no-restyle)",
      "shadcn(no-raw-colors)",
      "shadcn(no-unknown-classes)",
      "@stylistic(padding-line-between-statements)",
    ]),
  );
}, 30_000);
