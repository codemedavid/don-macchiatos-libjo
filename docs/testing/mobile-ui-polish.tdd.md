# TDD Evidence — Mobile Order App UI Polish

**Branch:** `feat/mobile-ui-polish`
**Source plan:** inline `/ecc:plan` output (this session) — "build the mobile app better, receive orders perfectly, match website UI/UX."
**Scope of automated tests:** pure logic modules only. React Native screens are verified on a real-device dev build (user's chosen test environment), not in Jest.

## User journeys

1. As staff, I see how long ago each order arrived, in friendly relative time.
2. As staff/owner, all money is shown consistently as `PHP 0.00`.
3. As staff/owner, History and Sales filters (today/week/month/all) resolve to correct time windows.
4. As owner, Sales shows revenue, completed count, cancelled count, average order value, and per-service / per-payment breakdowns — counting completed orders only.

## Task report

| Behavior | Validation command | RED | GREEN |
|---|---|---|---|
| `lib/format.ts` (time-ago, currency, date ranges) | `npx jest format` | Failed: `Cannot find module '../lib/format'` | 12/12 pass |
| `lib/sales.ts` (sales aggregation) | `npx jest sales` | Failed: `Cannot find module '../lib/sales'` | 5/5 pass |
| `lib/theme.ts` brand-token contract vs website palette | `npx jest theme` | Failed: `Cannot find module '../lib/theme'` | 9/9 pass |

Full suite: `npx jest` → **26 passed / 26**. Coverage on tested modules: `lib/format.ts` 100% lines, `lib/sales.ts` 100% lines/branches.
Static check: `npx tsc --noEmit -p tsconfig.json` → **exit 0** (whole mobile app, incl. reskinned screens).

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | `< 1 min` old renders "Just now" | `__tests__/format.test.ts` | unit | PASS |
| 2 | minutes/hours/days thresholds render `Nm/Nh/Nd ago` | `__tests__/format.test.ts` | unit | PASS |
| 3 | future/clock-skew timestamp is clamped to "Just now" | `__tests__/format.test.ts` | unit | PASS |
| 4 | currency always `PHP` + 2 decimals (incl. 0) | `__tests__/format.test.ts` | unit | PASS |
| 5 | `today` window starts at local midnight; `week`/`month` = 7/30 days; `all` from epoch | `__tests__/format.test.ts` | unit | PASS |
| 6 | empty order list → zeroed stats, avg 0 (no divide-by-zero) | `__tests__/sales.test.ts` | unit | PASS |
| 7 | revenue/counts include completed only; cancelled counted separately | `__tests__/sales.test.ts` | unit | PASS |
| 8 | average order value from completed only | `__tests__/sales.test.ts` | unit | PASS |
| 9 | per-service and per-payment breakdowns aggregate count + revenue | `__tests__/sales.test.ts` | unit | PASS |
| 10 | mobile theme tokens match website Tailwind palette + fonts | `__tests__/theme.test.ts` | unit | PASS |

## Coverage / known gaps

- **Not unit-tested (by design):** visual styling, safe-area, fonts, navigation, Convex queries, push/sound. These are verified on-device.
- **Deferred (Phase 3/4 remainder):** offline/connection banner and pull-to-refresh were not implemented in this pass — see plan. Single strong new-order alert (sound + haptic + push) is wired; "repeat until acknowledged" was intentionally dropped per user choice.

## Merge evidence

RED→GREEN captured across commits on `feat/mobile-ui-polish`:
`test:` (logic modules, RED→GREEN) → `feat:` (theme foundation) → `feat:` (screen reskin, tsc clean).
