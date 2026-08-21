# TDD Evidence — In-App Order Tracking (Messenger removed)

**Date:** 2026-08-21
**Branch:** `feat/mobile-ui-polish`
**Scope:** customer web app (`src/`)

## Source plan

No `*.plan.md` was supplied. The user journeys below were derived during this TDD run from the request:
remove the Messenger handoff, end the checkout on an order summary + live status tracker, and ring when the
order is ready.

## User journeys

1. As a customer, after placing my order I stay in the app and see my order summary and order number,
   so I never have to open Messenger.
2. As a customer, I see my order status update live without refreshing, so I know when it is being prepared.
3. As a customer, I hear a ring (and feel a vibration) the moment my order becomes ready, so I notice even
   when I am not looking at the screen.

## Task report

### 1. Test infrastructure

The web app had no test runner. Added Vitest + jsdom + React Testing Library, `src/test/setup.ts`, and
`test` / `test:watch` / `test:coverage` scripts. Coverage is scoped to the feature surface (see gaps below).

### 2. RED

Command: `npm test`

```
FAIL  src/components/OrderTracking.test.tsx — Failed to resolve import "./OrderTracking"
FAIL  src/hooks/useReadyAlert.test.ts       — Failed to resolve import "./useReadyAlert"
FAIL  src/lib/chime.test.ts                 — Failed to resolve import "./chime"
FAIL  src/lib/orderStatus.test.ts           — Failed to resolve import "./orderStatus"
FAIL  src/components/Checkout.test.tsx > never mentions Messenger anywhere in the checkout flow
FAIL  src/components/Checkout.test.tsx > shows the order tracking screen after the order is placed
FAIL  src/components/Checkout.test.tsx > surfaces a retryable error when the order cannot be saved
 Test Files  5 failed (5)
      Tests  3 failed (3)
```

The Checkout failures were caused by the intended defect: the payment step still rendered
`Place Order via Messenger` and assigned `window.location.href = "https://www.messenger.com/t/…"`.

Checkpoint: `67f251c test: add reproducers for in-app order tracking without Messenger`

### 3. GREEN

Implemented:

- `src/lib/orderStatus.ts` — status pipeline, labels, stage-reached logic, `hasBecomeReady` transition rule.
- `src/lib/chime.ts` — Web Audio chime (no asset to load), primed on the Place Order click so autoplay
  policy does not mute the later ring.
- `src/hooks/useReadyAlert.ts` — rings + vibrates once on the transition into `ready`.
- `src/components/OrderTracking.tsx` — presentational tracker: order number, stage list, ready banner,
  full summary, "Place Another Order".
- `src/components/OrderTracker.tsx` — container subscribing to `api.orders.getOrderById`. Convex pushes
  every status change over its live subscription, so status is realtime without a manual poll; the locally
  built snapshot renders until the server document arrives.
- `src/components/Checkout.tsx` — Messenger text builder, clipboard fallback and redirect removed; ends on
  the tracker, with a `role="alert"` retryable error when `createOrder` fails.
- `src/App.tsx` — clears the cart on success, returns to the menu on "Place Another Order".

Command: `npm test`

```
 ✓ src/lib/chime.test.ts (5 tests)
 ✓ src/lib/orderStatus.test.ts (13 tests)
 ✓ src/hooks/useReadyAlert.test.ts (5 tests)
 ✓ src/components/OrderTracking.test.tsx (7 tests)
 ✓ src/components/Checkout.test.tsx (3 tests)
 Test Files  5 passed (5)
      Tests  33 passed (33)
```

Checkpoint: `2cad708 feat: track orders in-app instead of redirecting to Messenger`

### 4. Refactor

- Extracted `PAYMENT_LABELS` / `PAYMENT_ICONS` / `SERVICE_LABELS` into `src/lib/orderLabels.ts`; the
  in-component map was missing `bank-transfer` and failed `tsc`.
- Removed the client-side `sendNewOrderNotification` call — `createOrder` already schedules it server-side
  (`convex/orders.ts:100`), so staff were receiving two pushes per order. This also cleared a type error
  (the action requires `orderId`, which the client call did not pass).
- Added `type="button"` to "Proceed to Payment" to stop an implicit form submit.

