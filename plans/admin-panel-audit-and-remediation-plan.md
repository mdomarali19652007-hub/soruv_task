# Admin Panel Audit and Remediation Plan

## 0. Scroll-to-bottom bug (already fixed)

Already shipped on `master` as commit `aa68389`.

The `AdminView` component had an internal `useEffect` that called
`scrollIntoView({ behavior: 'smooth', block: 'start' })` on the active
tab anchor whenever `activeAdminTab` changed. That effect fired on the
first mount too, which raced the parent App's `window.scrollTo(0, 0)`
on view changes. The smooth scroll won and parked you at the tabs
section near the bottom of the page. Fixed with a `didMountAdminTabRef`
that skips the first run, so the page lands at the top on entry and
only smooth-scrolls when you actively switch tabs.

---

## 1. Top-level structural problems

These affect everything below, so they go first in the plan.

### 1a. `AdminView` is redefined every parent render
`src/App.tsx:2005` declares
```tsx
const AdminView = () => { ...50+ useState... return <div /> }
```
inside the App function body and renders `<AdminView key="admin" />`.
Every time the parent App re-renders (which happens on every Supabase
realtime update for users / submissions / withdrawals / etc, and
basically every keystroke in any other input on the page) React sees a
**new function reference** and treats it as a different component
type. The whole admin tree unmounts and remounts, throwing away every
local input value, the active tab, the typed Global Notice, the
balance amount, etc.

This is why so many admin forms feel "laggy" or "reset themselves"
between background refreshes. **Fix this first** or every other fix
below will keep regressing.

Fix:
- Move `AdminView` out of the App body into a real component module:
  `src/features/admin/AdminView.tsx`. Pass everything it needs as
  props (settings, user lists, action handlers).
- As an interim fix you could memoize it with `useCallback`/`useMemo`
  + `useRef`, but extraction to its own file is cleaner and matches
  the pattern already used for `DashboardView`, `ReferralView`,
  `SupportView`, etc.

