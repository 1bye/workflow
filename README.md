# Workflow

Personal TypeScript and Rust conventions and reusable instructions for AI coding agents.

| File | Purpose |
| --- | --- |
| [ts/AGENTS.md](ts/AGENTS.md) | General TypeScript coding and verification defaults |
| [ts/react.md](ts/react.md) | React component ownership, UI organization, state, and styling |
| [ts/testing.md](ts/testing.md) | Test categories, file summaries, dependency boundaries, and suite organization |
| [ts/stacks.md](ts/stacks.md) | Optional web, API, desktop, mobile, library/CLI, and workspace profiles |
| [ts/configs/README.md](ts/configs/README.md) | Shared configs and adoption commands |
| [ts/skills/](ts/skills/) | Curated skills with supporting references and task-specific guidance |
| [rust/AGENTS.md](rust/AGENTS.md) | Rust ownership, errors, readability, spacing, and verification defaults |
| [rust/architecture.md](rust/architecture.md) | Domain modules, public APIs, state ownership, and refactoring |
| [rust/testing.md](rust/testing.md) | Internal and consumer tests, shared helpers, categories, and external suites |
| [rust/rustdoc.md](rust/rustdoc.md) | Module/API documentation, contracts, examples, and doctests |
| [rust/stacks.md](rust/stacks.md) | Library, CLI, async, native/WASM, and workspace profiles |
| [rust/configs/README.md](rust/configs/README.md) | Stable rustfmt template, Cargo lint fragment, and adoption commands |
| [rust/skills/rust-development/](rust/skills/rust-development/) | Rust skill with ownership and refactoring references |
| [scripts/install.ts](scripts/install.ts) | Bun installer with previews, profile selection, and conflict checks |

## Install in a project

Run with Bun from this repository. The target directory must already exist.
The installer has no runtime dependencies and can run before `bun install`.

```sh
# Preview the files that would change.
bun run scripts/install.ts ../my-app --profile web --skills shadcn --dry-run

# Install the same selection.
bun run scripts/install.ts ../my-app --profile web --skills shadcn

# Combine an application profile with workspace guidance.
bun run scripts/install.ts ../my-app --profile web,workspace --skills shadcn,tdd

# Preview a Rust library/workspace, including the root formatter template.
bun run scripts/install.ts ../my-rust-project --profile rust-library,rust-workspace --configs --dry-run

# Install Rust guidance and its skill; keep root tooling project-owned.
bun run scripts/install.ts ../my-rust-project --profile rust-cli

# Combine TypeScript and Rust guidance in one project.
bun run scripts/install.ts ../my-app --profile web,rust-native-wasm,rust-workspace

# Update using the recorded selection after updating this checkout.
bun run scripts/install.ts ../my-app

# Enable the default Oxlint checks on an older installation.
bun run scripts/install.ts ../my-app --oxlint --dry-run
```

| Profile | Skills included by default |
| --- | --- |
| `core` (default), `bun-api`, `workers-api`, `library` | None; TypeScript and selected runtime guidance |
| `web`, `desktop` | `vercel-react-best-practices`, `vercel-composition-patterns` |
| `mobile` | `vercel-composition-patterns` |
| `workspace` | `turborepo` |
| `rust`, `rust-library`, `rust-cli`, `rust-async`, `rust-native-wasm`, `rust-workspace` | `rust-development` |

Use `--skills` for additional skills: `bro`, `unslop`, `tdd`, `ultracite`,
`turborepo`, `vercel-react-best-practices`, `vercel-composition-patterns`, `shadcn`,
or `rust-development`.
Comma-separated and repeated `--profile`/`--skills` flags are supported.
An explicit flag replaces that selection; omitted flags retain the last install.
`--skills none` clears extra skills while retaining profile defaults.
Every Rust profile includes the full Rust baseline and companion guides; only its
selected stack sections are included. `rust` selects the baseline without a runtime
profile. The unprefixed `library` and `workspace` profiles remain TypeScript profiles.

`bro` restates the last response plainly. `unslop` edits writing to remove filler,
stock AI phrasing, and jargon. Both retain explicit invocation: after installation,
use `$bro` or `$unslop` when needed. For example, add them with
`--skills bro,unslop`, alongside any other extra skills you want to retain.

For selected TypeScript profiles, the installer copies the baseline, React and
testing guides, selected stack sections, and config references into `.agents/workflow/`.
Rust guides and config references go into `.agents/workflow/rust/`. Rust-only installs
omit the TypeScript guides and tools. Mixed installs include both sets, with language
routing in the instruction block. Skills are copied in full into `.agents/skills/`.
A marked block in root `AGENTS.md` directs agents
to the guides; existing project instructions outside that block are preserved.
Relative links are adjusted for the installed layout. Unselected skill references
become plain text instead of broken links. Skill invocation metadata is preserved.

