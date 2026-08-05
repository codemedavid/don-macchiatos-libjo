# TDD Evidence — Completed orders not reaching History

**Branch:** `feat/mobile-ui-polish`
**Checkpoints:** `44f36b0` (RED) → `4c23e0c` (GREEN) → `d30952f` (refactor)

## Source plan

No `*.plan.md`. Journeys were derived during this TDD run from the reported
symptom: *"I tried to confirm it but it's not going to history whatever I do."*

## Triage

The user confirmed the status badge does change to **Confirmed** after the
dialog, so the mutation itself was firing. That ruled out a dead button and
split the report into one expectation mismatch plus two real defects.

**Expectation mismatch (not a bug, no code change):** History only ever shows
`completed` / `cancelled` orders. "Confirm Order" sets `confirmed`, an *active*
status, so the order correctly stays on the Orders tab under "In Progress".
Reaching History requires all four steps: Confirm → Start Preparing → Mark as
Ready → Complete Order.

**Defect 1 — History windowed on the wrong timestamp.** `getCompletedOrders`
ranged the `by_createdAt` index, so an order taken on one day and completed the
next never appeared under the default Today filter regardless of how many times
staff completed it.

**Defect 2 — silent mutation failure.** `updateOrderStatus` was invoked from the
confirm dialog as `onPress: () => updateStatus(...)` — not awaited, not caught.
A rejection vanished into an unhandled promise, so a failed update was
indistinguishable from an ignored tap. `handleCancel` also navigated back
before knowing whether the mutation succeeded.

## User journeys

1. As cafe staff, I want an order I complete this morning to appear in today's
   History even if the customer placed it yesterday evening, so that the day's
   record is accurate.
2. As cafe staff, I want History entries ordered by when they were closed, so
   the most recently finished order is at the top.
3. As cafe staff, I want to be told when a status update fails, so I don't
   assume an order advanced when it didn't.

## Task report

### Task 1 — Window History on closing time

Extracted the selection logic into `convex/lib/orderHistory.ts` as pure
functions, added an optional `completedAt` to the `orders` schema, stamped it in
`updateOrderStatus` via `statusPatch`, and rewrote `getCompletedOrders` to read
closed orders through the `by_status` index and window them on
`historyTimestamp` (`completedAt ?? createdAt`).

The index range had to go: no single timestamp index covers a set where
`completedAt` is absent on legacy rows. Closed orders are a bounded working set
for one cafe, so the window is applied in memory.

**Validation:** `npx jest __tests__/orderHistory.test.ts`

RED (against the extracted current behaviour, commit `44f36b0`):

```
Tests: 6 failed, 10 passed, 16 total

✕ historyTimestamp > uses completedAt when the order recorded one
✕ selectHistoryOrders > includes an order created yesterday but completed
  inside today's window
✕ selectHistoryOrders > excludes an order created today but completed after
  the window closes
✕ selectHistoryOrders > sorts most recently closed first
✕ statusPatch > stamps completedAt when an order closes
✕ statusPatch > stamps completedAt when an order is cancelled
```

GREEN (commit `4c23e0c`): `Tests: 42 passed, 42 total`

**Guaranteed:** an order is filed in History under the moment it closed, legacy
rows without `completedAt` still appear under their creation time, window bounds
are inclusive, results are newest-closed-first, and the input array is not
mutated.

### Task 2 — Surface failed status updates

Both handlers in `mobile/app/order/[id].tsx` now route through a single
`applyStatus` helper that awaits the mutation, logs and alerts on rejection, and
returns success so "Cancel Order" only navigates back when the write landed.

**Validation:** `npx tsc --noEmit` in `mobile/` — clean.

**Not unit-tested.** Jest here is deliberately scoped to pure logic modules (no
jest-expo RN preset), so this screen-level change is verified on-device. See
*Known gaps*.

### Task 3 — Coverage scope repair

`convex/lib/orderHistory.ts` sits outside `mobile/`, so coverage silently
skipped it. `rootDir` moved to the repo root with `roots` confining discovery to
`mobile/__tests__`, and ts-jest is resolved from the config's own directory.

