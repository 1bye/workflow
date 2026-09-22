# Shared TypeScript configs

These are copyable starting configs. They need the consuming project's installed
tools. The workflow installer can copy the root templates with `--configs`;
dependency installation and runtime-specific configuration remain explicit.

| File | Purpose |
| --- | --- |
| [biome.json](biome.json) | Ultracite core rules, two-space formatting, and OOP-compatible overrides |
| [tsconfig.base.json](tsconfig.base.json) | Shared strictness with platform globals chosen by each consumer |
| [oxlint.json](oxlint.json) | Combined TypeScript blank-line and shadcn design-system rules |

## Formatter and linter

Merge `biome.json` into the target project's root config. Preserve necessary local
exclusions and framework presets. Its schema path assumes that root has access to
`node_modules/@biomejs/biome`.

The verified tool versions are Biome **2.5.3**, Ultracite **7.9.4**, and TypeScript
**6.0.3**. For a new project using that combination:

```sh
bun add --dev --exact @biomejs/biome@2.5.3 ultracite@7.9.4 typescript@6.0.3
```

Keep an existing project's version choices unless upgrading is part of the task.
Revalidate the config when changing the preset or tool version.

The config extends `ultracite/biome/core`, including its generated-file exclusions
and import organization. It explicitly uses spaces, an indent width of two, and
LF line endings. Two rules are disabled to match the TypeScript guide:

- `noStaticOnlyClass`: permits cohesive stateless classes with static methods.
- `noParameterProperties`: permits dependencies such as
  `constructor(private readonly client: Client)`.

Other core rules remain in effect. VCS integration is disabled so the shared
config does not require a `.gitignore` or select a branch for the consumer.
Projects that need staged/changed-file checks can enable and configure VCS locally.

Use scripts with separate read-only and fixing behavior:

```json
{
  "scripts": {
    "check": "biome check .",
    "fix": "biome check --write .",
    "check-types": "tsc --noEmit"
  }
}
```

Run these through `bun run check`, `bun run fix`, and `bun run check-types`.
Inspect a fixing diff before adopting it. Keep editors on the same formatter and
avoid running a second formatter over the same files.

## Oxlint spacing and shadcn

`oxlint.json` contains both spacing and shadcn rules in one standalone config.
Oxlint's default correctness category is disabled so the existing Biome/Ultracite
checks keep their role. This is an additional check, not a complete replacement
for those checks.

- Require a blank line before a return that follows other statements in its block.
  A return at the start of a guard block remains compact.
- Require a blank line after multiline `const`, `let`, or `var` declarations.
  Short declarations can stay together. This also separates a multiline
  declaration from a following declaration.
- Allow at most one consecutive blank line and none at file/block edges.

The same config enables `shadcn/no-restyle`, `shadcn/no-raw-colors`, and
`shadcn/no-unknown-classes` for Tailwind v4 design-system usage.
`no-restyle` permits layout adjustments such as margin and width; padding, gaps,
and appearance changes belong in component variants or explicit exceptions.
The rule is disabled under `**/components/ui/**` so primitives can style themselves.
The color and class-existence checks still apply there.

The verified versions are Oxlint **1.85.0**, ESLint Stylistic **5.10.0**, and
`@shadcn/lint` **0.2.0**. The tests use Tailwind **4.3.3** and Biome **2.5.3**.
Install the tools in the consuming project's workspace; existing Tailwind and
formatter versions remain project decisions:

```sh
bun add --dev --exact oxlint@1.85.0 @stylistic/eslint-plugin@5.10.0 @shadcn/lint@0.2.0
```

Use a Node version supported by these tools. `@shadcn/lint` requires Node 20.19
or later; using Bun as the package manager does not remove the plugins' Node
requirements. Oxlint's JS plugin API is alpha, so keep the tested versions pinned
and rerun the config checks when upgrading.

From the workflow checkout, install the combined configuration:

```sh
bun run scripts/install.ts ../my-app --oxlint --dry-run
bun run scripts/install.ts ../my-app --oxlint
```

This copies the complete config into root `.oxlintrc.json`, with no preset chain.
`--oxlint` is independent of `--configs` and skill selection.
Omission retains the previous choice; `--no-oxlint` removes only an
unedited managed root config. Existing JSON/JSONC/TypeScript Oxlint configs or
local edits stop installation before writes. Dependencies and scripts are not
installed or modified by the installer.

For manual adoption, copy `oxlint.json` as root `.oxlintrc.json`, or merge its
plugins, rules, and overrides into the existing root config. Standard shadcn
projects use `components.json` for discovery. Custom aliases, UI package
imports, theme paths, and component-directory overrides must match the project.
For example, a custom component import prefix can use
`"settings": { "shadcn": { "ui": "@workspace/ui/components" } }`.
Keep local overrides in the consuming config, rather than editing the shared template.
Editing an installer-managed root config requires manual reconciliation on update.

Add `"lint": "oxlint ."` and `"lint:fix": "oxlint . --fix"` to the project's
scripts, or append them to existing lint commands. Keep the Biome checks too.
Use the existing formatter followed by lint fixes, then run both read-only checks
to catch disagreement. The config tests verify that the supplied spacing rules
remain stable after Biome formatting. Semantic phase boundaries still need the
agent's judgment; these rules cannot identify validation versus execution.

See [Oxlint JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins),
[statement padding](https://eslint.style/rules/padding-line-between-statements),
and [shadcn configuration](https://github.com/shadcn-ui/lint#settings).

## TypeScript

Copy `tsconfig.base.json` alongside the project's `tsconfig.json`, then extend it.
The base enables strict checking, unchecked-index handling, unused-code checks,
switch fallthrough checks, consistent casing, isolated modules, and explicit
type-only imports through `verbatimModuleSyntax`.

The base selects ECMAScript libraries with `lib: ["ESNext"]` and no ambient type
packages with `types: []`. It does not select DOM, Node, Bun, or Workers globals.
The consumer chooses platform libraries and installed type packages. TypeScript
documents these separately under [lib](https://www.typescriptlang.org/tsconfig/lib.html)
and [types](https://www.typescriptlang.org/tsconfig/types.html).

A Bun/bundler-style consumer can start with:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "types": ["bun"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

That example requires `@types/bun` in the consuming project. Keep a Node project's
appropriate Node module settings instead of applying bundler resolution to it.
For browser code, add the needed DOM libraries; for other runtimes, use their
matching type packages. Select the ECMAScript library level and output target
that the actual runtime supports; `ESNext` is an explicit starting choice.

JSX, module resolution, paths, source inclusion, dependency-library checking,
output directories, declarations, and build references stay local. The base
does not set `noEmit`, so it also works with a library's declaration/build config.
When merging into an existing config, preserve its framework-generated settings
and adjust relative paths. See TypeScript's
[inheritance rules](https://www.typescriptlang.org/tsconfig/extends.html).

## Verify adoption

Inspect the effective TypeScript config with the installed compiler's
`tsc --showConfig -p tsconfig.json`. Confirm the intended runtime globals, source
files, and output settings. Run the project's formatter check, type check,
relevant tests, and build. For libraries, verify emitted declarations and package
exports. Report the commands and results; keep fixes separate from checks.
