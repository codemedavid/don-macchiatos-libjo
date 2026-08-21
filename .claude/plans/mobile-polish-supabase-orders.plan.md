# Plan: Mobile Polish + Supabase Order Backbone

**Source**: free-form request (2026-07-28)
**Branch**: `feat/mobile-ui-polish`
**Complexity**: Large

## Summary

Move order storage from Convex to Supabase as the single source of truth, with
Postgres realtime driving the mobile app and an Edge Function delivering Expo
push notifications on new orders. Alongside the swap, polish the existing mobile
UI (skeletons, error states, pull-to-refresh, swipe actions, accessibility) and
raise test coverage to the 80% bar.

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Staff auth | Supabase Auth accounts (per-user), replacing the shared hardcoded password |
| Convex order history | Migrate into Supabase via one-time script, then remove Convex entirely |
| Redesign scope | Polish the existing cream/espresso design; no structural redesign |

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Migrations | `supabase/migrations/20260219_bundles.sql` | Timestamped SQL files, `create table if not exists`, RLS enabled per table |
| Supabase client | `src/lib/supabase.ts:1` | `createClient` with env guard that throws on missing vars; hand-written `Database` row types |
| Data hooks | `src/hooks/useMenu.ts` | `use<Entity>` hooks returning `{data, loading, error}` from Supabase queries |
| Theme tokens | `mobile/lib/theme.ts:1` | Named token objects (`colors`, `spacing`, `radius`, `fonts`, `shadow`) as `const`; brand values guarded by a contract test |
| UI primitives | `mobile/components/ui.tsx:1` | `AppText` variant map + `Card`/`Button`/`Pill`; screens compose these, never raw `View`/`Text` with ad-hoc colors |
| Pure logic + tests | `mobile/lib/sales.ts:1`, `mobile/__tests__/sales.test.ts` | Logic modules free of RN imports, injectable `now`, AAA-structured tests |

## Known Defects To Fix Along The Way

| # | Location | Defect |
|---|---|---|
| 1 | `src/components/Checkout.tsx:157` | `sendNotification` called without required `orderId` → always throws; also a duplicate of the scheduled notification in `convex/orders.ts:96` |
| 2 | `convex/orders.ts:80` | Order number derived from a count of today's orders → concurrent orders collide |
| 3 | `mobile/app/login.tsx:14`, `convex/auth.ts:4` | Password hardcoded in the shipped bundle; server validator never called |
| 4 | `mobile/app.json` `extra.CONVEX_URL` | Stale config pinning a dead backend |
| 5 | `src/components/Checkout.tsx:161` | Order-write failure only `console.warn`s → customer completes checkout with no order recorded |
| 6 | `mobile/app/(tabs)/orders.tsx:110` | No error state; a failed query renders "Loading orders…" forever |

---

## Phase 1 — Supabase Schema, RLS & Realtime

### Files
| File | Action | Why |
|---|---|---|
| `supabase/migrations/20260728_orders.sql` | CREATE | Orders + push_tokens tables, enums, order-number trigger, indexes, realtime publication |
| `supabase/migrations/20260728_orders_rls.sql` | CREATE | RLS policies: anon insert-only, authenticated staff read/update |

