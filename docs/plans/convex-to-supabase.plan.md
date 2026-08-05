# Migration Plan — Orders: Convex → Supabase

**Status:** Draft for review. No code changes yet.
**Decisions taken:** consolidate on Supabase; **start fresh** (no backfill of existing Convex orders).

---

## 1. Why this migration

The repo currently runs two databases:

| Concern | Today | After |
|---|---|---|
| Menu catalog (categories, items, banners, bundles, upsells, serving prefs, variations, add-ons) | Supabase | Supabase |
| Orders | Convex | **Supabase** |
| Staff auth | Hardcoded string | **Supabase Auth** |
| Push tokens | Convex | **Supabase** |

Goal: one database, one auth model, one client library.

## 2. Blocking prerequisite — authentication

**This must be solved first. The migration is not safe without it.**

Current state:

- `mobile/app/login.tsx:15` and `convex/auth.ts:4` both hardcode `DonMacchiatos2026@`.
- The password is compared **client-side**; it ships in the app bundle and is in git history.
- Role (`staff` / `owner`) is picked by the user in the UI. Nothing verifies it.
- Every Convex function is publicly callable with only the deployment URL.

Why it blocks the move: RLS is the entire security model of a Supabase app, and RLS
policies key off `auth.uid()` / JWT claims. With no real identity, every policy
degrades to "allow anon", which exposes a Postgres table instead of a set of
functions — a net regression.

**Plan:**

1. Create real staff accounts in Supabase Auth (email + password). A handful of
   accounts, created by the owner — no self-signup.
2. Store role in a `staff_profiles` table keyed by `auth.uid()`, or as a custom
   JWT claim. Role comes from the server, never from the client.
3. Replace the mobile login screen with `supabase.auth.signInWithPassword`.
   Session persists via AsyncStorage (`@supabase/supabase-js` supports a custom
   storage adapter).
4. Delete `convex/auth.ts` and the hardcoded constants.
5. **Rotate the password.** Treat `DonMacchiatos2026@` as burned — it is in git
   history and in every shipped build.

Customer-facing web checkout stays anonymous: it needs INSERT on `orders` only.

## 3. Target schema

New migration `supabase/migrations/<ts>_create_orders.sql`.

```sql
create type order_status as enum
  ('pending','confirmed','preparing','ready','completed','cancelled');
create type service_type as enum ('dine-in','pickup','delivery');
create type payment_method as enum ('cash','gcash','bank-transfer','cards');

create table orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text unique not null,
  customer_name  text not null default '',
  contact_number text not null default '',
  service_type   service_type not null,
  address        text,
  pickup_time    text,
  payment_method payment_method not null,
  reference_number text,
  items          jsonb not null,
  bundle_items   jsonb,
  notes          text,
  total          numeric(10,2) not null check (total >= 0),
  status         order_status not null default 'pending',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz            -- set when status becomes closed
);

create index orders_status_idx on orders (status);
create index orders_created_at_idx on orders (created_at desc);
create index orders_completed_at_idx on orders (completed_at desc);

create table push_tokens (
  token      text primary key,
  role       text not null check (role in ('staff','owner')),
  created_at timestamptz not null default now()
);
```

**Decisions embedded above:**

- `items` / `bundle_items` stay **JSONB**, mirroring the current Convex shape. A
  normalised `order_items` table is the textbook answer, but these are immutable
  historical snapshots — the price and options must not change when the menu
  changes later. JSONB is correct here and keeps the port mechanical.
- `completed_at` is carried over from the History fix already landed on this
  branch (commits `44f36b0` / `4c23e0c`). Same semantics.
- `numeric(10,2)` for money, not float.
- Enums instead of free-text status, which the current Convex validators
  approximate with string unions.

### Order number race — fix during the move

`convex/orders.ts:70-76` generates order numbers by counting today's orders in JS.
Two simultaneous checkouts produce the same `ORD-YYYYMMDD-001`. Postgres fixes
this properly:

```sql
create sequence order_number_seq;

create or replace function next_order_number() returns text
language sql volatile as $$
  select 'ORD-' || to_char(now() at time zone 'Asia/Manila', 'YYYYMMDD')
      || '-' || lpad(nextval('order_number_seq')::text, 3, '0');
$$;
```

A daily-resetting counter needs a small `order_counters(day, n)` table with
`insert … on conflict do update … returning n` — atomic in one statement. Decide
which is wanted: strictly-daily numbering, or a monotonic sequence.

## 4. Row Level Security

```sql
alter table orders enable row level security;
alter table push_tokens enable row level security;

-- Customers (anon, web checkout): create orders only.
create policy "anon can create orders"
  on orders for insert to anon with check (true);

-- Staff: read and advance orders.
create policy "staff read orders"
  on orders for select to authenticated using (true);
create policy "staff update order status"
  on orders for update to authenticated using (true) with check (true);

-- Nobody deletes orders.
```

Note: `anon` gets INSERT but **not** SELECT — a customer must not be able to read
other people's orders. If the web app needs to show an order confirmation after
checkout, return the row from the insert (`.select().single()`) rather than
granting SELECT.

Push tokens: `authenticated` only, insert/update/delete own token.

## 5. Real-time — the main rewrite

This is the highest-risk part. Convex reactivity is automatic:
`useQuery(api.orders.getActiveOrders)` re-renders whenever any matching row
changes, which is what drives the new-order sound and haptic in
`mobile/app/(tabs)/orders.tsx:70-92`.

Supabase Realtime is manual and needs an explicit design:

