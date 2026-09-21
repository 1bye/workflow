# TypeScript defaults

Use these defaults for TypeScript work. Follow the task's explicit requirements
and the target project's more specific instructions. Preserve established
architecture during focused changes; do not refactor unrelated code to match
this guide. For React or TSX work, also read `react.md` beside this file.

## Working method

- Inspect the owning module, callers, types, tests, and comparable code first.
- Fix the underlying cause in its owner and check affected callers.
- Reuse existing code, platform features, and installed dependencies before
  introducing a new abstraction or package.
- Complete the requested behavior. Leave placeholders only when scaffolding is
  explicitly requested.

## Stateless OOP

- Prefer cohesive classes and methods for domain behavior over spreading related
  operations across standalone functions. Extend an existing owner where it fits.
- Keep per-call data in method arguments and local variables. Shared service
  instances must not retain request, user, or operation state between calls.
- Pass stable dependencies explicitly, usually through readonly constructor
  fields. Construct them at the application or feature boundary.
- Use static methods for cohesive pure operations that need no instance
  dependencies; use instances when dependencies or a real lifecycle require them.
- Keep callbacks, React components/hooks, and framework-required entry points as
  functions. Small local helpers do not need their own classes.
- Give necessary mutable state an explicit owner and lifetime. Stateless OOP
  does not mean disguising state in globals or repeatedly rebuilding resources.
- Prefer composition. Add interfaces, factories, registries, or inheritance only
  for a real boundary or requirement; do not create a parallel hierarchy by habit.

## Ownership and types

- Place behavior, types, schemas, and constants with the concept that owns them.
  Share code when real consumers need it; avoid generic dumping grounds.
- Use precise domain names and explicit units such as `timeoutMs`. Extract files
  by responsibility, reuse, or lifecycle rather than line count.
- Preserve strict typing. Prefer `unknown` to `any`, then narrow. Do not use
  assertions or non-null assertions to conceal an invalid model or missing check.
- Validate untrusted data at its boundary. Derive types from runtime schemas when
  supported instead of maintaining the same shape twice.
- Give public contracts explicit useful types; allow clear local inference. Use
  discriminated unions for meaningful variants and handle them exhaustively.
- Do not mutate caller-owned input unless mutation is the documented contract.
  Preserve the project's public import boundaries and generated-code workflow.

## Errors and performance

- Throw `Error` objects or established typed errors with useful context. Preserve
  causes when translating errors and keep secrets out of messages and logs.
- Catch to recover, translate, add context, or clean up. Do not swallow failures
  or log and rethrow the same failure at every layer. Await asynchronous cleanup.
- Keep asynchronous work owned: await or return promises, or use an explicit
  background-task mechanism with error handling and a defined lifetime.
- Choose suitable algorithms and avoid obvious repeated work. Add caches,
  memoization, or pooling for a concrete cost, with clear lifetime/invalidation.
- Comments explain contracts, invariants, and non-obvious decisions.

## Tooling and verification

- Prefer Bun for new TypeScript projects. In existing projects, use their package
  manager, runtime, lockfile, and scripts; do not silently migrate them.
- Use spaces, with two-space indentation for new projects. Follow an existing
  formatter until a formatting migration is explicitly part of the task.
- Use the installed library version's documentation and types. Keep Effect,
  frameworks, databases, and monorepo tooling project choices, not requirements.
- Test nontrivial behavior, meaningful edge/failure cases, and fixed regressions
  using the existing runner. For a practical regression test, demonstrate the
  intended failure before the fix and a pass afterward.
- Assert observable behavior rather than private call sequences. Mock real
  external boundaries and keep one-off setup local. Do not weaken tests to pass.
- When a meaningful automated check is impractical, explain why and perform the
  closest useful manual or scripted verification. Do not build a test framework
  for a trivial edit or leave substantial behavior unverified without saying so.
- Run relevant tests, type checks, and lint/build commands that actually exist.
  Distinguish read-only checks from fixes. Report results and any checks not run;
  never claim completion based only on having written the change.
