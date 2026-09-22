# TypeScript workflow audit

Reviewed on 2026-09-16. Source: local projects under `/Users/yuriihulyk/Documents/GitHub`.

The best starting point is a small set of your own TypeScript and React rules, a few reusable tool configs, and a catalog of optional skills. Your strongest personal conventions are in `RULES-GENERIC.md`, especially the expanded UI section in `1git`. Most root `AGENTS.md` files are copies of the same Ultracite preset and contribute little project-specific guidance.

This report records the pre-migration review and proposals. Steps 1–4 are now implemented: the TypeScript/React guides, shared configs validated in an isolated copy of `1git/packages/git`, [six curated skills](ts/skills/) with complete folders and local adaptations, and [optional stack profiles](ts/stacks.md). See [README.md](README.md) for adoption and the selected defaults. `TODO.md` retains the original notes. The optional installer remains step 5.

## Scope and evidence

- Inventoried 97 visible top-level project directories. Used the latest local HEAD commit date to prioritize recent work, rather than directory modification times. A commit date is a selection signal, not proof that you authored the repository or recently worked on every file.
- Compared manifests and agent material in 21 projects: `altavinci`, `1git`, `portfolio`, `race`, `anyway-design`, `daydb`, `lenths`, `gpuix`, `better-x`, `agent-bell`, `kunni`, `uidesgn`, `nanofect`, `taada-old`, `apiser`, `cmon`, `stem`, `cloudflare-fullstack-boilerplate`, `missed`, `atmat`, and `atmat-old`.
- Read the distinctive general/UI rules and representative skill contents; compared skill entry-file hashes and available `skills-lock.json` provenance. Examined selected TypeScript, Biome, Turbo, editor, hook, and UI configs. This is a configuration audit, not a source-code or security audit of every application.
- Checked older or supplementary sources where useful, including `aiperf`, `1bye-cli`, `raw`, `elysia-boilerplate`, and Altavinci's authored content skills.
- Excluded dependencies, build output, vendored implementations, archived material, and non-TypeScript implementation details from migration recommendations. Inspected only the relevant TypeScript-facing parts of mixed-language projects. Did not read credentials or environment-file values.
- Package versions below describe local manifests, not a claim about current upstream releases. No installs, builds, tests, deployments, or package scripts were run.

## What is worth taking first

