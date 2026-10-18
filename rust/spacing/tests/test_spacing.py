"""Real Dylint diagnostics, safe fixes, and rustfmt compatibility; no doubles."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


LIBRARY = Path(__file__).resolve().parents[1]
CODES = {"statement_padding", "item_padding", "multiple_empty_lines", "padded_blocks"}


class SpacingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="workflow-spacing-tests-")
        cls.root = Path(cls.temporary.name)
        (cls.root / "src").mkdir()
        (cls.root / "Cargo.toml").write_text(
            '[package]\nname = "spacing_consumer"\nversion = "0.0.0"\nedition = "2024"\n'
        )

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def lint(self, source, fix=False):
        path = self.root / "src/lib.rs"
        path.write_bytes(source.encode())
        command = ["cargo", "dylint", "--path", str(LIBRARY), "--no-deps"]

        if fix:
            command += ["--fix"]

        command += ["--", "--manifest-path", str(self.root / "Cargo.toml"), "--message-format=json"]

        if fix:
            command += ["--allow-no-vcs", "--allow-dirty", "--allow-staged"]

        environment = dict(os.environ)
        environment["CARGO_TARGET_DIR"] = str(LIBRARY / "target/consumers")
        result = subprocess.run(command, cwd=LIBRARY, capture_output=True, text=True, env=environment)
        messages = []

        for line in result.stdout.splitlines():
            if line.startswith("{"):
                event = json.loads(line)

                if event.get("reason") == "compiler-message":
                    messages.append(event["message"])

        errors = [message for message in messages if message["level"] == "error"]
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertEqual(errors, [])
        diagnostics = [message for message in messages if (message.get("code") or {}).get("code") in CODES]

        return diagnostics, path.read_bytes().decode()

    def test_definitions_and_methods_have_padding(self):
        source = """struct Card {
    width: f32,
    height: f32,
}
/// The card's animation.
#[derive(Debug)]
enum State {
    Idle,
    Active,
}
impl Card {
    /// Builds a card.
    fn new() -> Self { Self { width: 1.0, height: 2.0 } }
    /// Returns its width.
    #[inline]
    fn width(&self) -> f32 { self.width }
}
enum Other { Idle }
fn sample() {}
"""
        diagnostics, _ = self.lint(source)
        self.assertIn('item_padding', {message['code']['code'] for message in diagnostics})
        _, fixed = self.lint(source, fix=True)
        self.assertIn('}\n\n/// The card', fixed)
        self.assertIn('}\n\nimpl Card', fixed)
        self.assertIn('}\n\n    /// Returns', fixed)
        self.assertIn('/// Returns its width.\n    #[inline]\n    fn width', fixed)
        self.assertIn('width: f32,\n    height: f32,', fixed)
        self.assertIn('Idle,\n    Active,', fixed)
        self.assertEqual(self.lint(fixed)[0], [])
        self.assertEqual(''.join(source.split()), ''.join(fixed.split()))

    def test_nested_definitions_and_trait_methods(self):
        source = """mod nested {
    struct First;
    struct Second;
    trait Value {
        fn first(&self);
        fn second(&self);
    }
}
fn sample() {
    struct First;
    struct Second;
}
"""
        _, fixed = self.lint(source, fix=True)
        self.assertIn('struct First;\n\n    struct Second;', fixed)
        self.assertIn('fn first(&self);\n\n        fn second', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

    def test_out_of_line_modules_use_the_same_policy(self):
        module = self.root / 'src/nested.rs'
        module.write_text('struct First;\n/// Next type.\nstruct Second;\nimpl Second {\n    fn first() {}\n    fn second() {}\n}\n')

        try:
            diagnostics, _ = self.lint('mod nested;\n')
            self.assertEqual(sum(message['code']['code'] == 'item_padding' for message in diagnostics), 3)
            self.lint('mod nested;\n', fix=True)
            self.assertIn('struct First;\n\n/// Next type.', module.read_text())
            self.assertIn('struct Second;\n\nimpl Second', module.read_text())
            self.assertEqual(self.lint('mod nested;\n')[0], [])
        finally:
            module.unlink()

    def test_multiline_trailing_comments_are_preserved(self):
        source = 'struct First; /* trailing\ncomment */\nstruct Second;\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('/* trailing\ncomment */\n\nstruct Second;', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

    def test_compact_declaration_groups_stay_together(self):
        source = """use std::fmt::Debug;
use std::fmt::Display;

const FIRST: u32 = 1;
const SECOND: u32 = 2;

static THIRD: u32 = 3;
static FOURTH: u32 = 4;

type First = u32;
type Second = u32;
"""
        self.assertEqual(self.lint(source)[0], [])

    def test_item_allow_attributes_are_respected(self):
        source = """struct First;
#[allow(item_padding)]
struct Second;