Same fix applies to `DashboardView`, `ReferralView`, `SupportView`
(they're also `() => <jsx>` declared inline) but they hold less local
state so the symptoms are milder.

### 1b. Massive duplication of config inputs
"System Configuration" (`src/App.tsx:2824`) and "Global Configuration"
(`src/App.tsx:3294`) both render inputs for **the same** admin settings:
`adminMinWithdrawal`, `adminSpinCost`, `adminDailyReward`,
`adminAdReward`, the Global Notice textarea, and the Maintenance
toggle. Editing one doesn't visibly update the other (they share state
so they will, but it's confusing UX) and there are two separate
"Apply System Changes" / "Commit System Changes" buttons that both
call the same `saveChanges`.

Fix: pick one canonical config section. I recommend keeping the more
complete "System Configuration" panel and deleting the "Global
Configuration" section entirely, OR collapsing both into a tabbed
"Settings" pane.

### 1c. Two persistence paths, only one of them works for balance
`saveChanges` (`src/App.tsx:2209`) does
```ts
const { mainBalance, totalEarned, totalCommission, ...safeAdminFields } = adminUser;
await adminUpsert('users', safeAdminFields);
```
That intentionally strips the financial fields to avoid clobbering
in-flight balance changes. But the "Balance Control" UI right above
(`src/App.tsx:3149`) lets you click `Add` / `Remove` to adjust
`adminUser.mainBalance`, and those edits **never persist** because the
only save path strips them. The "Main Balance / Total Earned" inputs
right below have the same problem. Visually it looks like adjusting
balance works; in the database nothing changes.

Fix:
- The `Add` / `Remove` buttons should call `adminIncrement('users', ...,
  'mainBalance', delta)` directly (atomic, race-safe), not just mutate
  local state.
- The raw `Main Balance` / `Total Earned` numeric inputs are dangerous
  (any fix should warn the admin and use a confirm prompt + audit log
  field). Recommend hiding them behind an explicit "Override
  financials" expander.

---

## 2. Per-section functional audit

Legend: ✅ works as advertised • ⚠️ partially works / has bugs • ❌
broken or fake • 🗑 should be removed

### Header / chrome
- `Admin Terminal` title, status pill, `Users` and `Paid` counter
  cards (`src/App.tsx:2640`-`2657`) — ✅ pull live values from
  `allUsers.length` and `totalPaid`.
- Back button → `setView('home')` — ✅ works (and now also clears
  `/admin` from the URL).

### "Live Control Hub" (`src/App.tsx:2660`)
- 13 quick-action tiles. All they do is `setActiveAdminTab(...)` or
  toggle `adminMaintenance`. ⚠️ duplicates the tab bar that is
  rendered ~700 lines below (`src/App.tsx:3469`). Tiles like `Add
  Task`, `Tasks`, `Microjobs` are basically the same destination.
- "Live Site" — ✅ goes to home.
- "Maintenance" tile — ⚠️ flips local `adminMaintenance` only; you
  must remember to scroll to "Apply System Changes" or the toggle is
  not persisted. The same toggle exists in the "Global Configuration"
  card lower down.

Recommendation: 🗑 delete this section entirely; keep the tab bar
only. It's redundant and adds visual noise.

### "System Health" (`src/App.tsx:2775`)
- "Server Latency: 24ms" — ❌ hardcoded string. Not real.
- "Active Links: {dynamicTasks.length}" — ✅ real, but the label is
  misleading (it's the number of admin-created tasks, not "links").

Recommendation: 🗑 delete the whole "System Health" card. It's
decorative. If you want real health, that needs a backend metrics
endpoint.

### "Live Activity Feed" (`src/App.tsx:2801`)
Pulls from `gmailSubmissions`, `taskSubmissions`, `microjobSubmissions`,
`withdrawals`, sorts by timestamp, renders 10. ✅ data is real, but it
shows `USER_xxxx` (4-char id slice) and a generic verb, so it's
operationally useless when you can already see the same items in their
respective tabs.

Recommendation: 🗑 delete or replace with a "Recent admin actions"
audit log (would require a new `admin_actions` table).

### "System Configuration" big grid (`src/App.tsx:2824`)
The inputs themselves are bound correctly to local state, and `saveChanges`
upserts them to the `settings` row. ✅ functional. ⚠️ no validation
(negative numbers are accepted), no defaults, no per-field save - only
the global "Apply System Changes" button persists.

Issues to fix:
- Validate numerics (>= 0, sane upper bounds for percentages).
- Several fields don't appear in the duplicate "Global Configuration"
  section, e.g. `Gen 1/2/3 Rate`, `Total Paid`, `Active Workers`,
  `Activation Fee`, `Activation Duration`, `Recharge Commission`,
  `Referral Commission`, `Referral Activation Bonus`. These are the
  reason this section needs to stay (and "Global Configuration" can
  be deleted).

### "User Management" big section (`src/App.tsx:3078`)
Section that lets you search a user, then edit their fields inline.

- Search by email/name select — ✅ filters `allUsers`.
- Search by referral ID + Find button — ✅ scans `numericId`.
- Balance Control `Add`/`Remove` — ❌ no DB write (see 1c above).
- Change Name / Change Password — ⚠️ persists via `safeAdminFields`
  upsert (password as plaintext, which is suspicious in a Clerk world,
  see "Security" below).
- Email / Age / Pending Payout / Rank — ✅ persist.
- Main Balance / Total Earned numeric inputs — ❌ stripped by
  `saveChanges`, never saved (see 1c).
- "Account Activation" toggle (`isActive`) — ✅ persists.
- "Delete User Account" — ✅ calls `adminDelete('users', id)`.
  Doesn't refresh the local list afterwards, the "selected user"
  remains stale.

Recommendation: ⚠️ this section is also duplicated by the "Users" tab
inside the submissions panel (`src/App.tsx:3507`), which has its own
`Activate` / `Deactivate` / `Suspend` / `Ban` / `Unban` buttons that
**do** persist via `adminUpdate` directly. The big section is
fundamentally redundant and unsafe (mainBalance writes silently fail).
Recommend collapsing into the tab and deleting the duplicate.

### "Global Configuration" (`src/App.tsx:3294`)
Maintenance toggle, Global Notice, Min Withdrawal, Spin Cost, Daily
Reward, Ad Reward, Delivery Fee. ✅ all bound and saved, but every one
is a duplicate of inputs already present in "System Configuration".

Recommendation: 🗑 delete entirely.

### "Feature Matrix" (`src/App.tsx:3376`)
- Core Modules (spin / daily-claim / leaderboard / **support** /
  ads-earn / mobile-recharge / drive-offer) — ✅ toggles persist via
  `enabledFeatures` array.
- Income Cards (`INCOME_CARDS`) — ✅ persists via `enabledCards`.
- SMM & Boosting Services — ✅ persists via `enabledSmmServices`.

Issues:
- `support` toggle is now meaningless — the in-app Support route was
  removed when we moved to Tawk.to and the homepage Support tile is
  gone. The toggle still flips a flag that nothing reads. 🗑 remove
  the `Support Chat` toggle and clean up `enabledFeatures` defaults
  (and the `'support'` literal in `setEnabledFeatures` defaults at
  `src/App.tsx:260` and `:498`).

### Submission Control tabs (`src/App.tsx:3461`-`4874`)
Per tab:

| Tab | Purpose | Status | Notes |
|-----|---------|--------|-------|
| `users` | List + ban/suspend/reactivate | ✅ | Persists via `adminUpdate` and `/api/admin/users/:id/ban`. Reactivate-all is batched. |
| `news` | Post + delete news | ✅ | Image upload via `uploadMedia`; delete via `adminDelete`. |
| `gmail` | Approve/reject Gmail submissions | ✅ | `handleGmailAction` writes status + reason and credits the user via `adminIncrementFields`. |
| `subscriptions` | Approve/reject subscription requests | ✅ | Refunds price on rejection. |
| `facebook` | Approve/reject FB task submissions | ✅ | Reuses `handleTaskAction`. |
| `microjobs` | Approve/reject microjob submissions | ✅ | `handleMicrojobAction` works. |
| `dollar-buy` | Approve/reject USD buy requests | ✅ | `handleDollarBuyAction`. No "dollar-sell" companion tab even though `DollarSellView` exists in the user app. ⚠️ |
| `smm` | SMM order pipeline + price grid | ✅ | Status transitions: `pending` → `processing` → `completed`/`cancelled`. |
| `withdrawals` | Approve/reject payouts | ✅ | Atomic increment on rejection refund, and `processingIds` lock to dedupe double-clicks. |
| `deposits` | Approve/reject "deposits" | ⚠️ | Backed by `rechargeRequests` — exact same data as the `recharge` tab. Duplicate. |
| `recharge` | Approve/reject mobile recharges | ⚠️ | Same data as `deposits`. Pick one. |
| `drive-requests` | Approve/reject drive offer requests | ✅ | |
| `drive-offers` | Add / list / delete drive offers | ✅ | |
| `products` | Add / list / delete products + AI seed button | ✅ | "AI POST" button posts a hardcoded sample. 🗑 remove if not used in production. |
| `product-orders` | Order pipeline (pending / processing / delivered / cancelled) | ✅ | "Shipped" status is in the type union but never has a UI button to set it. ⚠️ |
| `tasks` | Add / list / delete dynamic tasks | ✅ | |
| `ludo` | Create tournaments, manage room codes, review submissions | ✅ | Heavy section, all working. The room-code update on `onBlur` is a UX trap — tab-out commits silently. ⚠️ |
| `social` | Approve/reject social-job submissions | ✅ | Approval also processes referral commission. |
| `uploads` | Browse/delete every upload globally | ✅ | Deletes only the DB row, not the underlying object in Supabase storage. ⚠️ |

### Final "Commit System Changes" button (`src/App.tsx:4877`)
✅ same as "Apply System Changes". Just the second of two duplicate
save buttons.

---

## 3. Security / data hygiene flags

These are not "broken" per se but are landmines worth fixing while the
admin panel is being cleaned up.

- **Plaintext password edit** (`Change Password` field). Since the
  Clerk migration there's no reason for the `users.password` column
  to be edited from the client, and no reason it should still be
  stored at all. Confirm whether `users.password` is still written
  anywhere. If not: remove the column from `safeAdminFields`, drop
  the input, and add a Supabase migration to drop the column.
- **Direct numeric balance inputs** (`adminUser.mainBalance` /
  `totalEarned`) bypass the audit-friendly `adminIncrement` flow.
  Even if we wire them up, they should require a confirm step and
  ideally write a row to a `balance_adjustments` audit table.
- **`prompt()` for ban / suspend / refund reason**. Native prompts are
  trivially dismissible and easy to typo. Replace with proper modal
  UI.
- The 14-line giant tab union at `src/App.tsx:2042` should become a
  string literal type alias so adding a tab in one place doesn't drift
  from the other.

---

## 4. Sections to remove (clean-up only, no behavior change)

In priority order:

1. 🗑 The `Support Chat` entry in the Feature Matrix and the matching
   `'support'` defaults. (Tawk.to handles support now.)
2. 🗑 "System Health" card (fake server latency).
3. 🗑 "Live Activity Feed" card (decorative, redundant with tabs).
4. 🗑 "Live Control Hub" quick-action grid (duplicate of the tab bar).
5. 🗑 "Global Configuration" section (duplicate of "System
   Configuration").
6. 🗑 "User Management" big editor section (duplicate of `Users` tab,
   has dead balance writes).
7. 🗑 One of `deposits` / `recharge` tabs (they read the same table).
   Recommend keeping `deposits` and removing `recharge`, since deposit
   is the more accurate label.
8. 🗑 The "AI POST" sample-product button (`seedSampleProduct`) if it
   was only for dev seeding.
9. 🗑 The bottom duplicate "Commit System Changes" button.
10. 🗑 The unused `adminReply` / `setAdminReply` state
    (`src/App.tsx:1881`) and any other support-console leftovers.

---

## 5. Bugs to fix

In priority order:

1. **Fix the `AdminView` remount loop** (`src/App.tsx:2005`). Move it
   to its own file and pass props. This is the single biggest UX
   improvement.
2. **Wire up balance Add / Remove** to `adminIncrement`
   (`src/App.tsx:3162`-`3173`).
3. **Refresh `adminUser` after delete** so the form doesn't keep
   showing a deleted user (`src/App.tsx:3275`-`3290`).
4. **Add a "Shipped" button** to product-orders processing list, or
   drop `'shipped'` from the status union.
5. **Clear `users.password` from the admin write path**, drop the
   input, audit whether the column can be dropped from the schema.
6. **Replace `prompt()` flows** with a small reusable modal in
   `src/components/`. Affects: ban reason, suspend duration, suspend
   reason, social-submission rejection, microjob rejection, gmail
   rejection, withdrawal rejection.
7. **Validate numeric settings** in `saveChanges` before upserting.
   Reject negatives and `NaN`.
8. **Type the admin tab union** as a single exported string-literal
   alias used in both `useState<...>` and the tab list.
9. **Either delete the `uploads` storage object on delete or rename
   the action** so admins know they're only deleting the metadata
   row.
10. **Decouple Ludo room-code `onBlur` save** — make it explicit with
    a Save button so admins don't silently overwrite codes by
    tabbing past the input.
11. **Remove the `'support'` value from `enabledFeatures` defaults**
    once the Support Chat toggle is gone.

---

## 6. Suggested rollout order

These are independent enough to land as separate small PRs. I'd group
them this way:

**PR A — Cleanups (low risk, big visual win)**
- Remove items 1-9 from §4 (everything except #10 because that
  requires touching unused-state cleanup elsewhere).
- Remove the `Support Chat` toggle.
- Strip dead support-console state (`adminReply`).
- Drop `'support'` from `enabledFeatures` defaults.

**PR B — Refactor (foundation)**
- Move `AdminView` into its own module
  `src/features/admin/AdminView.tsx`. No behavior change. Confirm
  inputs no longer reset between background refreshes.

**PR C — Functional fixes**
- Balance Add/Remove → `adminIncrement`.
- Refresh `adminUser` after delete.
- "Shipped" status fix.
- Numeric validation in `saveChanges`.
- Tab union type alias.

**PR D — UX hardening**
- Replace `prompt()` flows with a confirm/reason modal.
- Ludo room-code save button.
- Uploads "Delete" relabeled and/or wired to storage delete.
- (Optional) `users.password` removal — needs a migration plan since
  the column may still exist on prod and feed legacy code paths.

This sequencing keeps every PR reviewable and reversible. PR A alone
will visibly clean up 30-40 % of the admin UI without changing any
behavior, which is usually the safest first step.