| Priority | Source | What to preserve | What to change before reuse |
| --- | --- | --- | --- |
| 1 | [1git/RULES-GENERIC.md](/Users/yuriihulyk/Documents/GitHub/1git/RULES-GENERIC.md:470) | UI ownership; `ui/`, `fixture/`, `feature/`; cohesive components; state ownership; purposeful effects; accessibility; observable UI tests | Extract a short React guide. Do not copy the entire 804-line document into every project's prompt. |
| 1 | [altavinci/RULES-GENERIC.md](/Users/yuriihulyk/Documents/GitHub/altavinci/RULES-GENERIC.md:1) | Inspect owners/callers first; keep changes coherent; precise naming; validation at boundaries; preserve error causes; tests of behavior; avoid speculative abstractions | Reconcile its functions-first advice with your stateless-OOP preference. `lenths` has an identical 530-line copy, so keep one source. |
| 1 | [workflow/TODO.md](/Users/yuriihulyk/Documents/GitHub/workflow/TODO.md:1) | Your actual preferences: stateless OOP, tests, spaces, UI fixtures, cohesive TSX files | Turn these into precise rules. The `cn` package and `shadcn/lint` notes need a concrete package/API choice; they are not established by the examples reviewed. |
| 1 | [daydb's tdd skill](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/tdd/SKILL.md:1) | Reproduce a bug, choose a cheap meaningful regression check, show failing-before and passing-after evidence | Keep its narrow scope and practical exceptions. Use as an optional bug-fixing workflow, not a requirement to build a new test harness for every edit. |
| 1 | [1git TypeScript base](/Users/yuriihulyk/Documents/GitHub/1git/packages/config/tsconfig.base.json:1) | Strict types, indexed-access checks, module syntax, unused-code and switch checks | Separate runtime-specific globals and module settings from the common base. |
| 1 | [anyway-design Biome config](/Users/yuriihulyk/Documents/GitHub/anyway-design/biome.json:1) | A clear core + React + TanStack preset example | Use spaces as requested. Put React/TanStack rules in their matching profiles; trim unrelated generated-folder exclusions. |
| 2 | [1git's hooks](/Users/yuriihulyk/Documents/GitHub/1git/lefthook.yml:1) and [Turbo tasks](/Users/yuriihulyk/Documents/GitHub/1git/turbo.json:1) | Scoped formatting and explicit build/typecheck/test commands | Make hooks optional. Adapt task dependencies and outputs to the actual application. Preserve partially staged work when choosing a hook strategy. |
| 2 | [daydb's skills](/Users/yuriihulyk/Documents/GitHub/daydb/skills-lock.json:1) and [agent-bell's skills](/Users/yuriihulyk/Documents/GitHub/agent-bell/skills-lock.json:1) | Sources for web/mobile skill bundles | Select complete, compatible skill directories and retain provenance. Do not import every skill into every project. |
| 2 | [aiperf/SKILL.md](/Users/yuriihulyk/Documents/GitHub/aiperf/SKILL.md:1) | Evidence-backed Chrome/React profiling and comparison of the same flow before/after a change | Keep optional and dependent on the profiling tool. Its implementation language does not need to become part of your TypeScript workflow repository. |
| 3 | [motion-choreography](/Users/yuriihulyk/Documents/GitHub/altavinci/content/motion-choreography/SKILL.md:1), [cmon](/Users/yuriihulyk/Documents/GitHub/cmon/.agents/skills/cmon/SKILL.md:1) | Useful specialized creative or project-management workflows | Keep separate from core coding instructions; use only when the task needs them. |

## Recent projects and their stacks

“Take” means a candidate pattern or document, not an endorsement of copying the whole application. Frameworks are drawn from workspace manifests; their presence does not establish that every package is actively used.

| Project | Last HEAD commit | Observed stack | Assessment for workflow |
| --- | --- | --- | --- |
| [altavinci](/Users/yuriihulyk/Documents/GitHub/altavinci/package.json) | 2026-09-15 | Bun/Turbo; TS 6; React 19; Vite/TanStack Start; Electron; Effect 4 RC; Elysia and Hono; Drizzle/Neon; Better Auth; Alchemy; AI SDK/Mastra | Richest source of architecture rules and specialized skills. Its multi-runtime application structure, extensive lint exceptions, native renderer, and vendoring hook are unsuitable as universal defaults. |
| [1git](/Users/yuriihulyk/Documents/GitHub/1git/package.json) | 2026-09-15 | Bun/Turbo; TS 6; Electron/React/Vite; Tailwind/shadcn/Base UI; Bun tests; additional gpuix target | Best source for UI conventions and explicit quality scripts. Keep the Electron/TS example separate from its native-backed target. |
| [portfolio](/Users/yuriihulyk/Documents/GitHub/portfolio/package.json) | 2026-09-15 | Bun/Turbo; React/TanStack Start; Tailwind/shadcn with Radix; Hono; Drizzle/Neon; Alchemy/Effect 4 RC | Good web and infrastructure example. Active web and archive packages differ; avoid copying archived UI assumptions into a new app. |
| [race](/Users/yuriihulyk/Documents/GitHub/race/package.json) | 2026-09-15 | Bun; TS scene/schema packages; Effect 4 RC; Vite; Rust/WASM renderer | Retain the installed-version documentation lookup idea and TS contract-testing ideas. Exclude Rust rules, Cargo commands, renderer infrastructure, and the Rust skill. |
| [anyway-design](/Users/yuriihulyk/Documents/GitHub/anyway-design/package.json) | 2026-09-15 | Bun/Turbo; TS 6; React/TanStack Start; Tailwind/shadcn/Base UI; Alchemy/Effect 4 RC; motion libraries | A useful reference for your recent web stack and framework-specific lint presets. Root tests are targeted `test:md` and `test:plan`, not a universal `test` command. |
| [daydb](/Users/yuriihulyk/Documents/GitHub/daydb/package.json) | 2026-09-07 | Bun/Turbo; TS 6; React/TanStack Start; Expo/React Native; Effect 4 RC; Drizzle RC/Neon; Better Auth; Alchemy; direct Biome | Strong web/mobile and skill reference. Contains useful personal communication and regression-testing skills. Its `check` script writes fixes, so do not treat it as a read-only validation template. |
| [lenths](/Users/yuriihulyk/Documents/GitHub/lenths/package.json) | 2026-08-28 | Bun/Turbo; TS 6; Electron/React/Vite; Effect 3; SQLite/Drizzle; MCP; Bun and Node tests | Useful desktop example with explicit contracts, runtime, and storage packages. Demonstrates why Bun package management does not imply every test must run under Bun. |
| [gpuix](/Users/yuriihulyk/Documents/GitHub/gpuix/package.json) | 2026-08-25 | Bun; React renderer/native bindings; Vite/Vitest; bundled native editor code | Keep outside the initial TS-only starter. Its long native-development instructions are not a useful global agent baseline. |
| [better-x](/Users/yuriihulyk/Documents/GitHub/better-x/package.json) | 2026-08-09 | Bun; Vite+; Electron/React; extension app; Tailwind/Base UI; Ultracite/Biome also present | Evidence of an alternative tooling direction. Resolve which linter/formatter owns which files before borrowing configs. |
| [agent-bell](/Users/yuriihulyk/Documents/GitHub/agent-bell/package.json) | 2026-08-05 | Bun/Turbo; TS 6; Expo/React Native/HeroUI Native; Hono; Drizzle/libSQL; Alchemy/Workers | Useful focused mobile + API example, Hono skill, staged-file hook, and regression test script. |
| [kunni](/Users/yuriihulyk/Documents/GitHub/kunni/package.json) | 2026-07-29 | Bun/Turbo; React/TanStack Start; Elysia; Drizzle; PGlite/Neon; Better Auth; Alchemy | Useful backend, contracts, and integration-package examples. Large provider-specific package tree is application material, not shared agent policy. |
| [uidesgn](/Users/yuriihulyk/Documents/GitHub/uidesgn/package.json) | 2026-07-11 | Bun/Vite+; TS; Next/React docs; browser extension and Figma plugin; Oxlint/Oxfmt; visual regression tooling | Consider its visual verification approach separately. Its `check` command also formats; its Biome and Ox tooling files need reconciliation before extraction. |

Older projects add useful comparisons:

| Project | Last HEAD commit | What it adds |
| --- | --- | --- |
| [nanofect](/Users/yuriihulyk/Documents/GitHub/nanofect/package.json) | 2026-06-14 | Bun/Turbo library workspaces, Effect 3, Next docs, observability packages, and per-package Bun tests. Useful library profile rather than app template. |
| [taada-old](/Users/yuriihulyk/Documents/GitHub/taada-old/package.json) | 2026-06-09 | React/Vite/TanStack Router plus Expo and an independent domain package. Another example of separating domain logic from UI. |
| [aiperf](/Users/yuriihulyk/Documents/GitHub/aiperf/SKILL.md) | 2026-06-05 | A distinctive performance-analysis skill. Keep the workflow idea; no need to migrate its Rust implementation. |
| [apiser](/Users/yuriihulyk/Documents/GitHub/apiser/package.json) | 2026-06-01 | Turbo TS libraries and Next apps; older ESLint/Prettier configuration alongside Ultracite. Useful package/API patterns, weaker tooling baseline. |
| [cmon](/Users/yuriihulyk/Documents/GitHub/cmon/package.json) | 2026-05-18 | Bun/Turbo, Solid/OpenTUI, domain/core packages, and a skill for its own CLI. Optional terminal-app profile. |
| [stem](/Users/yuriihulyk/Documents/GitHub/stem/package.json) | 2026-04-10 | A smaller Elysia + Drizzle/libSQL backend example. Better reference for a focused API than a large all-purpose application. |
| [cloudflare-fullstack-boilerplate](/Users/yuriihulyk/Documents/GitHub/cloudflare-fullstack-boilerplate/package.json) | 2026-03-31 | TanStack Start, Better Auth, Drizzle/libSQL, Alchemy, shared config/env/UI packages. Useful layout; package versions and resource identifiers stay project-specific. |
| [missed](/Users/yuriihulyk/Documents/GitHub/missed/package.json) | 2026-03-28 | React/TanStack Start, Hono/Elysia, Mastra, Drizzle/Neon, Alchemy. Mostly overlaps newer examples. |
| [atmat](/Users/yuriihulyk/Documents/GitHub/atmat/package.json) | 2026-03-21 | React/TanStack Router, Elysia, Drizzle/Neon, Mastra, and a Mastra skill. Preserve the optional framework skill, not every installed workflow. |
| [atmat-old](/Users/yuriihulyk/Documents/GitHub/atmat-old/package.json) | 2026-03-18 | Effect 3, Elysia, Better Auth, Drizzle/libSQL, and many process skills. Harvest debugging/verification principles; avoid importing the entire process bundle. |
| [1bye-cli](/Users/yuriihulyk/Documents/GitHub/1bye-cli/package.json) | 2026-03-15 | Bun/Turbo, Solid/OpenTUI, Hono, AI SDK, Next docs. Useful only if you want a CLI-agent profile. |
| [raw](/Users/yuriihulyk/Documents/GitHub/raw/package.json) | 2026-02-23 | Smaller React/Vite/TanStack Router setup. Mostly duplicates the web patterns above. |
| [elysia-boilerplate](/Users/yuriihulyk/Documents/GitHub/elysia-boilerplate/package.json) | 2025-09-30 | Compact Bun/Elysia/Drizzle/Better Auth example, but its test command is still the generated failing placeholder. Prefer `stem` or current app packages as evidence. |

Older Svelte projects show a previous direction, but the recent sources above favor React. Keep Svelte guidance optional if you return to it. Recent Swift projects such as `Mura`/`taada`, C#/Godot work such as `mla`, and Rust-centric editor projects do not belong in this first migration. `metalforge-shader-lab` has a small React/Vite/TypeScript setup but no local HEAD date in this inventory and no distinctive agent policy worth prioritizing.

## Agent instructions: consolidate the useful parts

Eleven root `AGENTS.md` files are byte-identical: `atmat`, `1git`, `atmat-old`, `agent-bell`, `stem`, `missed`, `cloudflare-fullstack-boilerplate`, `portfolio`, `lenths`, `anyway-design`, and `taada-old`. `nanofect` and `apiser` share another almost identical formatting variant. These are Ultracite instructions, not thirteen independent sets of personal preferences.

`altavinci` has a more useful short entry point: commands, a pointer to its general rules, and installed Effect documentation. However, even this entry point needs maintenance: it mentions Vitest for preview while the current preview manifest defines `bun test`. Instructions should name commands that actually exist in the relevant package.

`1git` and `lenths` contain richer `RULES-GENERIC.md` documents, but their root `AGENTS.md` files do not point to them. A shared baseline should explicitly direct the agent to applicable detailed rules instead of relying on discovery.

Keep these concepts in the general TypeScript policy:

- Inspect the owning code, callers, types, tests, and nearby conventions before editing.
- Keep behavior with the domain or module that owns it. Use existing vocabulary.
- Preserve strict types. Narrow unknown input and validate at trust boundaries.
- Keep error context and causes; catch to recover, translate, or clean up.
- Avoid introducing factories, interfaces, registries, or shared utilities without a concrete purpose.
- Test observable behavior and meaningful failures; report what was actually verified.
- Document contracts, invariants, and non-obvious decisions rather than narrating syntax.

Keep the React-specific material in a separate, explicitly referenced guide:

- `ui/` holds reusable primitives; `fixture/` holds composed UI with little domain state; `feature/` owns substantial state or workflows.
- A fixture in this convention is a UI composition, not test data. Name test fixtures distinctly.
- One cohesive main component, or a few closely related small components, can share a TSX file. Split by responsibility or independent behavior, not a numeric line limit.
- State belongs close to its owner. Derived values usually remain derived. Context, stores, effects, and memoization should each have a concrete reason.
- Follow the component library's semantics and accessibility behavior. Test important interactions and user-visible states.

Do not treat the old source layout as proof that the written convention is consistently enforced: Altavinci's `fixture/` tree also contains large timeline/workbench state and behavior. Use the intended convention for new work; do not automatically rename old application folders during this migration.

## Configs worth centralizing

| Config | Proposed common part | Keep local or optional |
| --- | --- | --- |
| TypeScript | Strictness, indexed-access checking, explicit module syntax, unused-code checks, switch checks | Browser/Node/Bun/Workers globals, JSX, target, module resolution, emit, declarations, paths, framework-generated config |
| Biome/Ultracite | One primary formatting/linting choice; spaces; shared core rules | React/TanStack presets, generated paths, justified rule exceptions, tool versions |
| Package scripts | Consistent names for `check`, `fix`, `check-types`, `test`, and `build` when applicable | The actual implementation and runtime of each command |
| Turbo | Only for real workspaces; package scripts and explicit task dependencies | Build outputs, environment dependencies, artifact prerequisites, persistent dev services, database/deploy tasks |
| Git hooks | Optional scoped checks with predictable output | Autostaging policy and project-specific generated-file steps |
| Editor settings | Use the selected formatter for TS/TSX and align format-on-save behavior | Editor-specific keys, available language servers, unsupported file types |
| UI config | Existing class-composition helper and deliberate component-library choice | Aliases, icon library, theme, Base UI versus Radix, custom Tailwind tokens |

Specific cleanup needed before copying:

1. **Spaces:** the inspected Biome configs explicitly use tabs. Your TODO says spaces. Set the new shared formatter intentionally and make editor settings agree; do not infer your preference from generated configs.
2. **Lint exceptions:** Altavinci disables numerous accessibility, `any`, non-null assertion, and other checks. Those exceptions are not evidence of good universal defaults. `anyway-design` or `agent-bell` are cleaner starting references, still requiring adaptation.
3. **Checks versus fixes:** `daydb` defines `check` as `biome check --write .`; `uidesgn` defines `check` as `oxlint && oxfmt --write`. Give shared scripts clear read-only versus mutation behavior.
4. **Overlapping tools:** `better-x` combines Vite+ commands, Ultracite commands, a Biome config, and Oxlint/Oxfmt hooks. `uidesgn` also has both Biome and Ox tooling files. Choose an active owner for formatting/linting before migration. Presence alone does not establish that each config runs.
5. **Runtime types:** several common TS configs mix Node and Workers globals. Reuse strictness without making every browser or mobile project inherit those environments.
6. **Task outputs:** the common Turbo `dist/**` output is an example, not a promise that it covers every framework's artifacts. Test tasks also differ: `1git` depends on upstream builds; `lenths` depends on its package build; `agent-bell` uses upstream tests.
7. **Hook scope:** Altavinci's pre-commit hook vendors source from the sibling `race` repository and stages it. That is application-specific automation and should stay there.
8. **Class merging:** reviewed UI packages define local `cn()` using `clsx` and `tailwind-merge`. `1git` and Altavinci additionally register a custom `text-xss` font size. Preserve that override only where the token exists. The exact `cn` package and `shadcn/lint` integration in your TODO were not established in the inspected manifests/configs.

## Skill inventory and recommendations

The 21-project comparison found **108 canonical `.agents/skills/*/SKILL.md` entries, 47 directory names, and 72 distinct entry-file hashes**. One name is `rust-skills`, leaving 46 potentially relevant names. These counts exclude additional content skills and tool-specific aliases; hashes compare `SKILL.md`, not entire skill directories or reference files.

There is substantial version drift: Turborepo has 12 copies and 11 distinct entry files; Ultracite has 12 copies and 5 variants; shadcn has 7 copies and 4 variants. Several `.claude/skills` and `.windsurf/skills` entries are symlinks back to `.agents/skills`, so they should not become independent copies.

| Skills | Recommendation | Source and reason |
| --- | --- | --- |
| `ultracite` | Keep one optional tooling skill | [1git copy](/Users/yuriihulyk/Documents/GitHub/1git/.agents/skills/ultracite/SKILL.md). Good setup/troubleshooting reference. Match the selected backend and project version. |
| `turborepo` | Keep one workspace skill | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/turborepo/SKILL.md). Relevant to many projects, unnecessary for a single package or this documentation repository itself. |
| `vercel-react-best-practices` | Keep for React work | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/vercel-react-best-practices/SKILL.md). Apply React rules where relevant and keep Next-specific rules out of TanStack/Vite projects. |
| `vercel-composition-patterns` | Keep for UI architecture tasks | [altavinci copy](/Users/yuriihulyk/Documents/GitHub/altavinci/.agents/skills/vercel-composition-patterns/SKILL.md). Useful for component API problems; do not make every component a compound-component abstraction. |
| `shadcn` | Keep for projects that use it | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/shadcn/SKILL.md). Preserve its reference files and match the installed component version and Base UI/Radix choice. Its dynamic context and tool declarations also need checking in the target agent. |
| `web-design-guidelines` | Optional UI review | [altavinci copy](/Users/yuriihulyk/Documents/GitHub/altavinci/.agents/skills/web-design-guidelines/SKILL.md). Separate from general implementation instructions; it retrieves external guidance when used. |
| `tdd` | Adapt into your preferred regression workflow | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/tdd/SKILL.md). Short, pragmatic, and includes a fallback when a meaningful test is impractical. |
| `systematic-debugging`, `verification-before-completion` | Extract a short common principle; optional deeper guides | [debugging](/Users/yuriihulyk/Documents/GitHub/atmat-old/.agents/skills/systematic-debugging/SKILL.md), [verification](/Users/yuriihulyk/Documents/GitHub/atmat-old/.agents/skills/verification-before-completion/SKILL.md). Root-cause investigation and evidence are useful; repetitive gatekeeping prose need not be copied. |
| `effect-ts` | Rewrite setup guidance before reuse | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/effect-ts/SKILL.md), [altavinci copy](/Users/yuriihulyk/Documents/GitHub/altavinci/.agents/skills/effect-ts/SKILL.md). Current copies install `effect@rc` or `effect@beta`. Preserve installed-version documentation lookup; do not silently upgrade Effect 3 projects. |
| `hono`, `elysiajs` | Separate optional API profiles | [Hono](/Users/yuriihulyk/Documents/GitHub/agent-bell/.agents/skills/hono/SKILL.md), [Elysia](/Users/yuriihulyk/Documents/GitHub/stem/.agents/skills/elysiajs/SKILL.md). Both have repeated use. Avoid forcing both into each backend. |
| `better-auth-best-practices` | Optional auth profile | [existing copy](/Users/yuriihulyk/Documents/GitHub/cloudflare-fullstack-boilerplate/.agents/skills/better-auth-best-practices/SKILL.md). Keep version-sensitive examples attached to projects that actually use Better Auth. |
| `neon-postgres` | Optional database profile; repair dependencies first | [daydb copy](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/neon-postgres/SKILL.md). References a parent `neon` skill absent from that local skills directory. Does not belong in libSQL/SQLite-only projects. |
| `expo-overview`, `expo-router`, `expo-native-ui`, `expo-data-fetching`, `expo-dev-client`, `expo-tailwind-setup` | Optional Expo bundle | [daydb provenance](/Users/yuriihulyk/Documents/GitHub/daydb/skills-lock.json), [agent-bell provenance](/Users/yuriihulyk/Documents/GitHub/agent-bell/skills-lock.json). Useful TS mobile guidance, selected by task and installed Expo version. |
| `eas-workflows`, `eas-app-stores` | Optional mobile release bundle | [workflow skill](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/eas-workflows/SKILL.md), [app-store skill](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/eas-app-stores/SKILL.md). Keep release operations separate from everyday code work. |
| `heroui-native`, `vercel-react-native-skills` | Optional React Native UI bundle | [HeroUI](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/heroui-native/SKILL.md), [React Native](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/vercel-react-native-skills/SKILL.md). HeroUI copies differ between projects; select intentionally. |
| `mastra` | Optional AI application profile | [atmat copy](/Users/yuriihulyk/Documents/GitHub/atmat/.agents/skills/mastra/SKILL.md). Useful installed-docs-first approach. AI application development and configuring a coding agent are separate uses. |
| `agent-browser` | Optional browser verification | [atmat-old copy](/Users/yuriihulyk/Documents/GitHub/atmat-old/.agents/skills/agent-browser/SKILL.md). Tool-dependent; do not force its CLI if the selected agent already has suitable browser tools. |
| `opentui`, `cmon` | Optional terminal/project-management skills | [OpenTUI](/Users/yuriihulyk/Documents/GitHub/cmon/.agents/skills/opentui/SKILL.md), [cmon](/Users/yuriihulyk/Documents/GitHub/cmon/.agents/skills/cmon/SKILL.md). Useful only with those tools. Keep initialization and commit actions task-driven. |
| `animejs` | Defer pending API verification | [altavinci copy](/Users/yuriihulyk/Documents/GitHub/altavinci/.agents/skills/animejs/SKILL.md). Mixes default `anime(...)` and named-import examples while the project declares Anime.js 4.5.0. Verify examples against the target installed API before treating it as authoritative. |
| `unslop`, `bro` | Merge useful tone preferences into a short optional guide | [unslop](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/unslop/SKILL.md), [bro](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/bro/SKILL.md). Plain language is valuable; rigid punctuation bans and duplicated style layers are unnecessary. `unslop` says “always” while declaring disabled automatic invocation, so clarify intended activation. |
| `how`, `teach` | Adapt before copying | [how](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/how/SKILL.md), [teach](/Users/yuriihulyk/Documents/GitHub/daydb/.agents/skills/teach/SKILL.md). Good explanatory intent, but tool/model assumptions are agent-specific; `teach` depends on a `why` skill absent from the local bundle. |
| `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `dispatching-parallel-agents`, `subagent-driven-development`, `test-driven-development`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `writing-skills` | Defer the bundle; retain individual workflows only if you want them | [atmat-old bundle entry](/Users/yuriihulyk/Documents/GitHub/atmat-old/.agents/skills/using-superpowers/SKILL.md). Considerable overlap, broad mandatory triggers, and agent-tool assumptions. Useful review/planning ideas do not require installing the entire process. |
| `anthropics skills main skills-skill-creator` | Keep only if deliberately maintaining that skill toolchain | [existing copy](</Users/yuriihulyk/Documents/GitHub/altavinci/.agents/skills/anthropics skills main skills-skill-creator/SKILL.md>). Check its scripts, runtime requirements, and overlap with the skill creator supplied by the chosen agent. |
| `rust-skills` | Exclude | Outside your stated language scope. |

Additional material outside that canonical count:

- [aiperf](/Users/yuriihulyk/Documents/GitHub/aiperf/SKILL.md): worthwhile specialized profiling skill; keep its required tool and evidence format explicit.
- [motion-choreography](/Users/yuriihulyk/Documents/GitHub/altavinci/content/motion-choreography/SKILL.md): worthwhile creative guidance, independent of the generic TypeScript coding baseline.
- [Altavinci authoring skill 0.3](/Users/yuriihulyk/Documents/GitHub/altavinci/content/skill/0.3/SKILL.md): product-specific HTML/AltScript authoring and rendering. Keep in Altavinci for now; it is not general TypeScript guidance. Older content versions and `docs/trash` should not be imported.
- `atmat-old/.windsurf/skills/effect-ts-expert`: a separate legacy Effect skill, recorded as a Smithery source. Review against its intended Effect major version if needed; do not blend it into the newer setup skill automatically.

Most framework skills are upstream material, not personal policy. The existing lockfiles identify sources including `vercel/turborepo`, `haydenbleasel/ultracite`, `vercel-labs/agent-skills`, `shadcn/ui`, `Effect-TS/skills`, `expo/skills`, `better-auth/skills`, `elysiajs/skills`, `neondatabase/agent-skills`, and `yusukebe/hono-skill`. Keep those origins and licenses when curating them. For locally modified or untracked skills, record that provenance is incomplete rather than inventing an upstream identity.

## Proposed stack profiles

Implemented guidance is now in [ts/stacks.md](ts/stacks.md), including runtime
boundaries, skill selection, config adoption, and package-specific checks. The
table below preserves the original audit recommendations.

These are proposals based on your local projects, not claims that one framework is universally preferable.

| Profile | Candidate starting point | Scope |
| --- | --- | --- |
| Core TypeScript | Bun package management; strict TypeScript; one lint/format setup; project-appropriate tests | Shared baseline. No UI, database, Effect, or monorepo requirement. |
| React web | React + Vite; TanStack Router/Start where required; Tailwind + shadcn | Your clearest recent direction. Keep Next and Svelte as optional alternatives. |
| Bun API | Elysia; runtime schemas; optional Drizzle/auth | Supported by `stem`, `kunni`, and other backends. |
| Workers API | Hono; explicit Workers bindings; optional database/auth | Supported by `agent-bell`, `portfolio`, and related infra. |
| Desktop | Electron + React/Vite; explicit main/renderer boundary | Supported by `1git`, `lenths`, and `better-x`. Exclude native renderer/Rust targets from this starter. |
| Mobile | Expo + React Native; optional HeroUI Native | Supported by `daydb` and `agent-bell`. |
| Library / CLI | TS package exports; narrow build/typecheck/test scripts; optional OpenTUI | Supported by `nanofect`, `cmon`, and `1bye-cli`. |

Effect is common but spans two incompatible major-version directions in the manifests: Effect 3 in `lenths`/`nanofect`/`atmat-old`, and Effect 4 release candidates in several newest apps. Make it an explicit project choice. The same applies to stable versus prerelease Drizzle and Alchemy packages.

Turborepo belongs in the workspace profile. `workflow` can remain a plain repository of Markdown, skills, and config examples until it actually needs executable tooling.

## Suggested first migration

Start with the structure already present instead of introducing a package/plugin system:

```text
workflow/
  README.md                 what is here and how to adopt it
  PROJECT_AUDIT.md           this report and source evidence
  ts/
    AGENTS.md               concise personal TypeScript defaults
    react.md                UI conventions from 1git, edited to your preferences
    stacks.md               optional stack choices and their boundaries
    configs/                only the first configs you actually adopt
    skills/                 only selected, complete skill directories
