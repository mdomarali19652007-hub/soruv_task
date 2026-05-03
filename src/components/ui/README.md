# UI primitives (redesign — PR 1)

These components are the foundation of the user-friendly UI redesign described in [`plans/user-friendly-ui-redesign-for-production-launch.md`](../../../plans/user-friendly-ui-redesign-for-production-launch.md). They are shipped first, ahead of any screen changes, so subsequent PRs can swap legacy markup for these primitives one feature at a time without churning the underlying styles.

## What's here

| Component | Purpose |
|---|---|
| `Button` | Primary / secondary / ghost / danger button with `loading` and icon slots |
| `Card` | Neutral white surface with the redesign's single elevation |
| `ListRow` | Tappable row used inside cards (44px tap target, optional chevron) |
| `Stat` | Labelled numeric display for balances and counts |
| `Chip` | Pill tag — static or selectable (segmented controls) |
| `SectionHeader` | Sentence-case section title with optional action |
| `EmptyState` | Placeholder for empty lists / no-results panels |
| `Skeleton` / `SkeletonText` | Loading placeholders (uses `animate-pulse`, no infinite shimmer) |
| `BalancePill` | Compact currency display for the top bar |

A `cn()` helper wraps `clsx` + `tailwind-merge` so callers can override classes without producing duplicate Tailwind utilities.

## Design tokens

Tokens live as CSS custom properties in [`src/index.css`](../../index.css) under the `:root` block at the top of the file. They are referenced indirectly through the Tailwind utility classes used in each primitive (`bg-blue-600`, `text-slate-900`, `rounded-2xl` …) so the components remain compatible with the existing Tailwind 4 setup.

If you need to reference a token directly (for example inside a custom component), use `var(--ui-primary)` etc.

## What is _not_ here yet

- `AppShell`, `TopBar`, `BottomNav` — these arrive in PR 2.
- Removal of the legacy `.glass-card` / `.neon-*` / `.glitch-text` utilities — PR 8.

Existing screens are unchanged by this PR; both visual systems coexist temporarily.

## Conventions for new primitives

1. Forward refs for anything a parent might want to focus / measure.
2. Default to the largest reasonable tap target (`min-h-[44px]`).
3. Never animate forever. Use `transition-colors` for interactions and `animate-pulse` for loading; nothing else.
4. Accept `className` and merge with `cn()`.
5. Sentence case in labels. No `text-[8px]` `tracking-widest`.
