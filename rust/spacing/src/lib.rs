//! Conditional statement padding matching workflow's Oxlint spacing rules.
//!
//! Runs before expansion: macro token trees and literal contents are left alone.
//! Tail expressions follow the same padding rule as explicit returns.

#![feature(rustc_private)]

extern crate rustc_ast;
extern crate rustc_errors;
extern crate rustc_lexer;
extern crate rustc_lint;
extern crate rustc_session;
extern crate rustc_span;

use rustc_ast::{Block, Crate, Expr, ExprKind, LocalKind, Stmt, StmtKind};
use rustc_errors::{Applicability, Diag, DiagDecorator};
use rustc_lexer::{FrontmatterAllowed, TokenKind, tokenize};
use rustc_lint::{EarlyContext, EarlyLintPass, LintContext};
use rustc_session::{declare_lint, impl_lint_pass};
use rustc_span::{BytePos, Span};

dylint_linting::dylint_library!();

declare_lint! {
    /// Require padding after declarations and around standalone control flow.
    pub STATEMENT_PADDING,
    Warn,
    "missing blank line between statement groups"
}

declare_lint! {
    /// Allow at most one empty line and none at file boundaries.
    pub MULTIPLE_EMPTY_LINES,
    Warn,
    "excess empty lines"
}

declare_lint! {
    /// Do not pad the inside edges of executable blocks.
    pub PADDED_BLOCKS,
    Warn,
    "empty line just inside a block"
}

impl_lint_pass!(Spacing => [STATEMENT_PADDING, MULTIPLE_EMPTY_LINES, PADDED_BLOCKS]);

#[derive(Default)]
struct Spacing;

/// Registers the shared spacing policy with Dylint's compiler driver.
#[unsafe(no_mangle)]
pub fn register_lints(_: &rustc_session::Session, store: &mut rustc_lint::LintStore) {
    store.register_lints(&[STATEMENT_PADDING, MULTIPLE_EMPTY_LINES, PADDED_BLOCKS]);
    store.register_pre_expansion_lint_pass(Box::new(|| Box::new(Spacing)));
}

impl EarlyLintPass for Spacing {
    fn check_expr(&mut self, cx: &EarlyContext<'_>, expression: &Expr) {
        if expression.span.from_expansion() {
            return;
        }

        if let ExprKind::Match(scrutinee, ..) = &expression.kind {
            let suffix = expression.span.with_lo(scrutinee.span.hi());

            if let Ok(source) = cx.sess().source_map().span_to_snippet(suffix) {
                let mut offset = 0;

                for token in tokenize(&source, FrontmatterAllowed::No) {
                    if token.kind == TokenKind::OpenBrace {
                        check_edges(cx, suffix.with_lo(suffix.lo() + BytePos(offset)));
                        break;
                    }

                    offset += token.len;
                }
            }
        }
    }

    fn check_crate(&mut self, cx: &EarlyContext<'_>, _: &Crate) {
        for file in cx.sess().source_map().files().iter() {
            let Some(source) = &file.src else {
                continue;
            };

            let mut offset = 0;

            for token in tokenize(source, FrontmatterAllowed::Yes) {
                let end = offset + token.len as usize;

                if token.kind == TokenKind::Whitespace {
                    let gap = &source[offset..end];

                    let limit = if offset == 0 {
                        0
                    } else if end == source.len() {
                        1
                    } else {
                        2
                    };

                    if gap.bytes().filter(|byte| *byte == b'\n').count() > limit {
                        let span = Span::with_root_ctxt(
                            file.start_pos + BytePos(offset as u32),
                            file.start_pos + BytePos(end as u32),
                        );

                        suggest(
                            cx,
                            MULTIPLE_EMPTY_LINES,
                            span,
                            "remove excess empty lines",
                            trim_gap(gap, limit),
                        );
                    }
                }

                offset = end;
            }
        }
    }

    fn check_block(&mut self, cx: &EarlyContext<'_>, block: &Block) {
        if block.span.from_expansion() {
            return;
        }

        let map = cx.sess().source_map();

        check_edges(cx, block.span);

        for (index, pair) in block.stmts.windows(2).enumerate() {
            let previous = &pair[0];
            let next = &pair[1];

            if previous.span.from_expansion() || next.span.from_expansion() {
                continue;
            }

            let previous_kind = classify(cx, previous, false);
            let next_kind = classify(cx, next, index + 2 == block.stmts.len());

            let consecutive_short_lets =
                previous_kind == Kind::ShortLet && next_kind == Kind::ShortLet;

            let required = !consecutive_short_lets
                && (matches!(
                    previous_kind,
                    Kind::ShortLet | Kind::LongLet | Kind::Control
                ) || matches!(next_kind, Kind::Control | Kind::Return));

            if !required || previous.span.hi() > next.span.lo() {
                continue;
            }

            let gap_span = previous
                .span
                .with_lo(previous.span.hi())
                .with_hi(statement_span(next).lo());

            let Ok(gap) = map.span_to_snippet(gap_span) else {
                continue;
            };

            if !has_blank_line(&gap) {
                let replacement = if let Some(position) = gap.find('\n') {
                    format!("{}\n{}", &gap[..=position], &gap[position + 1..])
                } else {
                    let before = map.span_to_prev_source(previous.span).unwrap_or_default();
                    let line_before = before.rsplit('\n').next().unwrap_or("");

                    let indentation = if line_before.trim().is_empty() {
                        line_before.to_owned()
                    } else {
                        format!(
                            "{}    ",
                            map.indentation_before(block.span).unwrap_or_default()
                        )
                    };

                    let comment = if gap.trim().is_empty() {
                        ""
                    } else {
                        gap.trim_end()
                    };

                    format!("{comment}\n\n{indentation}")
                };

                suggest(
                    cx,
                    STATEMENT_PADDING,
                    gap_span,
                    "insert a blank line between statements",
                    replacement,
                );
            }
        }
    }
}

