/**
 * Covers: installed Rust formatting, lint activation/inheritance, tests, and docs.
 * Real: installer, Cargo, rustfmt, Clippy, and dependency-free temporary projects.
 * Doubles: none.
 * Requires: Bun and a stable Rust toolchain with rustfmt/Clippy on PATH; no network.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorkflowInstaller } from "./install";

const root = mkdtempSync(join(tmpdir(), "workflow-rust-configs-"));

const source = `//! Small consumer contract used to verify workflow tooling.

/// Increment with saturation at the largest representable value.
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(workflow_probe::increment(1), 2);
/// \`\`\`
pub fn increment(value: u32) -> u32 {
    value.saturating_add(1)
}

#[cfg(test)]
mod tests {
    #[test]
    fn saturates() {
        assert_eq!(super::increment(u32::MAX), u32::MAX);
    }
}
`;

function cargo(cwd: string, args: string[], expectedCode = 0): string {
  const result = Bun.spawnSync(["cargo", ...args], {
    cwd,
    env: {
      ...process.env,
      CARGO_NET_OFFLINE: "true",
      CARGO_TARGET_DIR: join(root, "target"),
      RUSTDOCFLAGS: "-D warnings",
      CARGO_TERM_COLOR: "never",
    },
  });

  const output = result.stdout.toString() + result.stderr.toString();

  assert.equal(result.exitCode, expectedCode, `cargo ${args.join(" ")}\n${output}`);

  return output;
}

try {
  for (const workspace of [false, true]) {
    const target = join(root, workspace ? "workspace" : "package");

    mkdirSync(target);
    WorkflowInstaller.apply(
      WorkflowInstaller.plan({
        target,
        profiles: [workspace ? "rust-workspace" : "rust-library"],
        configs: true,
      }),
    );
    const lints = readFileSync(
      join(target, ".agents/workflow/rust/configs/cargo-lints.toml"),
      "utf8",
    );

    const member = workspace ? join(target, "crates/probe") : target;

    mkdirSync(join(member, "src"), { recursive: true });
    mkdirSync(join(member, "tests"));
    writeFileSync(
      join(member, "Cargo.toml"),
      '[package]\nname = "workflow_probe"\nversion = "0.1.0"\nedition = "2021"\n\n' +
        (workspace ? "[lints]\nworkspace = true\n" : lints),
    );

    if (workspace) {
      writeFileSync(
        join(target, "Cargo.toml"),
        '[workspace]\nmembers = ["crates/probe"]\nresolver = "2"\n\n' +
          lints.replaceAll("[lints.", "[workspace.lints."),
      );
    }

    writeFileSync(join(member, "src/lib.rs"), source);
    writeFileSync(
      join(member, "tests/consumer.rs"),
      `//! Public consumer contract.

#[test]
fn imports_and_calls_public_api() {
    assert_eq!(workflow_probe::increment(4), 5);
}
`,
    );

    cargo(target, ["fmt", "--all", "--check"]);
    const lint = cargo(target, ["clippy", "--workspace", "--all-targets", "--", "-D", "warnings"]);

    assert(!lint.includes("unused manifest key"), lint);
    const tests = cargo(target, ["test", "--workspace"]);

    assert(tests.includes("imports_and_calls_public_api"), tests);
    assert(tests.includes("Doc-tests workflow_probe"), tests);
    assert(tests.includes("src/lib.rs - increment"), tests);
    cargo(target, ["doc", "--workspace", "--no-deps"]);

    // Prove that both the package and inherited workspace policy are active.
    writeFileSync(
      join(member, "src/lib.rs"),
      source.replace("value.saturating_add(1)", "dbg!(value.saturating_add(1))"),
    );
    const rejected = cargo(
      target,
      ["clippy", "--workspace", "--all-targets", "--", "-D", "warnings"],
      101,
    );

    assert(rejected.includes("clippy::dbg_macro"), rejected);
    writeFileSync(join(member, "src/lib.rs"), source + "\npub fn undocumented() {}\n");
    const undocumented = cargo(
      target,
      ["clippy", "--workspace", "--all-targets", "--", "-D", "warnings"],
      101,
    );

    assert(undocumented.includes("missing_docs"), undocumented);
    writeFileSync(
      join(member, "src/lib.rs"),
      source.replace("    value.saturating_add(1)", "value.saturating_add(1)"),
    );
    cargo(target, ["fmt", "--all", "--check"], 1);
    cargo(target, ["fmt", "--all"]);
    assert.equal(readFileSync(join(member, "src/lib.rs"), "utf8"), source);
    cargo(target, ["fmt", "--all", "--check"]);
    console.log(
      `Rust ${workspace ? "workspace" : "package"}: formatting, lint policy, tests, and docs passed.`,
    );
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
