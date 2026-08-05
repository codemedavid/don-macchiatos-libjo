# TDD Evidence — Confirmed orders vanishing, and status filtering

**Branch:** `feat/mobile-ui-polish`
**Checkpoints:** `79b9e6a` (RED) → `2dc1354` (GREEN) → `0f835a9` (RED) →
`0aba2dc` (GREEN) → `daf9f99` (wiring) → `875421d` (refactor)

## Source plan

No `*.plan.md`. Journeys were derived during this TDD run from the report:
*"when the order is being confirmed it's not going on the history, it just
disappears from the screen"* plus *"add better filtering for the in progress
orders and complete orders."*

Follows on from [`order-history-window.tdd.md`](./order-history-window.tdd.md),
which fixed History windowing on closing time and surfaced failed status updates.

## Triage

Two distinct things are behind the one report, and only one of them is a code
defect that could be reproduced here.

**1. Confirm does not close an order — this is the dominant cause.**
`STATUS_FLOW` in `mobile/app/order/[id].tsx` is
`pending → confirmed → preparing → ready → completed`. "Confirm Order" sets
`confirmed`, which is *active*, so History (which shows only `completed` /
`cancelled`) is correctly still empty. On the Orders tab the order does not
vanish — it moves from the **New** section to **In Progress**, which on a phone
is below the fold and reads as "it disappeared."

The previous session reached the same conclusion and changed nothing. The report
recurring is itself the evidence that "not a bug, tap four times" was not an
adequate answer: nothing in the UI told staff where the order went. That is what
the filtering work below addresses, and it is the user's own requested remedy.

**2. A real defect: an active order with an unbucketed status is dropped.**
`getActiveOrders` defines active as *not closed*, while the Orders screen
enumerated a fixed status list. When those two definitions disagree, the order
is returned by the query, matches no section, and is rendered nowhere — gone
from the Orders tab while never reaching History. Today the six schema statuses
happen to line up, so this is latent rather than live; it is still the exact
failure mode described, and it is now impossible.

## User journeys

1. As cafe staff, I want every active order to stay visible on the Orders tab no
   matter what status it carries, so an order can never silently disappear.
2. As cafe staff, I want to filter active orders by stage, so I can find a
   confirmed order immediately after confirming it instead of hunting for it.
3. As cafe staff, I want each filter to show how many orders it holds, so I can
   see at a glance that an order moved rather than vanished.
4. As cafe staff, I want to separate completed from cancelled orders in History,
   so I can review either without reading past the other.

## Task report

### Task 1 — An active order can never vanish (journey 1)

`buildSections` was lifted verbatim out of `mobile/app/(tabs)/orders.tsx` into
`mobile/lib/orderFilters.ts` so it could be exercised directly, then given a
catch-all "Other" section for any active status outside the named buckets.

**Validation:** `npx jest __tests__/orderFilters.test.ts`

RED (commit `79b9e6a`):

```
Tests: 1 failed, 8 passed, 9 total

✕ never drops an active order whose status has no dedicated section

  - Expected  - 1
  + Received  + 0
    Array [
      "a",
  -   "mystery",
    ]
```

The 8 passing tests are the evidence that the extraction changed no behaviour.

GREEN (commit `2dc1354`): `Tests: 9 passed, 9 total`

### Task 2 — Status filtering (journeys 2, 3, 4)

Added `ACTIVE_FILTERS` / `activeFilterCounts` / filter-aware
`buildActiveSections` for the Orders tab, and `HISTORY_FILTERS` /
`historyFilterCounts` / `filterHistoryOrders` for History. The ad-hoc search
filter that lived inline in `history.tsx` moved into `filterHistoryOrders` and
is now tested.

**Validation:** `npx jest __tests__/orderFilters.test.ts`

RED (commit `0f835a9`): `Tests: 21 failed, 11 passed, 32 total`

GREEN (commit `0aba2dc`): `Tests: 32 passed, 32 total`

