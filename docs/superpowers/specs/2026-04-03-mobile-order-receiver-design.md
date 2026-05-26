# Mobile Order Receiver App — Design Spec

## Overview

A staff-facing Expo mobile app for Beracah Cafe that receives and manages customer orders in real-time. Convex replaces the current Messenger redirect as the order backend. The existing web app gets minimal changes — only the checkout submission is swapped.

## Architecture

```
Customer (web app) → Convex mutation (createOrder) → Convex DB
                                                        ↓
Staff (Expo mobile app) ← Convex real-time subscription ←
```

- **Web app**: Existing Vite/React app. Supabase stays for menu/categories/upsells/bundles/banners. Only checkout changes to submit orders to Convex instead of Messenger.
- **Convex**: Handles orders only. Single `orders` table. Real-time subscriptions for the mobile app.
- **Mobile app**: New Expo project. Connects to Convex for order management. Hardcoded auth.

## Convex Schema

### `orders` table

| Field | Type | Notes |
|-------|------|-------|
| customerName | string | Required |
| phone | string | Required |
| serviceType | string | "dine-in", "pickup", or "delivery" |
| address | string (optional) | Only for delivery |
| pickupTime | string (optional) | Only for pickup |
| paymentMethod | string | "cash", "gcash", or "card" |
| items | array | Each: { name, quantity, price, variation?, servingPreference?, addOns[] } |
| bundles | array | Each: { name, quantity, price, items[] } |
| subtotal | number | Pre-total |
| total | number | Final amount |
| notes | string (optional) | Customer notes |
| status | string | "new", "preparing", "ready", "completed", "cancelled" |
| createdAt | number | Timestamp |
| updatedAt | number | Timestamp |

### Convex Functions

| Function | Type | Purpose |
|----------|------|---------|
| `createOrder` | mutation | Web app submits a new order |
| `updateOrderStatus` | mutation | Staff changes order status |
| `getActiveOrders` | query | Real-time: orders with status new/preparing/ready |
| `getCompletedOrders` | query | Real-time: today's completed/cancelled orders |
| `getOrder` | query | Single order by ID |

## Mobile App (Expo)

### Tech Stack

- Expo SDK (managed workflow)
- Convex React Native client
- Expo Notifications (push notifications)
- Expo Audio (sound alert on new order)
- AsyncStorage (persist login state)
- React Navigation (screen routing)

### Authentication

Hardcoded single account:
- Username: `admin`
- Password: `beracah2024`
- Login state persisted in AsyncStorage
- No backend auth — purely client-side gate

### Screens

#### 1. Login Screen
- Username + password fields
- Validates against hardcoded credentials
- Stores auth flag in AsyncStorage so user stays logged in
- Logout button on main screen clears the flag

#### 2. Orders Screen (main)
- Two tabs: **Active** and **Completed**
- **Active tab**: Orders with status new/preparing/ready, sorted newest first
- **Completed tab**: Today's completed and cancelled orders
- Each order card shows:
  - Customer name
  - Service type icon/label (dine-in, pickup, delivery)
  - Item count
  - Total price
  - Time elapsed since order (e.g., "3m ago")
  - Color-coded status badge:
    - Red = new
    - Orange = preparing
    - Green = ready
    - Gray = completed/cancelled
- New orders animate in with a sound alert
- Pull-to-refresh as fallback (Convex real-time is primary)

#### 3. Order Detail Screen
- Full item list with:
  - Item name, quantity, price
  - Selected variation (size)
  - Serving preference (hot/iced)
  - Add-ons with prices
- Bundle details (bundle name, included items, bundle price)
- Customer info: name, phone (tappable to call), address (if delivery)
- Payment method
- Customer notes
- Order timestamp
- Action buttons:
  - Status progression: "Start Preparing" → "Mark Ready" → "Complete"
  - "Cancel Order" button (with confirmation dialog)
  - Buttons reflect current status (e.g., if already preparing, show "Mark Ready")

### Notifications

- **Sound alert**: Play a notification sound when a new order appears while app is in foreground
- **Push notifications**: Expo Notifications for background alerts when new orders arrive
  - Requires an Expo push notification setup
  - Convex can trigger push via an action or HTTP endpoint

## Web App Changes

Only two files change in the existing web app:

### 1. `App.tsx`
- Add ConvexProvider wrapping the app (alongside existing components)
- Convex client initialized with deployment URL

### 2. `Checkout.tsx`
- Remove Messenger redirect logic (the `messenger.com/t/` URL construction and clipboard fallback)
- Replace with a Convex `createOrder` mutation call
- On success: show a confirmation screen ("Order placed successfully!")
- Order data shape matches the Convex schema above
- All existing checkout UI (customer info, service type, payment) stays the same

### New files in web app
- `src/lib/convex.ts` — Convex client setup
- `convex/` directory — schema and function files (shared between web and mobile)

## Order Status Flow

```
New → Preparing → Ready → Completed
        ↘
      Cancelled
```

- Orders start as "new" when submitted from web
- Staff can only move forward in the flow (no going back from "preparing" to "new")
- Cancel is available from any active status (new, preparing, ready)
- Completed and cancelled are terminal states

## Project Structure (Mobile App)

```
beracah-cafe-mobile/
├── app.json                  # Expo config
├── App.tsx                   # Entry: ConvexProvider + Navigation
├── convex/                   # Shared Convex functions (symlink or copy)
│   ├── schema.ts
│   ├── orders.ts
│   └── _generated/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   └── OrderDetailScreen.tsx
│   ├── components/
│   │   ├── OrderCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ActionButtons.tsx
│   ├── constants/
│   │   └── auth.ts           # Hardcoded credentials
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useNewOrderAlert.ts
│   └── lib/
│       └── notifications.ts  # Push notification setup
├── assets/
│   └── sounds/
│       └── new-order.mp3
└── package.json
```

## Shared Convex Project

Both the web app and the mobile app connect to the **same Convex deployment**. The Convex backend (schema + functions) lives in the web app repo under `convex/`. The mobile app references the same Convex deployment URL. This means:

- One Convex project, one `orders` table
- Web app writes orders, mobile app reads/updates them
- Both apps share the same deployment URL (set via environment variable)

## Out of Scope for v1

- Customer-facing mobile ordering
- Order history beyond today
- Multiple staff accounts / roles
- Analytics or reporting
- Printer integration
- Delivery tracking