**Validation:** `npx jest --coverage` — 42 passed, module at 100%.

## Test specification

| # | What is guaranteed | Test file / name | Type | Result |
|---|---|---|---|---|
| 1 | `completed` and `cancelled` count as closed; `pending`/`confirmed`/`preparing`/`ready` do not | `orderHistory.test.ts:isClosedStatus` | unit | PASS |
| 2 | An order's History timestamp is its `completedAt` when present | `orderHistory.test.ts:uses completedAt when the order recorded one` | unit | PASS |
| 3 | Rows predating `completedAt` fall back to `createdAt` | `orderHistory.test.ts:falls back to createdAt for rows written before completedAt existed` | unit | PASS |
| 4 | In-flight orders never appear in History | `orderHistory.test.ts:excludes orders that are still in flight` | unit | PASS |
| 5 | Both completed and cancelled orders appear | `orderHistory.test.ts:includes both completed and cancelled orders` | unit | PASS |
| 6 | **An order created yesterday but completed today appears in today's window** (the reported bug) | `orderHistory.test.ts:includes an order created yesterday but completed inside today's window` | unit | PASS |
| 7 | An order completed after the window closes is excluded | `orderHistory.test.ts:excludes an order created today but completed after the window closes` | unit | PASS |
| 8 | An order closed before the window opens is excluded | `orderHistory.test.ts:excludes an order closed before the window opens` | unit | PASS |
| 9 | Window bounds are inclusive on both ends | `orderHistory.test.ts:includes orders sitting exactly on both window boundaries` | unit | PASS |
| 10 | Omitting the window returns every closed order | `orderHistory.test.ts:returns every closed order when no window is given` | unit | PASS |
| 11 | Results are sorted most-recently-closed first | `orderHistory.test.ts:sorts most recently closed first` | unit | PASS |
| 12 | Selection does not mutate the caller's array | `orderHistory.test.ts:does not mutate the caller's array` | unit | PASS |
| 13 | Closing an order stamps `completedAt` | `orderHistory.test.ts:stamps completedAt when an order closes` | unit | PASS |
| 14 | Cancelling an order stamps `completedAt` | `orderHistory.test.ts:stamps completedAt when an order is cancelled` | unit | PASS |
| 15 | In-flight transitions leave `completedAt` unset | `orderHistory.test.ts:leaves completedAt unset while the order is still in flight` | unit | PASS |

## Coverage

`npx jest --coverage` (run from `mobile/`):

```
File              | % Stmts | % Branch | % Funcs | % Lines
All files         |     100 |       92 |     100 |     100
 convex/lib
  orderHistory.ts |     100 |      100 |     100 |     100
 mobile/lib
  format.ts       |     100 |       80 |     100 |     100
  sales.ts        |     100 |      100 |     100 |     100
  theme.ts        |     100 |      100 |     100 |     100
```

Above the 80% threshold. Typechecks clean:
`npx tsc --noEmit -p convex/tsconfig.json` and `npx tsc --noEmit` in `mobile/`.

## Known gaps

- **The Convex query handler itself is untested.** Only the pure selection logic
  it delegates to is covered. There is no convex-test harness in this repo, and
  `npx convex run` is not usable from this environment — the CLI reports
  *"You don't have access to the selected project."* The end-to-end path was not
  executed against a live deployment.
- **`mobile/app/order/[id].tsx` error handling is untested.** Jest here excludes
  React Native screens by design. Verified by typecheck and review only.
- **Deploy step required.** The schema change (`completedAt`) and the rewritten
  `getCompletedOrders` only take effect after `npx convex deploy`.
- **Existing rows have no `completedAt`.** They keep falling back to `createdAt`,
  so orders closed on a different day than they were created stay mis-filed
  until re-closed. No backfill was written; `updatedAt` is a plausible backfill
  source for closed rows if that matters.
- **`getActiveOrders` still collects the whole table** and filters in memory.
  Pre-existing, untouched, out of scope here.

## Merge evidence

If these three checkpoints are squashed, the RED → GREEN → refactor summary
above is the record of what was verified and how.
