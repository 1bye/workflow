# Shared TypeScript configs

These are copyable starting configs. They need the consuming project's installed
tools; `workflow` itself has no package install or automatic synchronization.

| File | Purpose |
| --- | --- |
| [biome.json](biome.json) | Ultracite core rules, two-space formatting, and OOP-compatible overrides |
| [tsconfig.base.json](tsconfig.base.json) | Shared strictness with platform globals chosen by each consumer |

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

## Validation on 2026-09-21

Validated against an isolated copy of `1git/packages/git`, using project HEAD
`96c599345a6ef3cd91120b86e67862277b705a8d`. Existing installed dependencies were
reused. The source repository had unrelated uncommitted changes, so adoption was
tested in a temporary directory and no source-project files were edited.

Before applying the shared configs, the package passed its original type check
and Biome check. In the copy, the shared TypeScript base replaced the old base;
the consumer retained its Node/Bun types, module settings, and build behavior.
Only formatting was applied to source and tests.

| Check | Result |
| --- | --- |
| `biome format --write src tests`, then `biome check src tests` | 26 files formatted and checked successfully |
| `biome check biome.json tsconfig.base.json` | Both configs passed |
| `tsc --noEmit --project tsconfig.json` | Passed |
| `tsc --project tsconfig.build.json` | JavaScript and declaration build passed |
| `bun test` | 160 passed, 0 failed, 294 assertions across 12 test files |
| Small OOP sample | Static-only class and readonly constructor parameter property accepted |
| TypeScript diagnostic sample | Unsafe null/indexed access rejected; undeclared DOM/Node globals rejected |

Runtime: Bun **1.4.2**. Compiler: TypeScript **6.0.3**. Formatter/linter: Biome
**2.5.3** with Ultracite **7.9.4**. These results cover the selected Git package;
other runtimes and framework profiles need their own adoption checks.
