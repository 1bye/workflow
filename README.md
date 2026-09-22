# Workflow

Personal TypeScript conventions and reusable instructions for AI coding agents.

| File | Purpose |
| --- | --- |
| [ts/AGENTS.md](ts/AGENTS.md) | General TypeScript coding and verification defaults |
| [ts/react.md](ts/react.md) | React component ownership, UI organization, state, and styling |
| [ts/stacks.md](ts/stacks.md) | Optional web, API, desktop, mobile, library/CLI, and workspace profiles |
| [ts/configs/README.md](ts/configs/README.md) | Shared configs and adoption commands |
| [ts/skills/](ts/skills/) | Six curated skills with supporting references and task-specific guidance |
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

# Update using the recorded selection after updating this checkout.
bun run scripts/install.ts ../my-app
```

| Profile | Skills included by default |
| --- | --- |
| `core` (default), `bun-api`, `workers-api`, `library` | None; TypeScript and selected runtime guidance |
| `web`, `desktop` | `vercel-react-best-practices`, `vercel-composition-patterns` |
| `mobile` | `vercel-composition-patterns` |
| `workspace` | `turborepo` |

Use `--skills` for additional skills: `tdd`, `ultracite`, `turborepo`,
`vercel-react-best-practices`, `vercel-composition-patterns`, or `shadcn`.
Comma-separated and repeated `--profile`/`--skills` flags are supported.
An explicit flag replaces that selection; omitted flags retain the last install.
`--skills none` clears extra skills while retaining profile defaults.

The installer copies the TypeScript baseline, React companion, selected stack
sections, and config reference files into `.agents/workflow/`. Skills are copied
in full into `.agents/skills/`. A marked block in root `AGENTS.md` directs agents
to the guides; existing project instructions outside that block are preserved.
Relative links are adjusted for the installed layout. Unselected skill references
become plain text instead of broken links. Skill invocation metadata is preserved.

Add `--configs` to copy `biome.json` and `tsconfig.base.json` into the project root.
Existing root configs are reported as conflicts, including `biome.jsonc`.
The installer does not merge `tsconfig.json`, install tools, run package scripts,
or select runtime globals. Follow [the config guide](ts/configs/README.md) to add
the required dependencies and extend the base appropriately. Without `--configs`,
the bundled config files remain reference templates under `.agents/workflow/`.

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
bun test
```

Tests use temporary projects to cover profiles, complete skill copies, local
links, previews, repeated installs, updates, conflicts, and path boundaries.

## Adopt manually

1. Read the target project's existing instructions and tool configuration.
2. Merge the relevant baseline into its agent instructions. Preserve project-specific
   commands, runtime requirements, and architectural exceptions.
3. For React work, include the companion guide and an explicit instruction to read
   it. Keep its path correct relative to the adopted baseline.
4. Select the relevant [stack profile](ts/stacks.md) for each app/package and merge
   its runtime boundaries and check commands into the project's instructions.
5. Have the agent identify the instructions it loaded and the actual validation
   commands before using the setup for a change.

These files are maintained here. Storing them in this repository does not activate
them in other projects. When using a copy, record its source revision so updates
can be reviewed deliberately.

Select skills by task and copy complete folders with their supporting resources.
Keep runtime requirements, installed versions, and validation commands explicit
in the target project's instructions.
