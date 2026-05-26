# Convex Order Management + Expo Mobile App — Design Spec

## Overview

Add a Convex real-time database for order persistence, and build an Expo mobile app for staff/owner to manage orders with push notifications and audio alerts.

## Goals

- Persist all customer orders in Convex (currently orders only go to Messenger)
- Real-time order dashboard on a mobile app for staff
- Push notifications + audio alert on new orders (Android)
- Sales summary for the owner (daily/weekly/monthly, by service type and payment method)
- Keep existing Messenger redirect as a communication channel

## Non-Goals

- Customer-facing mobile app or order tracking
- Manual order creation from mobile app
- Full authentication system (simple hardcoded password)
- Payment processing

---

## Convex Schema

### `orders` table

| Field | Type | Description |
|-------|------|-------------|
| orderNumber | string | Auto-generated e.g. "ORD-20260404-001" |
| customerName | string | Customer's name |
| contactNumber | string | Phone number |
| serviceType | string | "dine-in" / "pickup" / "delivery" |
| address | string (optional) | Delivery address |
| pickupTime | string (optional) | Pickup time selection |
| paymentMethod | string | "cash" / "gcash" / "bank-transfer" / "cards" |
| referenceNumber | string (optional) | Payment reference |
| items | array of objects | Cart items with name, qty, price, variations, add-ons |
| bundleItems | array of objects (optional) | Bundle items |
| notes | string (optional) | Special instructions |
| total | number | Order total |
| status | string | "pending" → "confirmed" → "preparing" → "ready" → "completed" / "cancelled" |
| createdAt | number | Timestamp |
| updatedAt | number | Timestamp |

### `pushTokens` table

| Field | Type | Description |
|-------|------|-------------|
| token | string | Expo push token |
| role | string | "staff" or "owner" |
| createdAt | number | Timestamp |

---

## Order Status Flow

```
pending → confirmed → preparing → ready → completed
                                       ↘ cancelled (from any status)
```

---

## Web App Changes

### Checkout.tsx modification

1. Before Messenger redirect, call Convex `createOrder` mutation
2. If Convex save fails, still redirect to Messenger (graceful degradation)
3. No other web app changes needed

### New dependencies

- `convex` package added to web app

### Environment variables

- `VITE_CONVEX_URL=https://outgoing-caribou-63.convex.cloud`

---

## Convex Backend

Lives at repo root in `convex/` directory, shared by web and mobile apps.

### Files

- `schema.ts` — orders + pushTokens table definitions
- `orders.ts` — mutations: createOrder, updateOrderStatus; queries: getActiveOrders, getOrdersByDateRange, getOrderById
- `auth.ts` — simple password validation query (hardcoded password: DonMacchiatos2026@)
- `notifications.ts` — action that sends Expo push notifications to all registered tokens

### Order creation flow

```
Customer submits checkout
  → Convex createOrder mutation saves order (status: "pending")
  → Convex action sends Expo push notification to all registered push tokens
  → Web app redirects to Messenger (existing behavior)
```

---

## Expo Mobile App

### Tech stack

- Expo SDK 53, Expo Router (file-based routing)
- `convex` + `convex-react` for real-time data
- `expo-notifications` for push notifications
- `expo-av` for audio playback (new order alert)
- `@react-native-async-storage/async-storage` for persisting login

### Project location

```
beracah-cafe/mobile/
```

### Screens

| Screen | Route | Access | Description |
|--------|-------|--------|-------------|
| Login | `login.tsx` | All | Single password field, validates against hardcoded password |
| Orders Dashboard | `(tabs)/orders.tsx` | Staff + Owner | Live list of active orders grouped by status |
| Order Detail | `order/[id].tsx` | Staff + Owner | Full customer details, items, status update buttons |
| Order History | `(tabs)/history.tsx` | Staff + Owner | Completed/cancelled orders, date filter, search |
| Sales Summary | `(tabs)/sales.tsx` | Owner only | Daily/weekly/monthly totals, service type & payment method breakdown |

### Authentication

- Single hardcoded password: `DonMacchiatos2026@`
- On login, user selects role: "staff" or "owner"
- Role stored in AsyncStorage, determines access to Sales tab
- No backend auth — just local gate

### Real-time behavior

- Convex `useQuery` subscriptions keep orders list live
- App tracks order IDs — when a new ID appears, plays audio alert
- Push notifications arrive even when app is backgrounded

### Push notifications

- On login, register Expo push token with Convex (`pushTokens` table)
- On logout or token refresh, update/remove token
- Convex action on new order: POST to `https://exp.host/--/api/v2/push/send` with all registered tokens
- Notification payload: title, order number, customer name, total amount

### Audio alert

- Play bundled sound file (`assets/sounds/new-order.mp3`) when new order detected in foreground
- Uses `expo-av` Audio API

### Sales summary

- Query orders by date range from Convex
- Client-side aggregation:
  - Total revenue and order count for selected period
  - Breakdown by service type (dine-in / pickup / delivery)
  - Breakdown by payment method (cash / gcash / bank-transfer / cards)
- Period selector: today / this week / this month

---

## Project Structure

```
beracah-cafe/
├── src/                          # Existing web app
├── convex/                       # Convex backend (shared)
│   ├── _generated/
│   ├── schema.ts
│   ├── orders.ts
│   ├── auth.ts
│   └── notifications.ts
├── mobile/                       # Expo app
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── orders.tsx
│   │   │   ├── history.tsx
│   │   │   └── sales.tsx
│   │   └── order/[id].tsx
│   ├── components/
│   │   ├── OrderCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── SalesSummaryCard.tsx
│   ├── lib/
│   │   ├── convex.tsx
│   │   └── notifications.ts
│   ├── assets/
│   │   └── sounds/
│   │       └── new-order.mp3
│   ├── app.json
│   └── package.json
└── package.json
```

---

## Notification Payload

```json
{
  "to": "<expo_push_token>",
  "title": "New Order!",
  "body": "Order #ORD-20260404-001 from John - PHP 350.00",
  "sound": "default",
  "data": { "orderId": "<convex_document_id>" }
}
```

---

## Error Handling

- **Web app Convex failure:** Order still goes to Messenger. Console warning logged.
- **Push notification failure:** Logged but doesn't block order creation. Stale tokens cleaned up on 410 response.
- **Mobile offline:** Convex client caches last known state, resumes sync on reconnect.
