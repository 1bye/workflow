//! Statement and definition padding extending workflow's Oxlint spacing rules.
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

use std::collections::HashMap;

use rustc_ast::{
    AssocItem, AssocItemKind, Block, Crate, Expr, ExprKind, Inline, Item, ItemKind, LocalKind,
    ModKind, Stmt, StmtKind,
};

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
    /// Separate definitions and methods while preserving compact declaration groups.
    pub ITEM_PADDING,
    Warn,
    "missing blank line between definitions"
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

impl_lint_pass!(Spacing => [STATEMENT_PADDING, ITEM_PADDING, MULTIPLE_EMPTY_LINES, PADDED_BLOCKS]);

#[derive(Default)]
struct Spacing {
    pending_items: HashMap<BytePos, (Span, Span, Option<Span>)>,
    previous_root_item: Option<ItemInfo>,
    item_depth: usize,
}

struct ItemInfo {
    span: Span,
    with_attributes: Span,
    group: Option<ItemGroup>,
    single_line: bool,
}

impl Spacing {
    fn remember_items<K>(
        &mut self,
        cx: &EarlyContext<'_>,
        items: &[Box<Item<K>>],
        parent: Option<Span>,
        group: fn(&K) -> Option<ItemGroup>,
    ) {
        for pair in items.windows(2) {
            self.remember_pair(cx, &pair[0], &pair[1], parent, group);
        }
    }

    fn remember_pair<K>(
        &mut self,
        cx: &EarlyContext<'_>,
        previous: &Item<K>,
        next: &Item<K>,
        parent: Option<Span>,
        group: fn(&K) -> Option<ItemGroup>,
    ) {
        self.remember_boundary(
            item_info(cx, previous, group),
            item_info(cx, next, group),
            parent,
        );
    }

    fn remember_boundary(&mut self, previous: ItemInfo, next: ItemInfo, parent: Option<Span>) {
        let compact = previous.group.is_some()
            && previous.group == next.group
            && previous.single_line
            && next.single_line;

        if !compact {
            // Emit in the next item's callback so its allow/expect attributes apply.
            self.pending_items.insert(
                next.span.lo(),
                (previous.span, next.with_attributes, parent),
            );
        }
    }

    fn check_item_padding<K>(&mut self, cx: &EarlyContext<'_>, item: &Item<K>) {
        if let Some((previous, next, parent)) = self.pending_items.remove(&item.span.lo()) {
            check_padding(
                cx,
                previous,
                next,
                parent,
                ITEM_PADDING,
                "insert a blank line between definitions",
            );
        }
    }
}