impl First {
    fn first() {}
    #[allow(item_padding)]
    fn second() {}
}
"""
        self.assertEqual(self.lint(source)[0], [])

    def test_item_fix_handles_inline_scopes_and_crlf(self):
        source = 'struct Café; impl Café { fn first() {} fn second() {} }\r\nenum Other { Idle }\r\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('struct Café;\r\n\r\nimpl Café', fixed)
        self.assertIn('fn first() {}\r\n\r\n    fn second()', fixed)
        self.assertNotIn('\n', fixed.replace('\r\n', ''))
        self.assertEqual(self.lint(fixed)[0], [])
        subprocess.run(['cargo', '+stable', 'fmt', '--manifest-path', str(self.root / 'Cargo.toml')], check=True)
        self.assertEqual(self.lint((self.root / 'src/lib.rs').read_text())[0], [])

    def test_singleline_lets_stay_together(self):
        diagnostics, _ = self.lint('fn sample() {\n    let first = 1;\n    let second = 2;\n\n    println!("{first} {second}");\n}\n')
        self.assertEqual(diagnostics, [])

    def test_required_boundaries(self):
        cases = {
            "let_before_use": 'let first = 1;\nprintln!("{first}");',
            "multiline_let": 'let first = [\n1, 2,\n];\nlet second = 3;',
            "before_if": 'println!("before");\nif true {}',
            "after_if": 'if true {}\nprintln!("after");',
            "else_chain": 'if true {} else if false {} else {}\nprintln!("after");',
            "before_match": 'println!("before");\nmatch 1 { _ => {} }',
            "after_match": 'match 1 { _ => {} }\nprintln!("after");',
            "for": 'for _ in 0..1 {}\nprintln!("after");',
            "while": 'while false {}\nprintln!("after");',
            "loop": 'loop { break; }\nprintln!("after");',
            "return": 'println!("before");\nreturn;',
            "tail": 'println!("before");\n()',
            "let_else": 'let Some(value) = Some(1) else { return; };\nlet next = 2;',
            "attribute": 'println!("before");\n#[allow(unused_variables)]\nlet value = 1;\nprintln!("after");',
        }

        for name, body in cases.items():
            with self.subTest(name=name):
                diagnostics, _ = self.lint('fn sample() {\n' + body + '\n}\n')
                self.assertTrue(any(message["code"]["code"] == "statement_padding" for message in diagnostics), name)

    def test_comments_do_not_count_as_blank_lines(self):
        source = 'fn sample() {\n    let value = 1; // trailing\n    // leading\n    println!("{value}");\n}\n'
        diagnostics, fixed = self.lint(source, fix=True)
        self.assertIn('1; // trailing\n\n    // leading', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

    def test_literals_comments_and_macro_tokens_are_preserved(self):
        source = '''fn sample() {
    let text = r#"hello


world"#;

    /* comment


    remains untouched */
    println!("{text}");
}

macro_rules! authored {
    () => {{
        let a = 1;
        println!("{}", a);
    }};
}
'''
        diagnostics, fixed = self.lint(source, fix=True)
        self.assertEqual(fixed, source)
        self.assertEqual(diagnostics, [])

    def test_padding_and_file_boundaries(self):
        source = '\n\nfn sample() {\n\n    println!("a");\n\n\n    println!("b");\n\n}\n\n'
        diagnostics, _ = self.lint(source)
        self.assertEqual({message["code"]["code"] for message in diagnostics}, {"multiple_empty_lines", "padded_blocks"})
        _, fixed = self.lint(source, fix=True)
        self.assertEqual(fixed, 'fn sample() {\n    println!("a");\n\n    println!("b");\n}\n')
        self.assertEqual(self.lint(fixed)[0], [])

    def test_allow_attribute_is_respected(self):
        source = '#[allow(statement_padding)]\nfn sample() {\n    let value = 1;\n    println!("{value}");\n}\n'
        self.assertEqual(self.lint(source)[0], [])

    def test_match_edges_and_comment_only_blocks(self):
        for source in [
            'fn sample() { match 1 {\n\n _ => (),\n\n} }\n',
            'fn sample() {\n\n // explanation\n\n}\n',
        ]:
            with self.subTest(source=source):
                diagnostics, _ = self.lint(source)
                self.assertIn('padded_blocks', {message['code']['code'] for message in diagnostics})
                _, fixed = self.lint(source, fix=True)
                self.assertEqual(self.lint(fixed)[0], [])

    def test_multiline_comment_cannot_supply_statement_padding(self):
        source = 'fn sample() {\nlet value = 1;\n/* first\n\nsecond */\nprintln!("{value}");\n}\n'
        diagnostics, _ = self.lint(source)
        self.assertIn('statement_padding', {message['code']['code'] for message in diagnostics})

    def test_attributes_remain_attached_to_declarations(self):
        source = 'fn sample() {\nlet first = 1;\n#[allow(unused_variables)]\nlet next = 2;\nprintln!("{first}");\n}\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('1;\n\n#[allow(unused_variables)]\nlet next', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

    def test_fix_and_stable_rustfmt_converge(self):
        source = 'fn sample() {\n    let first = vec![\n        1, 2,\n    ];\n    println!("{first:?}");\n    if first.is_empty() { return; }\n    println!("done");\n}\n'
        _, fixed = self.lint(source, fix=True)
        subprocess.run(['cargo', '+stable', 'fmt', '--manifest-path', str(self.root / 'Cargo.toml')], check=True)
        formatted = (self.root / 'src/lib.rs').read_text()
        self.assertEqual(self.lint(formatted)[0], [])
        self.assertEqual(self.lint(formatted, fix=True)[1], formatted)

    def test_inline_fix_preserves_indentation_and_comments(self):
        source = 'fn sample() {\n    let value = 1; /* keep this */ println!("{value}");\n}\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('1; /* keep this */\n\n    println!', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

        source = 'fn sample() {\n    let value = 1; println!("{value}");\n}\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('1;\n\n    println!', fixed)
        self.assertEqual(self.lint(fixed)[0], [])

    def test_crlf_and_unicode(self):
        source = 'fn sample() {\r\n    let café = 1;\r\n    println!("{café}");\r\n}\r\n'
        _, fixed = self.lint(source, fix=True)
        self.assertIn('1;\r\n\r\n    println!', fixed)
        self.assertNotIn('\n', fixed.replace('\r\n', ''))
        self.assertEqual(self.lint(fixed)[0], [])


if __name__ == '__main__':
    unittest.main()