### Task 3 — Screen wiring (commit `daf9f99`)

- **Orders tab:** a chip row of `All · n / New · n / In Progress · n / Ready · n`
  above the list. The counts are the direct answer to "it disappeared" — after
  confirming, **In Progress** visibly increments.
- **History tab:** the existing date pills keep their row; a second row adds
  `All · n / Completed · n / Cancelled · n`. Counts describe the whole date
  window, so a chip still advertises what a different status would reveal.
- Empty states now distinguish "nothing at all" from "nothing in *this* filter",
  and the latter reports how many orders sit under **All**.

**Validation:** `npx tsc --noEmit` in `mobile/` and
`npx tsc --noEmit -p convex/tsconfig.json` — both clean.

**Not unit-tested.** Jest here is deliberately scoped to pure logic modules (no
jest-expo RN preset), so the screens themselves are verified on-device. See
*Known gaps*.

### Task 4 — Refactor (commit `875421d`)

`STATUS_BUCKETS` became the single bucket→statuses map. `SECTION_ORDER` carries
only ordering and titles, and `activeFilterCounts` reads the same map rather
than re-deriving it through a lookup that could silently miss. This removed the
module's only uncovered branch.

**Validation:** `npx jest --coverage` — 74 passed, `orderFilters.ts` at 100%.

## Test specification

| # | What is guaranteed | Test file / name | Type | Result |
|---|---|---|---|---|
| 1 | A pending order is filed under New | `orderFilters.test.ts:files a pending order under New` | unit | PASS |
| 2 | A confirmed order is filed under In Progress | `orderFilters.test.ts:files a confirmed order under In Progress` | unit | PASS |
| 3 | Confirmed and preparing orders share the In Progress section | `orderFilters.test.ts:files a preparing order under In Progress alongside confirmed orders` | unit | PASS |
| 4 | A ready order is filed under Ready for Handover | `orderFilters.test.ts:files a ready order under Ready for Handover` | unit | PASS |
| 5 | Sections render New → In Progress → Ready for Handover | `orderFilters.test.ts:orders sections New, then In Progress, then Ready for Handover` | unit | PASS |
| 6 | Empty sections are omitted | `orderFilters.test.ts:omits sections that have no orders` | unit | PASS |
| 7 | An empty order list yields no sections | `orderFilters.test.ts:returns no sections for an empty list` | unit | PASS |
| 8 | **An active order with no dedicated section is never dropped** (the reported bug) | `orderFilters.test.ts:never drops an active order whose status has no dedicated section` | unit | PASS |
| 9 | Sectioning does not mutate the caller's array | `orderFilters.test.ts:does not mutate the caller's array` | unit | PASS |
| 10 | The All filter shows every section | `orderFilters.test.ts:shows every section under the All filter` | unit | PASS |
| 11 | Omitting the filter behaves as All | `orderFilters.test.ts:defaults to All when no filter is given` | unit | PASS |
| 12 | The New filter narrows to pending orders only | `orderFilters.test.ts:narrows to just new orders` | unit | PASS |
| 13 | **The In Progress filter surfaces confirmed orders** | `orderFilters.test.ts:keeps confirmed orders reachable under the In Progress filter` | unit | PASS |
| 14 | The Ready filter narrows to orders awaiting handover | `orderFilters.test.ts:narrows to orders waiting for handover` | unit | PASS |
| 15 | A filter matching nothing yields no sections | `orderFilters.test.ts:returns no sections when the selected filter matches nothing` | unit | PASS |
| 16 | Chip counts report each bucket and the total | `orderFilters.test.ts:counts each bucket and the total` | unit | PASS |
| 17 | Every bucket reports zero when there are no orders | `orderFilters.test.ts:reports zero for every bucket when there are no orders` | unit | PASS |
| 18 | An unbucketed active order still counts toward the total | `orderFilters.test.ts:counts an unbucketed active order in the total so it is never hidden` | unit | PASS |
| 19 | Every counted Orders bucket has a chip | `orderFilters.test.ts:exposes a filter chip for every counted bucket` | unit | PASS |
| 20 | History All returns every closed order | `orderFilters.test.ts:returns everything under the All filter` | unit | PASS |
| 21 | History narrows to completed orders | `orderFilters.test.ts:narrows to completed orders` | unit | PASS |
| 22 | History narrows to cancelled orders | `orderFilters.test.ts:narrows to cancelled orders` | unit | PASS |
| 23 | Search matches the customer name, case-insensitively | `orderFilters.test.ts:matches a search term against the customer name, case-insensitively` | unit | PASS |
| 24 | Search matches the order number | `orderFilters.test.ts:matches a search term against the order number` | unit | PASS |
| 25 | Search matches the contact number | `orderFilters.test.ts:matches a search term against the contact number` | unit | PASS |
| 26 | Search ignores surrounding whitespace | `orderFilters.test.ts:ignores surrounding whitespace in the search term` | unit | PASS |
| 27 | A blank search is treated as no search | `orderFilters.test.ts:treats a blank search as no search at all` | unit | PASS |
| 28 | Status filter and search apply together | `orderFilters.test.ts:applies the status filter and the search term together` | unit | PASS |
| 29 | A non-matching search returns an empty list | `orderFilters.test.ts:returns an empty list when nothing matches` | unit | PASS |
| 30 | History filtering does not mutate the caller's array | `orderFilters.test.ts:does not mutate the caller's array` | unit | PASS |
| 31 | History chip counts report completed, cancelled, and total | `orderFilters.test.ts:counts completed, cancelled, and the total` | unit | PASS |
| 32 | Every counted History bucket has a chip | `orderFilters.test.ts:exposes a filter chip for every counted bucket` | unit | PASS |