Add `--configs` to copy the selected languages' templates into the project root:
`biome.json` and `tsconfig.base.json` for TypeScript, and `rustfmt.toml` for Rust.
Existing root configs are conflicts, including the alternate names `biome.jsonc`
and `.rustfmt.toml` when adopting their corresponding tool.
The installer does not merge `tsconfig.json` or Cargo manifests, change toolchains,
install tools, run package scripts, or select runtime globals.
Follow [the TypeScript config guide](ts/configs/README.md) to add
the required dependencies and extend the base appropriately. Without `--configs`,
the bundled config files remain reference templates under `.agents/workflow/`.

New TypeScript installs copy the combined config with ESLint Stylistic blank-line rules and
shadcn design-system checks into root `.oxlintrc.json` by default. This works
independently of `--configs` and preserves the existing Biome setup. Existing
installs retain their recorded choice; use `--oxlint` to enable it on an older
install. `--no-oxlint` skips or removes an unedited managed root config.
Existing Oxlint configs are conflicts: merge the spacing rules into a project-owned
config and use `--no-oxlint` to keep the installer from managing that root file.
Install the documented dependencies and add lint scripts explicitly; see the
[Oxlint guide](ts/configs/README.md#oxlint-spacing-and-shadcn).

Use `--no-biome` when the project uses another formatter and linter. It omits
the Biome template and Ultracite stack guidance, and installs Oxc config guidance
in place of the Biome guide. `--biome` restores them. Root tool dependencies and scripts
remain project-owned. `--no-biome` cannot be combined with `--configs` when TypeScript
profiles are selected, because that copies the Biome root template. These choices
apply only to TypeScript; `--oxlint` requires a TypeScript profile. Stored TypeScript
tooling choices are retained when switching languages and apply again if TypeScript
profiles are selected later.

For Rust, follow [the Rust config guide](rust/configs/README.md) to merge the lint
fragment into a package manifest or use workspace lint inheritance. The fragment
is a reference, not automatically activated configuration. Logical blank-line
spacing is documented as a writing/review convention; rustfmt does not enforce the
TypeScript statement-padding policy. No custom formatter or lint plugin is installed.

`.agents/workflow/install.json` records the selections and hashes of managed
files and the instruction block. Commit it with the installed files. Rerunning
updates unchanged managed copies and removes obsolete managed files when a
selection or source changes. Unrelated files remain untouched; empty directories
may remain. Locally edited/deleted managed files, existing unmanaged destinations,
malformed instruction markers, and symlinks require manual handling. A root
`AGENTS.override.md` also stops installation because it can supersede `AGENTS.md`.

Any detected conflict exits with status 1 before writing files, including in a
preview. Review the reported paths, preserve customizations in project-owned
instructions/files, and restore managed content or merge it to match the desired
source before rerunning. Preview is optional and exits with status 0 when clean.
Do not edit the target concurrently with an install. Individual writes are atomic;
a filesystem failure can leave a partial install. The record is written last;
review or restore the partial diff before retrying.

Review the installed diff and verify which instructions and skills the agent
loads. Use `--help` for the complete command syntax.

## Maintain the installer

```sh
bun install --frozen-lockfile
bun run check-types
bun run lint
bun test
```

Tests use temporary projects to cover profiles, complete skill copies, local
links, previews, repeated installs, updates, conflicts, and path boundaries.
Config tests run the real Oxlint plugins and Biome against temporary TypeScript
and Tailwind examples, including the installed config layout.

When changing Rust tooling/templates, also run:

```sh
bun run test:rust
```

This uses Cargo, rustfmt, and Clippy on temporary, dependency-free packages and
workspaces to verify formatting, manifest lint activation/inheritance, consumer
tests, and doctests. It requires a Rust toolchain with those components on PATH;
missing prerequisites fail clearly. Ordinary `bun test` needs no Rust toolchain.
Installer tests cover Rust-only/mixed profiles, updates, language switches, and
preservation of existing Cargo/toolchain configuration.

## Adopt manually

1. Read the target project's existing instructions and tool configuration.
2. Merge the relevant baseline into its agent instructions. Preserve project-specific
   commands, runtime requirements, and architectural exceptions.
3. For React work, include the companion guide and an explicit instruction to read
   it. Keep its path correct relative to the adopted baseline.
4. Select the relevant [TypeScript](ts/stacks.md) or [Rust](rust/stacks.md) stack profile
   for each app/package and merge its runtime boundaries and check commands into
   the project's instructions.
5. Have the agent identify the instructions it loaded and the actual validation
   commands before using the setup for a change.

These files are maintained here. Storing them in this repository does not activate
them in other projects. When using a copy, record its source revision so updates
can be reviewed deliberately.

Select skills by task and copy complete folders with their supporting resources.
Keep runtime requirements, installed versions, and validation commands explicit
in the target project's instructions.