Verified after refactor: `npm test` → 33 passed; `npm run build` → built successfully;
`npx eslint` on all changed files → clean; `npx tsc -p tsconfig.app.json --noEmit` → no errors in any
touched file.

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|--------------------|----------------------|-----------|--------|----------|
| 1 | The checkout flow never renders or links to Messenger | `src/components/Checkout.test.tsx:never mentions Messenger anywhere in the checkout flow` | integration | PASS | `npm test` |
| 2 | Placing an order shows the tracking screen with the order number instead of navigating away | `src/components/Checkout.test.tsx:shows the order tracking screen after the order is placed` | integration | PASS | `npm test` |
| 3 | A failed `createOrder` shows a retryable alert instead of silently swallowing the error | `src/components/Checkout.test.tsx:surfaces a retryable error when the order cannot be saved` | integration | PASS | `npm test` |
| 4 | The tracker shows the order number, items, variations, add-ons, bundles, notes and total | `src/components/OrderTracking.test.tsx:shows the full order summary instead of redirecting anywhere` | unit | PASS | `npm test` |
| 5 | Reached stages are marked and later stages are not | `src/components/OrderTracking.test.tsx:highlights the current status and the stages already reached` | unit | PASS | `npm test` |
| 6 | A ready order is announced prominently | `src/components/OrderTracking.test.tsx:announces a ready order prominently` | unit | PASS | `npm test` |
| 7 | A cancelled order hides the stage tracker and explains itself | `src/components/OrderTracking.test.tsx:hides the stage tracker for a cancelled order` | unit | PASS | `npm test` |
| 8 | Status stage ordering, labels, descriptions and cancellation handling are correct | `src/lib/orderStatus.test.ts` (13 cases) | unit | PASS | `npm test` |
| 9 | The chime rings on the transition into ready, exactly once | `src/hooks/useReadyAlert.test.ts:rings when the status transitions into ready` / `does not ring again while the order stays ready` | unit | PASS | `npm test` |
| 10 | Reloading an already-ready order does not re-ring | `src/hooks/useReadyAlert.test.ts:does not ring on the first observed status, even if already ready` | unit | PASS | `npm test` |
| 11 | The default alert rings the chime and vibrates | `src/hooks/useReadyAlert.test.ts:rings the chime and vibrates the device when the order becomes ready` | unit | PASS | `npm test` |
| 12 | A blocked vibration API never breaks the tracker | `src/hooks/useReadyAlert.test.ts:still rings when the device cannot vibrate` | unit | PASS | `npm test` |
| 13 | The chime plays a multi-note tone, reuses one AudioContext, and resumes a suspended one | `src/lib/chime.test.ts` (3 cases) | unit | PASS | `npm test` |
| 14 | Unavailable or failing audio reports false instead of throwing | `src/lib/chime.test.ts:reports failure instead of throwing…` (2 cases) | unit | PASS | `npm test` |

## Coverage

Command: `npm run test:coverage` (thresholds set to 80% for statements/branches/functions/lines)

```
File               | % Stmts | % Branch | % Funcs | % Lines
All files          |    97.9 |     90.8 |   94.44 |    97.9
 OrderTracking.tsx |    98.1 |    89.74 |     100 |    98.1
 useReadyAlert.ts  |     100 |     90.9 |      75 |     100
 chime.ts          |   95.12 |    88.46 |     100 |   95.12
 orderLabels.ts    |     100 |      100 |     100 |     100
 orderStatus.ts    |     100 |      100 |     100 |     100
```

## Known gaps

- Coverage is scoped to the order-tracking modules. The rest of `src/` predates this test setup and is
  uncovered; broadening it is follow-up work, not part of this change.
- `src/components/OrderTracker.tsx` is excluded from the coverage scope — it is a thin Convex `useQuery`
  wrapper. Its fallback-to-local-snapshot path is exercised indirectly by the Checkout tests (which mock
  `useQuery` as `undefined`), but there is no dedicated test for the server-document mapping.
- The tracker lives in component state, so a hard page refresh loses it. Persisting the order id
  (localStorage or a `/order/:id` route) was not requested and was left out deliberately.
- No E2E test. The web app has no Playwright setup; adding one was out of scope for this change.
