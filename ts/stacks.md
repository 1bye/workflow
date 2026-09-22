# Optional TypeScript stack profiles

Choose a profile for each application or package. These are personal starting
choices drawn from the audited projects, with runtime boundaries checked against
official documentation on **2026-09-22**. Keep an existing project's stack unless
a migration is part of the task. Framework versions remain project decisions.

Every profile uses [the TypeScript baseline](AGENTS.md) and the applicable
[shared config guidance](configs/README.md). React projects also use
[the React guide](react.md), with platform-specific controls and styling.

| Target | Starting choice | Add when needed |
| --- | --- | --- |
| [Web](#react-web) | React + Vite | TanStack Router; TanStack Start for server-rendered/full-stack work; Tailwind/shadcn |
| [Bun API](#bun-api) | Bun + Elysia | Database, auth, and background jobs required by the application |
| [Workers API](#workers-api) | Cloudflare Workers + Hono | Explicit bindings and the project's infrastructure tool |
| [Desktop](#desktop) | Electron + React + electron-vite | OS integrations through a narrow preload API |
| [Mobile](#mobile) | Expo + React Native + Expo Router | HeroUI Native or another compatible native UI library |
| [Library / CLI](#library-and-cli) | TypeScript with an explicit Node or Bun target | Declaration build; terminal UI only for an interactive product |
| [Workspace](#workspace-layer) | Package-manager workspaces for real shared packages | Turborepo when task orchestration and caching help |

## Apply a profile

1. Identify the runtime of each entry point and its consumers. Bun package
   management does not make a browser, Electron process, or Worker run on Bun.
2. Preserve framework-generated config. Merge shared strictness deliberately;
   the shared base sets `lib: ["ESNext"]` and `types: []`, so consumers must
   select their actual globals. Keep browser, server, tooling, and test configs
   separate where their environments differ. Check the effective configuration
   with the installed compiler's `tsc --showConfig -p <config>`.
3. Map `check`, `fix`, `check-types`, `test`, and `build` to scripts that actually
   exist. Inspect their bodies before execution. Keep fixes separate from checks;
   tests/builds can still write artifacts. Preserve any required generation step.
4. Select relevant skills below and record the chosen profile, installed versions,
   entry points, and actual check commands in the target project's instructions.
   Copying this guide alone does not install dependencies or activate skills.

TypeScript resolves relative paths against the config that declares them, and
child `files`, `include`, and `exclude` replace inherited values. Review path and
global-type changes rather than blindly stacking configs. See the
[TypeScript inheritance rules](https://www.typescriptlang.org/tsconfig/extends.html).

## React web

Use React + Vite for a browser application. Add TanStack Router for routing and
TanStack Start when the application needs its server rendering or server APIs.
Keep Next.js or other established frameworks in projects already using them.
See [TanStack Start's scope](https://tanstack.com/start/latest/docs/framework/react/overview).

- **Ownership:** use `ui/`, `fixture/`, and `feature/` as defined in the React
  guide. Server-only database clients, secrets, and privileged operations stay
  outside the client import graph. Shared contracts must be safe for both sides.
- **Config:** browser code needs the selected ECMAScript/DOM libraries, JSX,
  and Vite client declarations. Tooling and server code get their own runtime
  types. Preserve generated routes and the framework's bundler configuration.
  Tailwind and shadcn remain optional; preserve Base UI/Radix choice and aliases.
- **Skills:** [React performance](skills/vercel-react-best-practices/SKILL.md),
  [composition](skills/vercel-composition-patterns/SKILL.md) for component API
  problems, and [shadcn](skills/shadcn/SKILL.md) when the project uses it.
  Next-specific examples apply only to compatible Next projects.
- **Verify:** type check, production build, relevant behavior tests, and browser
  checks of changed interactions, keyboard/focus behavior, and error states.
  Exercise server rendering/hydration when used. Vite transpiles TypeScript
  without checking types, so a build alone is insufficient.
  [Vite TypeScript guidance](https://vite.dev/guide/features.html#typescript).

Local reference: [daydb web manifest](/Users/yuriihulyk/Documents/GitHub/daydb/apps/web/package.json)
and [browser config](/Users/yuriihulyk/Documents/GitHub/daydb/apps/web/tsconfig.json).

## Bun API

Use Elysia for a Bun HTTP service. Keep route handlers thin and place cohesive
domain behavior in stateless classes with explicit stable dependencies. Pass
request-specific data through arguments. Framework callbacks remain functions.

- **Boundary:** validate request input, enforce authorization at the owning
  operation, and return deliberate response/error contracts. Keep app construction
  separate from starting a listener so request tests do not need a live port.
- **Config:** select Bun types and the module/output settings used by the actual
  runner or bundler. Browser globals do not belong in the service config. Keep
  database adapters and migrations attached to this application's storage choice.
- **Skills:** the common testing/tooling skills below. An Elysia-specific skill
  was identified in the audit but is not part of the curated collection yet.
- **Verify:** type check and build where applicable; test success, invalid input,
  authorization failures, and dependency failures through the HTTP boundary.
  Elysia supports request-level tests through `app.handle`; follow the installed
  version's setup requirements. [Elysia testing](https://elysiajs.com/patterns/unit-test).

Local reference: [stem server manifest](/Users/yuriihulyk/Documents/GitHub/stem/apps/server/package.json).
Its current entry point starts a listener and its manifest has no test script;
reuse the stack, not an assumption that it already supplies the testing layout.

## Workers API

Use Hono for an HTTP API targeting Cloudflare Workers. Select this profile by
deployment runtime, even if local scripts and pure tests run under Bun.

- **Boundary:** expose the Worker entry point expected by the deployment tool.
  Pass bindings and request context to their owners; keep user/request state out
  of reusable service instances. Use APIs available under the actual compatibility
  date and flags. Node/Bun types alone do not establish runtime support.
- **Config:** keep runtime and binding types aligned with deployment config.
  In Wrangler-managed projects, generate types using the selected CLI's
  `wrangler types`. In Alchemy-managed projects, preserve their entry point and
  binding/type workflow rather than creating a competing Wrangler configuration.
  [Cloudflare TypeScript guidance](https://developers.cloudflare.com/workers/languages/typescript/).
- **Skills:** common testing/tooling skills. Hono guidance remains a later skill
  import; this profile does not require an unbundled skill.
- **Verify:** type check, request/contract tests, and a local Workers-runtime
  check of changed bindings or platform APIs using the project's existing
  emulator/test integration. Pure Bun tests do not verify Worker compatibility.
  Build/preview through the configured deployment adapter; publishing is a
  separate operation. [Hono on Workers](https://hono.dev/docs/getting-started/cloudflare-workers).

Local references: [agent-bell server](/Users/yuriihulyk/Documents/GitHub/agent-bell/apps/server/package.json)
and [Worker definition](/Users/yuriihulyk/Documents/GitHub/agent-bell/packages/infra/alchemy.run.ts).
Its server `dev` and `test` scripts run under Bun; its infrastructure owns the Worker.

## Desktop

Use Electron with React in the renderer and electron-vite for the existing
main/preload/renderer build arrangement. Keep the application's implementation
in TypeScript; the separate native-renderer targets in the source projects are
outside this profile.

- **Boundary:** the main process owns privileged filesystem/process operations.
  Expose narrow typed operations through preload; validate IPC payloads and
  senders. Keep context isolation and sandboxing enabled and Node integration
  disabled in the renderer. Do not expose raw IPC or unrestricted Electron APIs.
  [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).
- **Config:** renderer code gets browser types; main/preload get the types and
  supported APIs of the chosen Electron environment. Test-runner globals belong
  in the test config. A shared IPC contract must avoid importing runtime owners.
- **Skills:** the React web skills for renderer work, plus common testing/tooling.
  Web-server and Next-specific rules do not apply to ordinary Electron screens.
- **Verify:** type check renderer, main/preload, and tests; run focused domain/IPC
  tests; build and launch Electron to exercise the changed operation. Check the
  packaged artifact when changing packaging, resource paths, or OS integration.
  Browser-only verification cannot prove the preload/main boundary works.

Local reference: [1git desktop manifest](/Users/yuriihulyk/Documents/GitHub/1git/apps/desktop/package.json),
with separate [renderer](/Users/yuriihulyk/Documents/GitHub/1git/apps/desktop/tsconfig.json),
[Electron](/Users/yuriihulyk/Documents/GitHub/1git/apps/desktop/tsconfig.electron.json),
and [test](/Users/yuriihulyk/Documents/GitHub/1git/apps/desktop/tsconfig.test.json) configs.

## Mobile

Use Expo, React Native, and Expo Router for TypeScript mobile work. Keep React,
React Native, Expo modules, and native UI libraries compatible with the selected
Expo SDK; package versions belong to the app. Follow Expo's
[SDK compatibility workflow](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
when an upgrade is requested.

- **Boundary:** retain React ownership/state principles while using native
  primitives, accessibility, navigation, and styling. HeroUI Native is optional.
  DOM elements, CSS-only shadcn components, and browser storage are not native
  implementations. Keep platform storage and device APIs behind explicit owners.
- **Config:** keep `extends: "expo/tsconfig.base"`, generated Expo/Router types,
  aliases, and Metro settings. Merge the applicable strictness flags rather than
  replacing the Expo base with the shared runtime-neutral config. Confirm the
  effective `lib` and `types`. [Expo TypeScript guidance](https://docs.expo.dev/guides/typescript/).
- **Skills:** common testing/tooling and the platform-independent composition
  guidance. The curated React performance skill contains web/Next examples;
  use only rules that fit React Native. Expo/native-specific skills remain a
  later import; shadcn is for a separate DOM-based web target.
- **Verify:** type check and available behavior tests, then run the changed flow
  on a relevant simulator/device. Verify permissions, keyboard/safe-area behavior,
  navigation, and platform differences when affected. A web preview does not
  verify native behavior. Use a
  [development build](https://docs.expo.dev/develop/development-builds/introduction/)
  when required by native modules.

Local references: [daydb native manifest](/Users/yuriihulyk/Documents/GitHub/daydb/apps/native/package.json)
and [Expo config](/Users/yuriihulyk/Documents/GitHub/daydb/apps/native/tsconfig.json).
The profile covers TS application code; native platform toolchains remain build
prerequisites. Prebuild, signing, and store submission are separate scoped tasks.

## Library and CLI

Choose the consumer runtime first: portable TypeScript, Node, or Bun. Keep portable
domain behavior free of platform globals; give runtime adapters explicit package
boundaries when real consumers need them. React is unnecessary for a plain CLI;
add terminal UI tooling only for an interactive application.

- **Config:** preserve package exports and module semantics. Use the module
  resolution/output settings expected by consumers, not the web app's settings
  by default. Published libraries need usable JavaScript and declarations;
  internal source-consumed packages may only need a type check. Keep test globals
  and test files out of the public declaration surface.
- **Skills:** common testing/tooling; Turbo only for a workspace that uses it.
- **Verify:** type check, observable API/CLI behavior, and the actual build when
  there is one. Import built exports from a small consumer. For a CLI, check
  arguments, stdout/stderr, exit codes, and cleanup in its advertised runtime.
  Bun tests do not establish Node compatibility. Before publishing, inspect
  packed file contents and declarations using the project's packaging workflow.

Local references: [1git Git package](/Users/yuriihulyk/Documents/GitHub/1git/packages/git/package.json)
and [nanofect core exports](/Users/yuriihulyk/Documents/GitHub/nanofect/packages/core/package.json).

## Workspace layer

Apply this alongside any runtime profile when multiple real packages share code.
Use workspace dependencies and explicit public exports. Keep scripts in the
packages that own the work. Add [Turborepo](skills/turborepo/SKILL.md) when the
project benefits from its task graph and cache; the folder layout alone is not
a reason to install it.

Describe actual task inputs, environment dependencies, and output directories.
Test cache restoration against real artifacts; do not copy `dist/**` into every
task. Register prerequisites when a consumer needs built packages. Keep persistent
development services uncached, and keep deployment/database mutations outside
routine quality-check pipelines. Local reference:
[1git task graph](/Users/yuriihulyk/Documents/GitHub/1git/turbo.json).

## Common skills and optional dependencies

[Ultracite](skills/ultracite/SKILL.md) applies where Ultracite is installed or being
adopted. [TDD](skills/tdd/SKILL.md) retains explicit invocation for a requested
regression workflow; ordinary behavior tests still follow the baseline. Select
the other skills by the relevant profile and task.

Effect, Drizzle/database drivers, Better Auth, Alchemy, and AI frameworks remain
explicit project choices. Inspect installed versions and runtime compatibility
before using their APIs. The audited projects span Effect 3 and Effect 4
prereleases; this guide does not select a universal major version. The shared
`cn` package and `shadcn/lint` choice remain unresolved in [TODO.md](../TODO.md).

## Source and validation record

Local manifests/configs were inspected at these project HEADs on 2026-09-22:

| Project | HEAD | Used for |
| --- | --- | --- |
| `daydb` | `d6c9737164e9e922e841ea35526623ce95ae2c71` | Web and mobile |
| `stem` | `28d4fd3e7eed92af4294ee873f5a4af6854a3a8b` | Bun API |
| `agent-bell` | `9e5611af5116cbbeeed425c019e1adeb73f72a7d` | Workers API and infrastructure |
| `1git` | `96c599345a6ef3cd91120b86e67862277b705a8d` | Electron, library, and workspace |
| `nanofect` | `a8e023185d75b140cf2d4c29b50ded6c7b5c5736` | Library exports |

These profiles are adoption guidance. Source examples establish existing patterns,
not that each application passed the checks described here. The command inventory
below was checked against package scripts; application builds, device runs, and
deployments were not performed for this documentation step. The earlier isolated
Git-package validation remains recorded in [the config guide](configs/README.md).

Run script commands from the listed package directory, using its package manager.
These are observed examples, not commands available in `workflow` itself.

| Source package | Existing commands | Additional adoption check |
| --- | --- | --- |
| `daydb/apps/web` | `bun run check-types`, `bun run build` | Browser behavior; no package `test` script |
| `stem/apps/server` | `bun run check-types`, `bun run build` | Add/run meaningful request tests; no package `test` script |
| `agent-bell/apps/server` | `bun run check-types`, `bun run test`, `bun run build` | Workers-runtime/binding verification |
| `1git/apps/desktop` | `bun run check-types`, `bun run test`, `bun run build` | Electron launch; packaging checks when affected |
| `daydb/apps/native` | `bun run check-types`, `bun run start` | Native behavior; `start` is a development server, not a test |
| `nanofect/packages/core` | `bun run check-types`, `bun run test`, `bun run build` | Built-export consumer check |

Read the selected root formatter script too: `daydb`'s `check` writes fixes,
while `1git`, `stem`, and `agent-bell` separate `check` from `fix`.