fn check_edges(cx: &EarlyContext<'_>, span: Span) {
    let Ok(source) = cx.sess().source_map().span_to_snippet(span) else {
        return;
    };

    if !source.starts_with('{') || !source.ends_with('}') {
        return;
    }

    let inner = &source[1..source.len() - 1];
    let prefix = inner.len() - inner.trim_start_matches(char::is_whitespace).len();
    let suffix = inner.len() - inner.trim_end_matches(char::is_whitespace).len();

    check_block_edge(cx, span.lo() + BytePos(1), &inner[..prefix]);

    if suffix > 0 && suffix != inner.len() {
        check_block_edge(
            cx,
            span.hi() - BytePos(1 + suffix as u32),
            &inner[inner.len() - suffix..],
        );
    }
}

#[derive(Clone, Copy, PartialEq)]
enum Kind {
    ShortLet,
    LongLet,
    Control,
    Return,
    Other,
}

fn classify(cx: &EarlyContext<'_>, statement: &Stmt, tail: bool) -> Kind {
    match &statement.kind {
        StmtKind::Let(local) => {
            if matches!(local.kind, LocalKind::InitElse(..)) {
                return Kind::Control;
            }

            let Ok(source) = cx
                .sess()
                .source_map()
                .span_to_snippet(statement_span(statement))
            else {
                return Kind::Other;
            };

            if source.contains('\n') {
                Kind::LongLet
            } else {
                Kind::ShortLet
            }
        }
        StmtKind::Expr(expression) | StmtKind::Semi(expression) => match &expression.kind {
            ExprKind::If(..)
            | ExprKind::While(..)
            | ExprKind::ForLoop { .. }
            | ExprKind::Loop(..)
            | ExprKind::Match(..)
            | ExprKind::TryBlock(..) => Kind::Control,
            ExprKind::Ret(..) => Kind::Return,
            _ if tail && matches!(statement.kind, StmtKind::Expr(_)) => Kind::Return,
            _ => Kind::Other,
        },
        _ => Kind::Other,
    }
}

fn check_block_edge(cx: &EarlyContext<'_>, start: BytePos, gap: &str) {
    if gap.bytes().filter(|byte| *byte == b'\n').count() > 1 {
        let span = Span::with_root_ctxt(start, start + BytePos(gap.len() as u32));

        suggest(
            cx,
            PADDED_BLOCKS,
            span,
            "remove padding inside the block",
            trim_gap(gap, 1),
        );
    }
}

fn has_blank_line(gap: &str) -> bool {
    let mut offset = 0;

    tokenize(gap, FrontmatterAllowed::No).any(|token| {
        let end = offset + token.len as usize;

        let blank = token.kind == TokenKind::Whitespace
            && gap[offset..end]
                .bytes()
                .filter(|byte| *byte == b'\n')
                .count()
                >= 2;

        offset = end;

        blank
    })
}

fn statement_span(statement: &Stmt) -> Span {
    let attrs = match &statement.kind {
        StmtKind::Let(local) => &local.attrs,
        StmtKind::Expr(expression) | StmtKind::Semi(expression) => &expression.attrs,
        StmtKind::MacCall(call) => &call.attrs,
        StmtKind::Item(item) => &item.attrs,
        StmtKind::Empty => return statement.span,
    };

    attrs.first().map_or(statement.span, |attr| {
        statement.span.with_lo(attr.span.lo())
    })
}

fn trim_gap(gap: &str, newlines: usize) -> String {
    let newline = if gap.contains("\r\n") { "\r\n" } else { "\n" };
    let indent = gap.rsplit('\n').next().unwrap_or("");

    format!("{}{indent}", newline.repeat(newlines))
}

fn suggest(
    cx: &EarlyContext<'_>,
    lint: &'static rustc_session::lint::Lint,
    span: Span,
    message: &'static str,
    replacement: String,
) {
    // rustc normalizes CRLF before lexing; suggestions must restore the file's line endings.
    let file = cx.sess().source_map().lookup_source_file(span.lo());

    let replacement = if file
        .normalized_pos
        .iter()
        .any(|position| position.pos.0 > 0)
    {
        replacement.replace("\r\n", "\n").replace('\n', "\r\n")
    } else {
        replacement
    };

    cx.opt_span_lint(
        lint,
        Some(span),
        DiagDecorator(|diagnostic: &mut Diag<'_, ()>| {
            diagnostic.primary_message(message);
            diagnostic.span_suggestion(
                span,
                "use the shared spacing convention",
                replacement,
                Applicability::MachineApplicable,
            );
        }),
    );
}