## Coverage

`npx jest --coverage` (run from `mobile/`):

```
File              | % Stmts | % Branch | % Funcs | % Lines
All files         |     100 |       95 |     100 |     100
 convex/lib
  orderHistory.ts |     100 |      100 |     100 |     100
 mobile/lib
  format.ts       |     100 |       80 |     100 |     100
  orderFilters.ts |     100 |      100 |     100 |     100
  sales.ts        |     100 |      100 |     100 |     100
  theme.ts        |     100 |      100 |     100 |     100

Test Suites: 5 passed, 5 total
Tests:       74 passed, 74 total
```

Above the 80% threshold. Typechecks clean: `npx tsc --noEmit` in `mobile/` and
`npx tsc --noEmit -p convex/tsconfig.json`.

## Known gaps

- **The dominant cause of the report is a workflow expectation, not a defect
  this run fixed.** Confirm sets `confirmed`; only **Complete Order** (or
  **Cancel Order**) moves an order to History. The filtering makes that legible
  but does not change the flow. If staff should reach History in fewer taps, the
  `STATUS_FLOW` chain is the thing to shorten — that is a product decision and
  was deliberately not made here.
- **Deploy still required, and still unverified.** `npx convex function-spec`
  reports *"You don't have access to the selected project"* from this
  environment, exactly as in the previous run. If `npx convex deploy` has not
  been run since commit `4c23e0c`, the deployed schema has no `completedAt` and
  no `by_status` index — completing an order would fail schema validation and
  History would error. **That is the first thing to check if orders still do not
  reach History after this change.**
- **Screens are untested in Jest.** `orders.tsx` and `history.tsx` are verified
  by typecheck and review only; the RN preset is intentionally absent.
- **The "Other" catch-all section is unreachable today.** All six schema
  statuses map to a bucket, so it is a guard against future drift rather than a
  currently-visible section. It is covered by unit test #8.
- **`getActiveOrders` still collects the whole table** and filters in memory.
  Pre-existing, untouched, out of scope.

## Merge evidence

If these checkpoints are squashed, the RED → GREEN → refactor summary above is
the record of what was verified and how.