```

This is a proposed layout, not a claim that agents automatically discover `ts/skills` or apply `ts/AGENTS.md` to sibling projects. Keep storage separate from activation. When adopting material in a project, deliberately place or reference it through that agent's supported mechanism and verify it loads. Avoid maintaining independently edited copies of the same instructions across agent formats.

Recommended sequence:

1. Write the short personal TS baseline and React guide. Incorporate your TODO and resolve the OOP wording before copying the generic construct-selection table.
2. Add a spaces-based formatter example and a runtime-neutral strictness config, then apply them to one chosen TS project to verify compatibility. Add runtime/framework variants only when needed.
3. Add a small skill catalog with source, chosen revision/hash, local edits, required tools, and references. Select the regression-testing skill and the tooling/UI skills you use first. Preserve whole skill folders, not just entry files.
4. Add web, API, desktop, or mobile profiles as you adopt them. Do not copy all optional dependencies into a universal starter.
5. Consider a Bun/TypeScript installer only after manual adoption reveals repetitive work. No shell/Rust/Python installer or published package is needed for this first version.

## Preferences to settle during migration

The audit can stand independently of these decisions; they matter when activating shared defaults.

- **OOP:** your TODO favors stateless OOP, while all three `RULES-GENERIC.md` copies favor functions for stateless calculations. Use your stated preference as the proposal's starting point; decide how strongly to enforce stateless classes and preserve React function components. Do not copy both opposing rules.
- **Spaces:** clear preference already recorded. Indent width remains unspecified; two spaces is a reasonable proposed default.
- **`cn` and `shadcn/lint`:** establish the exact intended dependency or command. The inspected implementations use a local class-merging helper.
- **Effect:** optional per-project profile versus a default for new backends; keep its major version explicit either way.
- **Agent targets:** decide which tools should receive the first exported instructions/skills. The repository can keep one maintained source without promising identical discovery or hooks across agents.

The highest-value extraction is your ownership, UI-organization, and verification guidance. Deduplicating upstream skills and aligning configs with those preferences will make the collection easier to trust than importing every existing file.