1. `alter publication supabase_realtime add table orders;`
2. A `useActiveOrders()` hook that:
   - fetches the initial snapshot via `select`,
   - subscribes to `postgres_changes` on `orders`,
   - merges INSERT / UPDATE / DELETE into local state immutably,
   - **refetches on reconnect** — Realtime does not replay events missed while
     the socket was down, and a cafe tablet on flaky wifi *will* miss events.
     This is the single most likely source of "an order never showed up".
3. Keep the existing new-order detection (`prevOrderIdsRef`) — it works off the
   order list and is agnostic to how the list arrives.

Recommendation: build this hook first, in isolation, and verify it on-device with
the network toggled off and on before porting any screen.

## 6. Push notifications

`convex/notifications.ts:49` is a Convex `action` scheduled from inside
`createOrder` via `ctx.scheduler.runAfter(0, …)`.

Supabase equivalent: a **Database Webhook** on `orders` INSERT → **Edge Function**
that reads `push_tokens`, POSTs to `https://exp.host/--/api/v2/push/send`, and
prunes `DeviceNotRegistered` tokens. Logic ports over almost verbatim.

- The Edge Function uses the **service-role key** (server-side only, never in the
  app bundle) so it can read all tokens under RLS.
- Requires `supabase functions deploy` and secrets configuration — a new
  deployment step this repo does not currently have.

## 7. Code changes

| File | Change |
|---|---|
| `supabase/migrations/<ts>_create_orders.sql` | new — schema, indexes, RLS, order-number fn |
| `supabase/functions/notify-new-order/` | new — Edge Function for Expo push |
| `src/lib/supabase.ts` | add `orders` / `push_tokens` to the `Database` type |
| `src/components/Checkout.tsx` | `useMutation(api.orders.createOrder)` → `supabase.from('orders').insert()` |
| `src/main.tsx` | drop `ConvexProvider` |
| `src/lib/convex.ts` | delete |
| `mobile/lib/supabase.ts` | new — client with AsyncStorage session adapter |
| `mobile/lib/convex.tsx` | delete |
| `mobile/lib/useActiveOrders.ts` | new — realtime hook (§5) |
| `mobile/lib/orderRepo.ts` | new — queries/mutations behind one module |
| `mobile/app/_layout.tsx` | swap provider |
| `mobile/app/login.tsx` | real Supabase Auth sign-in; delete hardcoded password |
| `mobile/app/(tabs)/orders.tsx` | use `useActiveOrders` |
| `mobile/app/(tabs)/history.tsx` | query completed orders from Supabase |
| `mobile/app/(tabs)/sales.tsx` | date-range query from Supabase |
| `mobile/app/order/[id].tsx` | status updates via Supabase |
| `convex/` | delete entire directory (last step) |
| `package.json`, `mobile/package.json` | drop `convex` dependency |

**Carries over unchanged:** `convex/lib/orderHistory.ts` is pure and
database-agnostic — the closing-time logic and all 16 tests move to
`mobile/lib/orderHistory.ts` with only an import-path change. Same for
`mobile/lib/sales.ts` and `mobile/lib/format.ts`.

## 8. Sequence

Each phase ends green and independently reviewable. TDD throughout: pure logic
(mappers, realtime reducer, history selection) gets tests first; screens and RLS
are verified on-device and via SQL respectively.

1. **Auth foundation** — Supabase Auth, `staff_profiles`, mobile login rewrite.
   Rotate the burned password. *Nothing else can land safely before this.*
2. **Schema** — orders + push_tokens migration, RLS, order-number function.
   Verify policies with SQL as `anon` and as `authenticated`.
3. **Realtime hook** — `useActiveOrders` in isolation; test the reconnect path
   with the network physically toggled.
4. **Mobile read paths** — orders, history, sales. Port `orderHistory.ts` tests.
5. **Write paths** — status updates, order detail.
6. **Web checkout** — `Checkout.tsx` insert; confirm order numbers under
   concurrent submits.
7. **Push** — Edge Function + webhook; verify on a real device.
8. **Cutover** — see below.
9. **Teardown** — delete `convex/`, drop the dependency, remove env vars.

## 9. Cutover

Since we start fresh, both systems briefly coexist and the switch is a deploy.

- **Cut over after close of business.** Orders in flight at switchover are the
  only real hazard: they live in Convex and will not appear in the new app.
  Switching when the queue is empty removes the problem entirely.
- Keep the Convex deployment alive, read-only, for a couple of weeks — it is the
  only copy of historical orders once the app stops reading it.
- Export a JSON snapshot of existing Convex orders before teardown regardless.
  Cheap insurance; "start fresh" is a decision about the *app*, not a reason to
  destroy records.
- Sales figures reset to zero on cutover. Confirm the owner expects this.

## 10. Open questions

1. **Order numbering** — strict daily reset (`ORD-20260805-001`) or a monotonic
   sequence? Daily reset needs the counter table in §3.
2. **Staff accounts** — how many, and who administers them? Email/password, or
   magic link on shared devices?
3. **Order confirmation on web** — does the customer need to see their order
   after checkout? Determines whether `anon` needs any read path.
4. **Timezone** — `Asia/Manila` assumed for order-number dates and History
   day boundaries. The current mobile code uses device-local time.
5. **Sales history reset** — acceptable to the owner?

## 11. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Missed realtime events on flaky wifi → an order never appears | **High** | Refetch-on-reconnect in `useActiveOrders`; verify by toggling network on-device |
| RLS misconfigured → orders publicly readable | **High** | Auth first; test policies as `anon` before cutover |
| Push webhook fails silently | Medium | Log failures in the Edge Function; do not let push failure block order creation (current code already treats push as best-effort) |
| Order number collision under load | Medium | Sequence/counter in §3 — fixes a bug that exists today |
| Two systems live simultaneously | Medium | Cut over with an empty queue, after hours |
