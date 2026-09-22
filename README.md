# Workflow

Personal TypeScript conventions and reusable instructions for AI coding agents.

| File | Purpose |
| --- | --- |
| [ts/AGENTS.md](ts/AGENTS.md) | General TypeScript coding and verification defaults |
| [ts/react.md](ts/react.md) | React component ownership, UI organization, state, and styling |
| [ts/configs/README.md](ts/configs/README.md) | Shared configs, adoption commands, and validation results |
| [PROJECT_AUDIT.md](PROJECT_AUDIT.md) | Source-project comparison and later migration recommendations |
| [TODO.md](TODO.md) | Original preferences and outstanding tooling choices |

## Adopt in a project

1. Read the target project's existing instructions and tool configuration.
2. Merge the relevant baseline into its agent instructions. Preserve project-specific
   commands, runtime requirements, and architectural exceptions.
3. For React work, include the companion guide and an explicit instruction to read
   it. Keep its path correct relative to the adopted baseline.
4. Have the agent identify the instructions it loaded and the actual validation
   commands before using the setup for a change.

These files are maintained here. Storing them in this repository does not activate
them in other projects. When using a copy, record its source revision so updates
can be reviewed deliberately.

## Decisions in these migrations

- Stateless OOP follows `TODO.md`, replacing the functions-first default in the
  audited generic rules. Classes group cohesive domain behavior; React keeps its
  function-based APIs. Shared services keep per-call data out of instance fields.
- `ui/`, `fixture/`, and `feature/` express different ownership boundaries. Existing
  project layouts can keep their own names.
- TSX files may contain one large cohesive component or a few small related ones.
- Tests target behavior, edge cases, and regressions. Verification should use the
  existing runner and report actual results.
- Biome uses Ultracite core with explicit allowances for static-only classes and
  constructor parameter properties. The TypeScript base shares strict checks;
  each consumer chooses its platform globals, modules, and output settings.

The configs passed formatting/linting, type checking, a declaration build, and all
160 existing tests in an isolated copy of `1git/packages/git`. Full commands and
tested versions are in the [config guide](ts/configs/README.md).

## Next migrations

Steps 1 and 2 are complete. Selected skill directories and stack profiles are next;
an installer remains optional. The exact shared `cn` package and `shadcn/lint` integration
from `TODO.md` still need to be selected and verified before becoming executable
configuration. The React guide uses the existing project's class-merging entry
point during ordinary UI work.

The baseline is adapted from the ownership, typing, and verification guidance in
`altavinci/RULES-GENERIC.md` and `daydb`'s regression-testing skill. The React guide
is adapted from section 11 of `1git/RULES-GENERIC.md`. See the audit for local
source links and the rationale for each selection.