/// Registers the shared spacing policy with Dylint's compiler driver.
#[unsafe(no_mangle)]
pub fn register_lints(_: &rustc_session::Session, store: &mut rustc_lint::LintStore) {
    store.register_lints(&[
        STATEMENT_PADDING,
        ITEM_PADDING,
        MULTIPLE_EMPTY_LINES,
        PADDED_BLOCKS,
    ]);
    store.register_pre_expansion_lint_pass(Box::new(|| Box::new(Spacing::default())));
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

    fn check_item(&mut self, cx: &EarlyContext<'_>, item: &Item) {
        // Loaded file modules start a fresh pre-expansion pass without check_crate.
        if self.item_depth == 0 {
            if let Some(previous) = self.previous_root_item.take() {
                self.remember_boundary(previous, item_info(cx, item, item_group), None);
            }

            self.previous_root_item = Some(item_info(cx, item, item_group));
        }

        self.item_depth += 1;
        self.check_item_padding(cx, item);

        match &item.kind {
            ItemKind::Mod(_, _, ModKind::Loaded(items, inline, _)) => {
                let parent = matches!(inline, Inline::Yes).then_some(item.span);

                self.remember_items(cx, items, parent, item_group);
            }
            ItemKind::Impl(implementation) => {
                self.remember_items(cx, &implementation.items, Some(item.span), assoc_group);
            }
            ItemKind::Trait(definition) => {
                self.remember_items(cx, &definition.items, Some(item.span), assoc_group);
            }
            _ => {}
        }
    }

    fn check_item_post(&mut self, _: &EarlyContext<'_>, _: &Item) {
        self.item_depth -= 1;
    }

    fn check_impl_item(&mut self, cx: &EarlyContext<'_>, item: &AssocItem) {
        self.check_item_padding(cx, item);
    }

    fn check_trait_item(&mut self, cx: &EarlyContext<'_>, item: &AssocItem) {
        self.check_item_padding(cx, item);
    }

    fn check_block(&mut self, cx: &EarlyContext<'_>, block: &Block) {
        if block.span.from_expansion() {
            return;
        }

        check_edges(cx, block.span);

        for (index, pair) in block.stmts.windows(2).enumerate() {
            let previous = &pair[0];
            let next = &pair[1];

            if previous.span.from_expansion() || next.span.from_expansion() {
                continue;
            }

            if let (StmtKind::Item(previous), StmtKind::Item(next)) = (&previous.kind, &next.kind) {
                self.remember_pair(cx, previous, next, Some(block.span), item_group);
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

            check_padding(
                cx,
                previous.span,
                statement_span(next),
                Some(block.span),
                STATEMENT_PADDING,
                "insert a blank line between statements",
            );
        }
    }
}

#[derive(Clone, Copy, PartialEq)]
enum ItemGroup {
    Import,
    Module,
    Constant,
    Static,
    Type,
}

fn item_group(kind: &ItemKind) -> Option<ItemGroup> {
    match kind {
        ItemKind::Use(_) | ItemKind::ExternCrate(..) => Some(ItemGroup::Import),
        ItemKind::Mod(_, _, ModKind::Unloaded | ModKind::Loaded(_, Inline::No { .. }, _)) => {
            Some(ItemGroup::Module)
        }
        ItemKind::Const(_) => Some(ItemGroup::Constant),
        ItemKind::Static(_) => Some(ItemGroup::Static),
        ItemKind::TyAlias(_) => Some(ItemGroup::Type),
        _ => None,
    }
}

fn assoc_group(kind: &AssocItemKind) -> Option<ItemGroup> {
    match kind {
        AssocItemKind::Const(_) => Some(ItemGroup::Constant),
        AssocItemKind::Type(_) => Some(ItemGroup::Type),
        _ => None,
    }
}

fn item_span<K>(item: &Item<K>) -> Span {
    item.attrs.iter().fold(item.span, |span, attr| {
        span.with_lo(span.lo().min(attr.span.lo()))
    })
}

fn item_info<K>(
    cx: &EarlyContext<'_>,
    item: &Item<K>,
    group: fn(&K) -> Option<ItemGroup>,
) -> ItemInfo {
    ItemInfo {
        span: item.span,
        with_attributes: item_span(item),
        group: group(&item.kind),
        single_line: cx
            .sess()
            .source_map()
            .span_to_snippet(item.span)
            .is_ok_and(|source| !source.contains('\n')),
    }
}

fn check_padding(
    cx: &EarlyContext<'_>,
    previous: Span,
    next: Span,
    parent: Option<Span>,
    lint: &'static rustc_session::lint::Lint,
    message: &'static str,
) {
    if previous.from_expansion() || next.from_expansion() || previous.hi() > next.lo() {
        return;
    }

    let map = cx.sess().source_map();
    let gap_span = previous.with_lo(previous.hi()).with_hi(next.lo());

    let Ok(gap) = map.span_to_snippet(gap_span) else {
        return;
    };

    if has_blank_line(&gap) {
        return;
    }

    let mut offset = 0;

    let newline = tokenize(&gap, FrontmatterAllowed::No).find_map(|token| {
        let end = offset + token.len as usize;

        let position = if token.kind == TokenKind::Whitespace {
            gap[offset..end]
                .find('\n')
                .map(|position| offset + position)
        } else {
            None
        };

        offset = end;

        position
    });

    let replacement = if let Some(position) = newline {
        format!("{}\n{}", &gap[..=position], &gap[position + 1..])
    } else {
        let before = map.span_to_prev_source(previous).unwrap_or_default();
        let line_before = before.rsplit('\n').next().unwrap_or("");

        let indentation = if line_before.trim().is_empty() {
            line_before.to_owned()
        } else if let Some(parent) = parent {
            format!("{}    ", map.indentation_before(parent).unwrap_or_default())
        } else {
            String::new()
        };

        let comment = if gap.trim().is_empty() {
            ""
        } else {
            gap.trim_end()
        };

        format!("{comment}\n\n{indentation}")
    };

    suggest(cx, lint, gap_span, message, replacement);
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
