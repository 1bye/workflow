# Workflow

Personal TypeScript conventions and reusable instructions for AI coding agents.

| File | Purpose |
| --- | --- |
| [ts/AGENTS.md](ts/AGENTS.md) | General TypeScript coding and verification defaults |
| [ts/react.md](ts/react.md) | React component ownership, UI organization, state, and styling |
| [ts/stacks.md](ts/stacks.md) | Optional web, API, desktop, mobile, library/CLI, and workspace profiles |
| [ts/configs/README.md](ts/configs/README.md) | Shared configs and adoption commands |
| [ts/skills/](ts/skills/) | Six curated skills with supporting references and task-specific guidance |

## Adopt in a project

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
