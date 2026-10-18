# Rust spacing

`workflow_spacing` is a reusable Dylint library. It implements the spacing policy
in [`ts/configs/oxlint.json`](../../ts/configs/oxlint.json) for Rust statements.
It is development tooling, not a dependency of published application libraries.

## Rules

| Lint | Policy |
| --- | --- |
| `statement_padding` | Require a blank line after `let`, except between consecutive single-line declarations. Require one before returns and around standalone control flow. |
| `multiple_empty_lines` | At most one consecutive empty line; none at the beginning or end of a file. |
| `padded_blocks` | No empty line immediately inside executable blocks or `match` bodies. |

Rust `match` corresponds to TS `switch`. `if`, `for`, `while`, `loop`, and `try`
blocks follow the control-flow rule. A `let … else` is treated as a guard, and a
block's final expression follows the return rule. Rust's `?` remains part of its
expression; it does not introduce a separate statement like TS `throw`.

Comments do not substitute for blank lines. Leading attributes stay attached to
their statement. Literal contents, block-comment contents, and macro expansion
output are not reformatted. Statement padding does not inspect macro token trees.
The empty-line check covers lexer whitespace, including whitespace inside macro
invocations. Functions and closures with a single expression stay compact.

The lint emits machine-applicable suggestions that change whitespace only. CRLF
files retain their line endings. Stable rustfmt remains the formatter; running
rustfmt after applying these fixes does not remove the required spacing.

## Toolchain

Use Dylint **6.2.0** with **nightly-2026-08-20**, the compiler pinned by this
library's `rust-toolchain.toml`. Its Rust compiler API is tested on macOS and
Linux in CI. Applications can continue building and testing with stable Rust.
Upgrade the lint toolchain and Dylint together, then rerun the regression suite.

```sh
rustup toolchain install nightly-2026-08-20 --profile minimal \
  --component rustc-dev,llvm-tools-preview,rust-src,rustfmt
cargo +nightly-2026-08-20 install cargo-dylint dylint-link --version 6.2.0 --locked
```

## Adoption

In a consuming Cargo manifest, add a `workspace.metadata.dylint.libraries` entry
with `git = "https://github.com/1bye/workflow"`, `pattern = "rust/spacing"`, and
`rev` set to the full commit you have verified. A package without an explicit
workspace can use this table too. Pin a commit rather than following `main`.

```sh
cargo dylint --all --no-deps -- --all-targets --message-format=json
cargo dylint --all --no-deps --fix -- --all-targets --allow-dirty
```

Add the package's supported features to these commands. The first command checks;
the second applies suggestions. Like Clippy, these lints default to warnings.
CI must reject their diagnostics, rather than relying on Cargo's exit code alone.
The gpui-motion integration does this without passing unknown lint names to
dependency builds, and uses the same pinned library for README snippets.

Cargo/Dylint compiles the selected targets. Standalone Rust examples in Markdown
must be extracted into a consumer crate; Dylint does not read Markdown itself.
The [`gpui-motion` checker](https://github.com/1bye/gpui-motion/tree/main/scripts)
compiles examples in separate scopes, reports README line numbers, and applies
only the lint's whitespace suggestions. It rejects ignored/compile-fail examples
so that adding an unchecked example cannot silently weaken the check.

## Tests

```sh
cd rust/spacing
cargo +stable fmt --all --check
python3 tests/test_spacing.py -v
```

The suite runs the real Dylint compiler driver against temporary consumer crates.
It covers rule boundaries, declaration grouping, comments, attributes, raw
strings, macro bodies, Unicode/CRLF, safe fixes, and convergence with stable
rustfmt. Missing Dylint or compiler components fail the suite. No fixtures are
silently skipped.