### Tasks
1. **Enums** — `order_status`, `service_type`, `payment_method` matching the existing Convex unions exactly.
2. **`orders` table** — `id uuid pk default gen_random_uuid()`, `order_number text unique not null`,
   `customer_name`, `contact_number`, `service_type`, `address`, `pickup_time`,
   `payment_method`, `reference_number`, `items jsonb not null`, `bundle_items jsonb`,
   `notes`, `total numeric(10,2) not null check (total >= 0)`, `status order_status not null default 'pending'`,
   `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
3. **Order number trigger** — `BEFORE INSERT` function using a daily sequence so numbering is
   atomic (`ORD-YYYYMMDD-NNN`). Fixes defect #2.
4. **`updated_at` trigger** — mirror the pattern used by the menu tables.
5. **Indexes** — `(status, created_at desc)` for the active-orders query, `(created_at desc)` for
   history/sales ranges, `(order_number)` unique for search.
6. **`push_tokens` table** — `token text primary key`, `role text check (role in ('staff','owner'))`,
   `user_id uuid references auth.users`, `created_at`.
7. **Realtime** — `alter table orders replica identity full;` and add `orders` to the
   `supabase_realtime` publication (REPLICA IDENTITY FULL is required for UPDATE payloads to
   include the old row).
8. **RLS**
   - `orders`: `insert` allowed to `anon` (web checkout); `select`/`update` restricted to
     `authenticated`. No anon read — customer phone numbers and addresses stay private.
   - `push_tokens`: all operations `authenticated` only.

### Validate
```bash
supabase db reset          # migrations apply cleanly from scratch
supabase db lint
```

---

## Phase 2 — Staff Auth (Supabase Auth)

### Files
| File | Action | Why |
|---|---|---|
| `supabase/migrations/20260728_staff_profiles.sql` | CREATE | `staff_profiles` mapping `auth.users` → role (`staff`/`owner`) |
| `mobile/lib/supabase.ts` | CREATE | Supabase client with AsyncStorage session persistence |
| `mobile/lib/auth.ts` | UPDATE | Replace AsyncStorage role blob with a real Supabase session; role read from `staff_profiles` |
| `mobile/app/login.tsx` | UPDATE | Email + password sign-in with loading/error state; drop the hardcoded password |
| `convex/auth.ts` | DELETE | Superseded |

### Tasks
1. `staff_profiles` table + RLS (a user reads only their own row); RLS helper `is_staff()` /
   `is_owner()` SQL functions used by the `orders` policies.
2. Mobile Supabase client configured with `storage: AsyncStorage`, `autoRefreshToken: true`,
   `persistSession: true`, `detectSessionInUrl: false`.
3. `AuthContext` rewritten over `supabase.auth.onAuthStateChange`; role resolved from
   `staff_profiles` and cached. Sales tab gating (`app/(tabs)/_layout.tsx:56`) reads the same role.
4. Login screen: email/password fields, inline validation, loading state on the button, real
   error messages (invalid credentials vs network) instead of a generic `Alert`.
5. Document the one-time account-creation step in `mobile/README.md`.

**Fixes defect #3.**

### Validate
```bash
cd mobile && npx tsc --noEmit && npm test
```

---

## Phase 3 — Push Notifications via Supabase Edge Function

### Files
| File | Action | Why |
|---|---|---|
| `supabase/functions/notify-new-order/index.ts` | CREATE | Sends Expo push on new order; prunes dead tokens |
| `supabase/migrations/20260728_order_webhook.sql` | CREATE | DB webhook / trigger invoking the function on INSERT |
| `mobile/lib/notifications.ts` | UPDATE | Register token against Supabase instead of Convex |
| `convex/notifications.ts` | DELETE | Superseded |

### Tasks
1. Port the Expo push logic from `convex/notifications.ts:53` — same title/body format, same
   `sound: "ringtone.mp3"`, same `channelId: "orders"`, same `DeviceNotRegistered` pruning.
2. Trigger on `orders` INSERT only. Function authenticates with the service-role key from
   Supabase secrets — never the client.
3. Batch the Expo request (Expo caps at 100 messages per call) and handle a non-2xx response
   explicitly rather than swallowing it.
4. Mobile registers its Expo token into `push_tokens` on login, and removes it on logout.

### Validate
```bash
supabase functions serve notify-new-order
# insert a test order, assert the Expo request payload
```

---

## Phase 4 — Mobile Data Layer Swap

### Files
| File | Action | Why |
|---|---|---|
| `mobile/lib/orders/types.ts` | CREATE | Domain `Order` type + Supabase row type |
| `mobile/lib/orders/mappers.ts` | CREATE | Pure `rowToOrder` / camelCase mapping — unit testable |
| `mobile/lib/orders/queries.ts` | CREATE | Query builders for active / history / date-range |
| `mobile/lib/orders/useOrders.ts` | CREATE | `useActiveOrders`, `useOrderHistory`, `useOrder`, `useSalesRange` with realtime + refetch |
| `mobile/lib/realtime.ts` | CREATE | Channel lifecycle: subscribe, AppState resume-refetch, connection status |
| `mobile/app/(tabs)/orders.tsx` | UPDATE | Swap `useQuery(api.orders…)` → `useActiveOrders()` |
| `mobile/app/(tabs)/history.tsx` | UPDATE | Swap to `useOrderHistory()` |
| `mobile/app/(tabs)/sales.tsx` | UPDATE | Swap to `useSalesRange()` |
| `mobile/app/order/[id].tsx` | UPDATE | Swap to `useOrder()` + Supabase status update |
| `mobile/app/(tabs)/_layout.tsx` | UPDATE | Pending badge from the new hook |
| `mobile/app/_layout.tsx` | UPDATE | Drop `ConvexClientProvider` |
| `mobile/lib/convex.tsx` | DELETE | Superseded |
| `mobile/app.json` | UPDATE | Remove stale `extra.CONVEX_URL` (defect #4) |
| `mobile/package.json` | UPDATE | `-convex`, `+@supabase/supabase-js` |

### Tasks
1. Mappers are pure and RN-free, mirroring `lib/sales.ts` — full unit coverage.
2. Hooks return `{data, isLoading, error, refetch}`. **Every** screen renders a real error state
   with a retry action (defect #6).
3. `mobile/lib/realtime.ts` handles the critical failure mode: a Postgres changes channel goes
   silent when Android backgrounds the app. On `AppState` → `active`, resubscribe and refetch,
   and expose `connectionStatus` so the UI can show a "Reconnecting…" banner.
4. New-order sound/haptic detection (`orders.tsx:59`) moves onto the realtime INSERT event
   instead of diffing an id set.
5. Status updates go through a single `updateOrderStatus` helper with optimistic UI + rollback.

### Validate
```bash
cd mobile && npx tsc --noEmit && npm test
```

---

## Phase 5 — Web Checkout Swap + Convex Retirement

### Files
| File | Action | Why |
|---|---|---|
| `src/lib/supabase.ts` | UPDATE | Add `orders` / `push_tokens` to the `Database` type |
| `src/hooks/useCreateOrder.ts` | CREATE | Supabase insert with validation + typed errors, mirroring `useMenu.ts` shape |
| `src/components/Checkout.tsx` | UPDATE | Use the new hook; remove the broken duplicate notification call; surface failures to the user |
| `scripts/migrate-convex-orders.ts` | CREATE | One-time export of Convex orders → Supabase insert |
| `convex/` | DELETE | Fully retired after migration |
| `src/lib/convex.ts`, `src/main.tsx` | UPDATE/DELETE | Remove ConvexProvider |
| `package.json` | UPDATE | Drop `convex` dependency |

### Tasks
1. Validate the checkout payload at the boundary before insert (totals, required fields per
   service type) and fail with a user-visible message. **Fixes defects #1 and #5.**
2. Migration script: read all Convex orders, map to Supabase rows preserving `order_number`
   and `created_at`, insert with conflict-skip so it is safely re-runnable.
3. Remove Convex only after the migration script has been run and verified.

### Validate
```bash
npm run build && npm run lint
node scripts/migrate-convex-orders.ts --dry-run
```

---

## Phase 6 — UI/UX Polish

Concrete gaps found in the current screens, in priority order.

| Area | Gap today | Change |
|---|---|---|
| Loading | Plain "Loading…" text on all 4 screens | Skeleton cards matching real layout |
| Errors | No error branch anywhere | Error state with cause + Retry on every screen |
| Refresh | No pull-to-refresh | `RefreshControl` on Orders / History / Sales |
| Speed | Status change costs 3 taps (card → detail → alert) | Swipe actions on `OrderCard` for the next status |
| Detail CTA | Primary action below the fold on long orders | Sticky bottom action bar |
| Urgency | Age is uniform grey text | Age chip shifts warning → danger past 10 / 20 min |
| Connection | Silent when realtime drops | "Reconnecting…" banner driven by `connectionStatus` |
| A11y | No `accessibilityLabel` / `accessibilityRole` anywhere | Labels + roles on all interactive elements |
| Touch targets | `Pill` ≈34pt tall (`ui.tsx:196`) | Raise to ≥44pt minimum |
| Empty states | Text only | Icon + copy + primary action |
| Haptics | Only on `Button` and new-order | Consistent across swipe, pull, status change |

### Files
`mobile/components/Skeleton.tsx`, `ErrorState.tsx`, `EmptyState.tsx`,
`ConnectionBanner.tsx`, `SwipeableOrderCard.tsx` (CREATE);
`ui.tsx`, `OrderCard.tsx`, `StatusBadge.tsx`, all 5 screens (UPDATE);
`lib/theme.ts` (UPDATE — add `touchTarget` and age-threshold tokens).

### Validate
```bash
cd mobile && npx tsc --noEmit && npm test && npx expo start
```

---

## Phase 7 — Testing to 80%

### Files
| File | Action | Why |
|---|---|---|
| `mobile/jest.config.js` | UPDATE | Add the `jest-expo` project alongside the existing node project |
| `mobile/package.json` | UPDATE | `+jest-expo`, `+@testing-library/react-native` |
| `mobile/__tests__/orders/mappers.test.ts` | CREATE | Row → domain mapping, jsonb edge cases |
| `mobile/__tests__/orders/statusFlow.test.ts` | CREATE | Status transition rules |
| `mobile/__tests__/realtime.test.ts` | CREATE | Resubscribe-on-foreground, connection status |
| `mobile/__tests__/components/*.test.tsx` | CREATE | `OrderCard`, `StatusBadge`, `ui` primitives, `Skeleton`, `ErrorState` |
| `mobile/__tests__/screens/*.test.tsx` | CREATE | Each screen's loading / error / empty / data states with a mocked Supabase transport |
| `supabase/tests/orders_rls.test.sql` | CREATE | anon can insert, anon cannot select; authenticated staff can read |

TDD order per phase: write the failing test, implement, refactor. Existing 26 tests must keep passing.

### Validate
```bash
cd mobile && npm run test:coverage    # ≥80% statements/branches
```

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RLS misconfiguration exposes customer PII to anon | Medium | Critical | Insert-only anon policy; explicit SQL tests asserting anon `select` returns zero rows; `security-reviewer` pass before merge |
| Realtime channel dies on background/network change | High | High | AppState resume-refetch, exponential-backoff resubscribe, visible connection banner, pull-to-refresh as manual escape hatch |
| Convex→Supabase migration drops or duplicates orders | Medium | High | Dry-run mode, `order_number` conflict-skip, row-count + revenue-total reconciliation before deleting Convex |
| Custom notification sound requires a dev build (not Expo Go) | High | Medium | Already true today; document the `eas build --profile development` step |
| Edge Function service-role key leakage | Low | Critical | Key lives only in Supabase secrets; function never echoes it; no client-side invocation path |
| Staff cannot log in after auth cutover | Medium | High | Create and verify accounts before switching the login screen; keep the migration behind one deploy |
| `jest-expo` preset conflicts with the existing node preset | Medium | Low | Use Jest `projects` so the two presets stay isolated |

## Blocking Prerequisites

1. **Supabase MCP is not authenticated** in this session — migrations must either be applied by
   the user (`supabase db push`) or the MCP connected first.
2. **Staff accounts** must be created in Supabase Auth before Phase 2 ships.
3. **`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`** need adding to `mobile/.env`.

## Acceptance

- [ ] Orders written by the website appear on mobile in under 2 seconds without a manual refresh
- [ ] A push notification with the custom ringtone fires on every new order
- [ ] Tapping the notification deep-links to the order detail screen
- [ ] Anon Supabase clients cannot read any order row (verified by SQL test)
- [ ] Every screen has a working loading, error, empty, and data state
- [ ] Realtime recovers automatically after backgrounding and network loss
- [ ] Mobile test coverage ≥80%; `npx tsc --noEmit` clean; web `npm run build` clean
- [ ] Convex is fully removed and historical orders are present in Supabase
