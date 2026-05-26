# Convex Order Management + Expo Mobile App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Convex real-time database for order persistence, integrate it into the existing web checkout, and build an Expo mobile app for staff/owner order management with push notifications.

**Architecture:** Convex backend (`convex/` at repo root) shared by both the Vite web app and new Expo mobile app. Web app saves orders to Convex before Messenger redirect. Mobile app subscribes to Convex real-time queries for live order updates and receives Expo push notifications with audio alerts on new orders.

**Tech Stack:** Convex (real-time DB), Expo SDK 53 + Expo Router (mobile), expo-notifications (push), expo-av (audio), AsyncStorage (auth persistence)

**Spec:** `docs/superpowers/specs/2026-04-04-convex-order-management-design.md`

---

## File Structure

### Convex Backend (new files at repo root)

| File | Responsibility |
|------|---------------|
| `convex/schema.ts` | Table definitions for `orders` and `pushTokens` |
| `convex/orders.ts` | Mutations (createOrder, updateOrderStatus, cancelOrder) and queries (getActiveOrders, getOrderById, getOrdersByDateRange) |
| `convex/auth.ts` | Simple password validation query |
| `convex/notifications.ts` | Action to send Expo push notifications |

### Web App (modified files)

| File | Change |
|------|--------|
| `.env` | Add `VITE_CONVEX_URL` |
| `package.json` | Add `convex` dependency |
| `src/lib/convex.ts` | New — Convex client setup |
| `src/main.tsx` | Wrap app in ConvexProvider |
| `src/components/Checkout.tsx` | Call Convex createOrder before Messenger redirect |

### Expo Mobile App (all new under `mobile/`)

| File | Responsibility |
|------|---------------|
| `mobile/package.json` | Expo dependencies |
| `mobile/app.json` | Expo config with notification settings |
| `mobile/tsconfig.json` | TypeScript config |
| `mobile/app/_layout.tsx` | Root layout, ConvexProvider, auth gate |
| `mobile/app/login.tsx` | Login screen with password + role selection |
| `mobile/app/(tabs)/_layout.tsx` | Tab navigator (Orders, History, Sales) |
| `mobile/app/(tabs)/orders.tsx` | Live active orders dashboard |
| `mobile/app/(tabs)/history.tsx` | Completed/cancelled orders with date filter |
| `mobile/app/(tabs)/sales.tsx` | Sales summary (owner only) |
| `mobile/app/order/[id].tsx` | Order detail with status update buttons |
| `mobile/components/OrderCard.tsx` | Order card for list views |
| `mobile/components/StatusBadge.tsx` | Colored status badge |
| `mobile/components/SalesSummaryCard.tsx` | Stats card for sales screen |
| `mobile/lib/convex.tsx` | ConvexProvider wrapper for mobile |
| `mobile/lib/notifications.ts` | Push notification registration + audio alert |
| `mobile/lib/auth.ts` | Auth context with AsyncStorage |

---

## Task 1: Convex Backend Setup

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/tsconfig.json`
- Modify: `package.json` (add convex dependency)
- Modify: `.env` (add Convex URL)

- [ ] **Step 1: Install Convex in the web app**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe
npm install convex
```

- [ ] **Step 2: Add Convex environment variables to `.env`**

Append to the existing `.env` file:

```
VITE_CONVEX_URL=https://outgoing-caribou-63.convex.cloud
```

- [ ] **Step 3: Create `convex/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ES2021", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["./**/*.ts", "./**/*.tsx"]
}
```

- [ ] **Step 4: Create `convex/schema.ts` with orders and pushTokens tables**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    orderNumber: v.string(),
    customerName: v.string(),
    contactNumber: v.string(),
    serviceType: v.union(
      v.literal("dine-in"),
      v.literal("pickup"),
      v.literal("delivery")
    ),
    address: v.optional(v.string()),
    pickupTime: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("gcash"),
      v.literal("bank-transfer"),
      v.literal("cards")
    ),
    referenceNumber: v.optional(v.string()),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        totalPrice: v.number(),
        variations: v.optional(
          v.array(v.object({ type: v.string(), name: v.string() }))
        ),
        servingPreference: v.optional(v.string()),
        addOns: v.optional(v.array(v.string())),
      })
    ),
    bundleItems: v.optional(
      v.array(
        v.object({
          bundleName: v.string(),
          quantity: v.number(),
          bundlePrice: v.number(),
          items: v.array(
            v.object({
              name: v.string(),
              variations: v.optional(
                v.array(v.object({ type: v.string(), name: v.string() }))
              ),
              servingPreference: v.optional(v.string()),
              addOns: v.optional(v.array(v.string())),
            })
          ),
        })
      )
    ),
    notes: v.optional(v.string()),
    total: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  pushTokens: defineTable({
    token: v.string(),
    role: v.union(v.literal("staff"), v.literal("owner")),
    createdAt: v.number(),
  }).index("by_token", ["token"]),
});
```

- [ ] **Step 5: Push schema to Convex**

```bash
npx convex dev --once
```

Expected: Convex generates `convex/_generated/` files and deploys the schema.

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/tsconfig.json package.json package-lock.json .env
git commit -m "feat: add Convex schema for orders and push tokens"
```

---

## Task 2: Convex Order Functions

**Files:**
- Create: `convex/orders.ts`

- [ ] **Step 1: Create `convex/orders.ts` with createOrder mutation**

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    contactNumber: v.string(),
    serviceType: v.union(
      v.literal("dine-in"),
      v.literal("pickup"),
      v.literal("delivery")
    ),
    address: v.optional(v.string()),
    pickupTime: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("gcash"),
      v.literal("bank-transfer"),
      v.literal("cards")
    ),
    referenceNumber: v.optional(v.string()),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        totalPrice: v.number(),
        variations: v.optional(
          v.array(v.object({ type: v.string(), name: v.string() }))
        ),
        servingPreference: v.optional(v.string()),
        addOns: v.optional(v.array(v.string())),
      })
    ),
    bundleItems: v.optional(
      v.array(
        v.object({
          bundleName: v.string(),
          quantity: v.number(),
          bundlePrice: v.number(),
          items: v.array(
            v.object({
              name: v.string(),
              variations: v.optional(
                v.array(v.object({ type: v.string(), name: v.string() }))
              ),
              servingPreference: v.optional(v.string()),
              addOns: v.optional(v.array(v.string())),
            })
          ),
        })
      )
    ),
    notes: v.optional(v.string()),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate order number: ORD-YYYYMMDD-XXX
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");

    // Count today's orders for sequential numbering
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const todaysOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", startOfDay))
      .collect();
    const orderNum = (todaysOrders.length + 1).toString().padStart(3, "0");
    const orderNumber = `ORD-${dateStr}-${orderNum}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      customerName: args.customerName,
      contactNumber: args.contactNumber,
      serviceType: args.serviceType,
      address: args.address,
      pickupTime: args.pickupTime,
      paymentMethod: args.paymentMethod,
      referenceNumber: args.referenceNumber,
      items: args.items,
      bundleItems: args.bundleItems,
      notes: args.notes,
      total: args.total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getActiveOrders = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return orders.filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
  },
});

export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getOrdersByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", args.startTime).lte("createdAt", args.endTime)
      )
      .order("desc")
      .collect();
  },
});

export const getCompletedOrders = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("orders")
      .withIndex("by_createdAt");

    if (args.startTime !== undefined && args.endTime !== undefined) {
      q = ctx.db
        .query("orders")
        .withIndex("by_createdAt", (idx) =>
          idx.gte("createdAt", args.startTime!).lte("createdAt", args.endTime!)
        );
    }

    const orders = await q.order("desc").collect();
    return orders.filter((o) =>
      ["completed", "cancelled"].includes(o.status)
    );
  },
});
```

- [ ] **Step 2: Deploy to Convex**

```bash
npx convex dev --once
```

Expected: Functions deployed successfully.

- [ ] **Step 3: Commit**

```bash
git add convex/orders.ts
git commit -m "feat: add Convex order mutations and queries"
```

---

## Task 3: Convex Auth & Notifications

**Files:**
- Create: `convex/auth.ts`
- Create: `convex/notifications.ts`

- [ ] **Step 1: Create `convex/auth.ts`**

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

const VALID_PASSWORD = "DonMacchiatos2026@";

export const validatePassword = query({
  args: { password: v.string() },
  handler: async (_ctx, args) => {
    return args.password === VALID_PASSWORD;
  },
});
```

- [ ] **Step 2: Create `convex/notifications.ts`**

```typescript
import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const registerPushToken = mutation({
  args: {
    token: v.string(),
    role: v.union(v.literal("staff"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    // Check if token already exists
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("pushTokens", {
      token: args.token,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const removePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const sendNewOrderNotification = action({
  args: {
    orderNumber: v.string(),
    customerName: v.string(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all registered push tokens
    const tokens = await ctx.runQuery(api.notifications.getAllPushTokens);

    if (tokens.length === 0) return;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: "New Order!",
      body: `Order ${args.orderNumber} from ${args.customerName || "Customer"} - PHP ${args.total.toFixed(2)}`,
      sound: "default",
      data: { orderNumber: args.orderNumber },
    }));

    // Send via Expo Push API
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      // Clean up invalid tokens (410 = token no longer valid)
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          if (
            result.data[i].status === "error" &&
            result.data[i].details?.error === "DeviceNotRegistered"
          ) {
            await ctx.runMutation(api.notifications.removePushToken, {
              token: tokens[i].token,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  },
});

export const getAllPushTokens = query({
  handler: async (ctx) => {
    return await ctx.db.query("pushTokens").collect();
  },
});
```

- [ ] **Step 3: Deploy to Convex**

```bash
npx convex dev --once
```

Expected: Auth and notification functions deployed.

- [ ] **Step 4: Commit**

```bash
git add convex/auth.ts convex/notifications.ts
git commit -m "feat: add Convex auth validation and push notification action"
```

---

## Task 4: Web App Convex Integration

**Files:**
- Create: `src/lib/convex.ts`
- Modify: `src/main.tsx`
- Modify: `src/components/Checkout.tsx`

- [ ] **Step 1: Create `src/lib/convex.ts`**

```typescript
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const convex = new ConvexReactClient(convexUrl);
```

- [ ] **Step 2: Read and modify `src/main.tsx` to wrap app in ConvexProvider**

Read `src/main.tsx` first, then wrap the `<App />` component:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Modify `src/components/Checkout.tsx` to save order to Convex**

Add Convex import and mutation call at the top:

```typescript
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
```

Inside the component, add:

```typescript
const createOrder = useMutation(api.orders.createOrder);
const sendNotification = useAction(api.notifications.sendNewOrderNotification);
```

Modify `handlePlaceOrder` to save to Convex before the Messenger redirect. Insert this block **before** the `window.location.href` line (before line 109 in current file):

```typescript
    // Save order to Convex
    try {
      const convexItems = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        variations: item.selectedVariations?.map((v) => ({
          type: v.type,
          name: v.name,
        })),
        servingPreference: item.selectedServingPreference?.name,
        addOns: item.selectedAddOns?.map((a) => a.name),
      }));

      const convexBundleItems = bundleCartItems.map((bundle) => ({
        bundleName: bundle.bundleName,
        quantity: bundle.quantity,
        bundlePrice: bundle.bundlePrice,
        items: bundle.items.map((item) => ({
          name: item.name,
          variations: item.selectedVariations?.map((v) => ({
            type: v.type,
            name: v.name,
          })),
          servingPreference: item.selectedServingPreference?.name,
          addOns: item.selectedAddOns?.map((a) => a.name),
        })),
      }));

      const result = await createOrder({
        customerName,
        contactNumber,
        serviceType,
        address: serviceType === "delivery" ? address : undefined,
        pickupTime:
          serviceType === "pickup"
            ? pickupTime === "custom"
              ? customTime
              : `${pickupTime} minutes`
            : undefined,
        paymentMethod,
        items: convexItems,
        bundleItems:
          convexBundleItems.length > 0 ? convexBundleItems : undefined,
        notes: notes || undefined,
        total: totalPrice,
      });

      // Send push notification (fire and forget)
      sendNotification({
        orderNumber: result.orderNumber,
        customerName,
        total: totalPrice,
      }).catch(() => {});
    } catch (error) {
      console.warn("Failed to save order to Convex:", error);
    }
```

- [ ] **Step 4: Deploy Convex and test web checkout**

```bash
npx convex dev --once
npm run dev
```

Open the web app, add items to cart, go through checkout. Verify in Convex dashboard that the order appears in the `orders` table.

- [ ] **Step 5: Commit**

```bash
git add src/lib/convex.ts src/main.tsx src/components/Checkout.tsx
git commit -m "feat: integrate Convex order creation into web checkout"
```

---

## Task 5: Expo Mobile App Scaffold

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/.env`

- [ ] **Step 1: Create the Expo app**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe
npx create-expo-app@latest mobile --template blank-typescript
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile
npx expo install expo-router expo-notifications expo-av expo-constants expo-device expo-linking expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler @react-native-async-storage/async-storage convex react-native-reanimated
```

- [ ] **Step 3: Update `mobile/app.json`**

Read the generated `mobile/app.json` and update it to:

```json
{
  "expo": {
    "name": "Don Macchiatos Orders",
    "slug": "don-macchiatos-orders",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "donmacchiatos",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "backgroundColor": "#1a1a1a"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#1a1a1a"
      },
      "package": "com.donmacchiatos.orders",
      "useNextNotificationsApi": true
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "sounds": ["./assets/sounds/new-order.wav"]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "CONVEX_URL": "https://outgoing-caribou-63.convex.cloud"
    }
  }
}
```

- [ ] **Step 4: Create `mobile/.env`**

```
EXPO_PUBLIC_CONVEX_URL=https://outgoing-caribou-63.convex.cloud
```

- [ ] **Step 5: Add a placeholder notification sound**

```bash
mkdir -p /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile/assets/sounds
# We'll generate a simple notification sound or download one later
# For now create the directory structure
```

- [ ] **Step 6: Commit**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe
git add mobile/
git commit -m "feat: scaffold Expo mobile app with dependencies"
```

---

## Task 6: Mobile Auth Context

**Files:**
- Create: `mobile/lib/auth.ts`

- [ ] **Step 1: Create `mobile/lib/auth.ts`**

```typescript
import { createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "donmac_auth";

export type UserRole = "staff" | "owner";

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
}

export async function saveAuth(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ role }));
}

export async function loadAuth(): Promise<{ role: UserRole } | null> {
  const data = await AsyncStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 2: Commit**

```bash
git add mobile/lib/auth.ts
git commit -m "feat: add mobile auth context with AsyncStorage persistence"
```

---

## Task 7: Mobile Convex Provider & Notification Helpers

**Files:**
- Create: `mobile/lib/convex.tsx`
- Create: `mobile/lib/notifications.ts`

- [ ] **Step 1: Create `mobile/lib/convex.tsx`**

```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

- [ ] **Step 2: Create `mobile/lib/notifications.ts`**

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Audio } from "expo-av";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permission for push notifications not granted");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "New Orders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "new-order.wav",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Uses the project ID from app.json
  });

  return tokenData.data;
}

let sound: Audio.Sound | null = null;

export async function playNewOrderSound(): Promise<void> {
  try {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      require("../assets/sounds/new-order.wav")
    );
    sound = newSound;
    await sound.playAsync();
  } catch (error) {
    console.warn("Failed to play notification sound:", error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/lib/convex.tsx mobile/lib/notifications.ts
git commit -m "feat: add mobile Convex provider and notification helpers"
```

---

## Task 8: Mobile Root Layout & Login Screen

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/login.tsx`

- [ ] **Step 1: Create `mobile/app/_layout.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexClientProvider } from "../lib/convex";
import {
  AuthContext,
  AuthContextType,
  UserRole,
  loadAuth,
  saveAuth,
  clearAuth,
} from "../lib/auth";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth().then((data) => {
      if (data) {
        setIsAuthenticated(true);
        setRole(data.role);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/orders");
    }
  }, [isAuthenticated, segments, isLoading]);

  const authContext: AuthContextType = {
    isAuthenticated,
    role,
    login: async (selectedRole: UserRole) => {
      await saveAuth(selectedRole);
      setRole(selectedRole);
      setIsAuthenticated(true);
    },
    logout: async () => {
      await clearAuth();
      setRole(null);
      setIsAuthenticated(false);
    },
  };

  if (isLoading) return null;

  return (
    <ConvexClientProvider>
      <AuthContext.Provider value={authContext}>
        <StatusBar style="light" />
        <Slot />
      </AuthContext.Provider>
    </ConvexClientProvider>
  );
}
```

- [ ] **Step 2: Create `mobile/app/login.tsx`**

```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth, UserRole } from "../lib/auth";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");
  const { login } = useAuth();

  const VALID_PASSWORD = "DonMacchiatos2026@";

  const handleLogin = async () => {
    if (password !== VALID_PASSWORD) {
      Alert.alert("Invalid Password", "Please enter the correct password.");
      return;
    }
    await login(selectedRole);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Don Macchiatos</Text>
        <Text style={styles.subtitle}>Order Management</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "staff" && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole("staff")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "staff" && styles.roleButtonTextActive,
              ]}
            >
              Staff
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "owner" && styles.roleButtonActive,
            ]}
            onPress={() => setSelectedRole("owner")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "owner" && styles.roleButtonTextActive,
              ]}
            >
              Owner
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 40,
  },
  roleSelector: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  roleButtonTextActive: {
    color: "#1a1a1a",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/_layout.tsx mobile/app/login.tsx
git commit -m "feat: add mobile root layout with auth gate and login screen"
```

---

## Task 9: Mobile Tab Navigator

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `mobile/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../lib/auth";

export default function TabLayout() {
  const { role } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#666",
        headerStyle: {
          backgroundColor: "#1a1a1a",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📜</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
          href: role === "owner" ? "/(tabs)/sales" : null,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat: add mobile tab navigator with role-based Sales tab"
```

---

## Task 10: Mobile Shared Components

**Files:**
- Create: `mobile/components/OrderCard.tsx`
- Create: `mobile/components/StatusBadge.tsx`
- Create: `mobile/components/SalesSummaryCard.tsx`

- [ ] **Step 1: Create `mobile/components/StatusBadge.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#DBEAFE", text: "#1E40AF" },
  preparing: { bg: "#E0E7FF", text: "#3730A3" },
  ready: { bg: "#D1FAE5", text: "#065F46" },
  completed: { bg: "#E5E7EB", text: "#374151" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
```

- [ ] **Step 2: Create `mobile/components/OrderCard.tsx`**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBadge } from "./StatusBadge";
import { Id } from "../../convex/_generated/dataModel";

interface OrderCardProps {
  order: {
    _id: Id<"orders">;
    orderNumber: string;
    customerName: string;
    contactNumber: string;
    serviceType: string;
    total: number;
    status: string;
    items: { name: string; quantity: number }[];
    createdAt: number;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${order._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.details}>
        <Text style={styles.customerName}>
          {order.customerName || "Walk-in Customer"}
        </Text>
        <Text style={styles.meta}>
          {order.serviceType.charAt(0).toUpperCase() +
            order.serviceType.slice(1)}{" "}
          | {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.meta}>{order.contactNumber || "No contact"}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>PHP {order.total.toFixed(2)}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  details: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: "#999",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ADE80",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
});
```

- [ ] **Step 3: Create `mobile/components/SalesSummaryCard.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";

interface SalesSummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function SalesSummaryCard({
  title,
  value,
  subtitle,
  color = "#4ADE80",
}: SalesSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add mobile/components/
git commit -m "feat: add OrderCard, StatusBadge, and SalesSummaryCard components"
```

---

## Task 11: Orders Dashboard Screen (Real-time + Audio)

**Files:**
- Create: `mobile/app/(tabs)/orders.tsx`

- [ ] **Step 1: Create `mobile/app/(tabs)/orders.tsx`**

```tsx
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";
import {
  registerForPushNotifications,
  playNewOrderSound,
} from "../../lib/notifications";
import { useAuth } from "../../lib/auth";

export default function OrdersScreen() {
  const orders = useQuery(api.orders.getActiveOrders);
  const registerToken = useMutation(api.notifications.registerPushToken);
  const { role, logout } = useAuth();
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Register push notifications on mount
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      if (token && role) {
        await registerToken({ token, role });
      }
    })();
  }, [role]);

  // Play sound when new order arrives
  useEffect(() => {
    if (!orders) return;

    const currentIds = new Set(orders.map((o) => o._id));

    if (isInitialLoadRef.current) {
      prevOrderIdsRef.current = currentIds;
      isInitialLoadRef.current = false;
      return;
    }

    // Check for new orders not in previous set
    for (const id of currentIds) {
      if (!prevOrderIdsRef.current.has(id)) {
        playNewOrderSound();
        break; // Play sound once even if multiple new orders
      }
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders]);

  const pendingCount =
    orders?.filter((o) => o.status === "pending").length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Active Orders</Text>
          {pendingCount > 0 && (
            <Text style={styles.pendingBadge}>
              {pendingCount} pending
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {!orders ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active orders</Text>
          <Text style={styles.emptySubtext}>
            New orders will appear here in real-time
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  pendingBadge: {
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "600",
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  logoutText: {
    color: "#999",
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/\(tabs\)/orders.tsx
git commit -m "feat: add real-time orders dashboard with audio alerts"
```

---

## Task 12: Order Detail Screen

**Files:**
- Create: `mobile/app/order/[id].tsx`

- [ ] **Step 1: Create `mobile/app/order/[id].tsx`**

```tsx
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { StatusBadge } from "../../components/StatusBadge";

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

const ACTION_LABELS: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Start Preparing",
  preparing: "Mark as Ready",
  ready: "Complete Order",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = useQuery(api.orders.getOrderById, {
    orderId: id as Id<"orders">,
  });
  const updateStatus = useMutation(api.orders.updateOrderStatus);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  const nextStatus = STATUS_FLOW[order.status];
  const actionLabel = ACTION_LABELS[order.status];

  const handleStatusUpdate = () => {
    if (!nextStatus) return;
    Alert.alert(
      "Update Status",
      `Change order status to "${nextStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await updateStatus({
              orderId: id as Id<"orders">,
              status: nextStatus as any,
            });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          await updateStatus({
            orderId: id as Id<"orders">,
            status: "cancelled",
          });
          router.back();
        },
      },
    ]);
  };

  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      {/* Customer Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <DetailRow
          label="Name"
          value={order.customerName || "Walk-in Customer"}
        />
        <DetailRow
          label="Contact"
          value={order.contactNumber || "Not provided"}
        />
        <DetailRow
          label="Service"
          value={
            order.serviceType.charAt(0).toUpperCase() +
            order.serviceType.slice(1)
          }
        />
        {order.address && (
          <DetailRow label="Address" value={order.address} />
        )}
        {order.pickupTime && (
          <DetailRow label="Pickup Time" value={order.pickupTime} />
        )}
        <DetailRow label="Payment" value={order.paymentMethod.toUpperCase()} />
        {order.referenceNumber && (
          <DetailRow label="Ref #" value={order.referenceNumber} />
        )}
        <DetailRow label="Ordered" value={formattedDate} />
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>
                {item.name} x{item.quantity}
              </Text>
              {item.variations && item.variations.length > 0 && (
                <Text style={styles.itemMeta}>
                  {item.variations.map((v) => `${v.type}: ${v.name}`).join(", ")}
                </Text>
              )}
              {item.servingPreference && (
                <Text style={styles.itemMeta}>
                  Serving: {item.servingPreference}
                </Text>
              )}
              {item.addOns && item.addOns.length > 0 && (
                <Text style={styles.itemMeta}>
                  Add-ons: {item.addOns.join(", ")}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrice}>
              PHP {(item.totalPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Bundle Items */}
        {order.bundleItems?.map((bundle, index) => (
          <View key={`bundle-${index}`} style={styles.bundleRow}>
            <View style={styles.bundleHeader}>
              <View style={styles.bundleBadge}>
                <Text style={styles.bundleBadgeText}>BUNDLE</Text>
              </View>
              <Text style={styles.itemName}>
                {bundle.bundleName} x{bundle.quantity}
              </Text>
            </View>
            {bundle.items.map((item, i) => (
              <Text key={i} style={styles.bundleItem}>
                • {item.name}
                {item.variations &&
                  ` (${item.variations.map((v) => `${v.type}: ${v.name}`).join(", ")})`}
              </Text>
            ))}
            <Text style={styles.itemPrice}>
              PHP {(bundle.bundlePrice * bundle.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.notes}>{order.notes}</Text>
        </View>
      )}

      {/* Total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>PHP {order.total.toFixed(2)}</Text>
      </View>

      {/* Action Buttons */}
      {!["completed", "cancelled"].includes(order.status) && (
        <View style={styles.actions}>
          {actionLabel && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStatusUpdate}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  header: {
    padding: 16,
    gap: 8,
  },
  backButton: {
    color: "#60A5FA",
    fontSize: 16,
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#999",
  },
  detailValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  itemName: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    color: "#4ADE80",
    fontWeight: "600",
  },
  bundleRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  bundleBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bundleBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  bundleItem: {
    fontSize: 13,
    color: "#999",
    marginLeft: 8,
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ADE80",
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/order/
git commit -m "feat: add order detail screen with status updates and customer details"
```

---

## Task 13: Order History Screen

**Files:**
- Create: `mobile/app/(tabs)/history.tsx`

- [ ] **Step 1: Create `mobile/app/(tabs)/history.tsx`**

```tsx
import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrderCard } from "../../components/OrderCard";

type DateFilter = "today" | "week" | "month" | "all";

function getDateRange(filter: DateFilter): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (filter) {
    case "today":
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      break;
    case "week":
      start = end - 7 * 24 * 60 * 60 * 1000;
      break;
    case "month":
      start = end - 30 * 24 * 60 * 60 * 1000;
      break;
    case "all":
    default:
      start = 0;
      break;
  }

  return { start, end };
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState<DateFilter>("today");
  const [search, setSearch] = useState("");

  const { start, end } = getDateRange(filter);
  const orders = useQuery(api.orders.getCompletedOrders, {
    startTime: start,
    endTime: end,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.contactNumber.includes(q)
    );
  }, [orders, search]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search orders..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {(["today", "week", "month", "all"] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all"
                ? "All"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!orders ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  filterActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  filterText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#1a1a1a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/\(tabs\)/history.tsx
git commit -m "feat: add order history screen with date filter and search"
```

---

## Task 14: Sales Summary Screen (Owner Only)

**Files:**
- Create: `mobile/app/(tabs)/sales.tsx`

- [ ] **Step 1: Create `mobile/app/(tabs)/sales.tsx`**

```tsx
import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SalesSummaryCard } from "../../components/SalesSummaryCard";

type Period = "today" | "week" | "month";

function getPeriodRange(period: Period): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (period) {
    case "today":
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      break;
    case "week":
      start = end - 7 * 24 * 60 * 60 * 1000;
      break;
    case "month":
      start = end - 30 * 24 * 60 * 60 * 1000;
      break;
  }

  return { start, end };
}

export default function SalesScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const { start, end } = getPeriodRange(period);

  const orders = useQuery(api.orders.getOrdersByDateRange, {
    startTime: start,
    endTime: end,
  });

  const stats = useMemo(() => {
    if (!orders) return null;

    const completed = orders.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
    const orderCount = completed.length;
    const allCount = orders.length;

    // Service type breakdown
    const byService: Record<string, { count: number; revenue: number }> = {};
    for (const o of completed) {
      if (!byService[o.serviceType]) {
        byService[o.serviceType] = { count: 0, revenue: 0 };
      }
      byService[o.serviceType].count++;
      byService[o.serviceType].revenue += o.total;
    }

    // Payment method breakdown
    const byPayment: Record<string, { count: number; revenue: number }> = {};
    for (const o of completed) {
      if (!byPayment[o.paymentMethod]) {
        byPayment[o.paymentMethod] = { count: 0, revenue: 0 };
      }
      byPayment[o.paymentMethod].count++;
      byPayment[o.paymentMethod].revenue += o.total;
    }

    const cancelledCount = orders.filter(
      (o) => o.status === "cancelled"
    ).length;

    return {
      totalRevenue,
      orderCount,
      allCount,
      cancelledCount,
      byService,
      byPayment,
    };
  }, [orders]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sales Summary</Text>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(["today", "week", "month"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                  ? "This Week"
                  : "This Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!stats ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Top Stats */}
          <View style={styles.statsRow}>
            <SalesSummaryCard
              title="Revenue"
              value={`PHP ${stats.totalRevenue.toFixed(2)}`}
              subtitle={`${stats.orderCount} completed orders`}
            />
          </View>
          <View style={styles.statsRow}>
            <SalesSummaryCard
              title="Total Orders"
              value={stats.allCount.toString()}
              color="#60A5FA"
            />
            <SalesSummaryCard
              title="Cancelled"
              value={stats.cancelledCount.toString()}
              color="#EF4444"
            />
          </View>

          {/* Service Type Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Service Type</Text>
            {Object.entries(stats.byService).map(([type, data]) => (
              <View key={type} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <View style={styles.breakdownValues}>
                  <Text style={styles.breakdownCount}>
                    {data.count} orders
                  </Text>
                  <Text style={styles.breakdownRevenue}>
                    PHP {data.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {Object.keys(stats.byService).length === 0 && (
              <Text style={styles.emptyText}>No completed orders yet</Text>
            )}
          </View>

          {/* Payment Method Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Payment Method</Text>
            {Object.entries(stats.byPayment).map(([method, data]) => (
              <View key={method} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {method.toUpperCase()}
                </Text>
                <View style={styles.breakdownValues}>
                  <Text style={styles.breakdownCount}>
                    {data.count} orders
                  </Text>
                  <Text style={styles.breakdownRevenue}>
                    PHP {data.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {Object.keys(stats.byPayment).length === 0 && (
              <Text style={styles.emptyText}>No completed orders yet</Text>
            )}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    alignItems: "center",
  },
  periodActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  periodText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
  periodTextActive: {
    color: "#1a1a1a",
  },
  center: {
    paddingTop: 60,
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  section: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  breakdownLabel: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  breakdownValues: {
    alignItems: "flex-end",
  },
  breakdownCount: {
    fontSize: 13,
    color: "#999",
  },
  breakdownRevenue: {
    fontSize: 15,
    color: "#4ADE80",
    fontWeight: "600",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/\(tabs\)/sales.tsx
git commit -m "feat: add sales summary screen with period selector and breakdowns"
```

---

## Task 15: Final Integration & Testing

- [ ] **Step 1: Deploy all Convex functions**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe
npx convex dev --once
```

Expected: All functions deployed, schema synced.

- [ ] **Step 2: Test web app order creation**

```bash
npm run dev
```

Open the web app, create a test order through checkout. Verify:
- Order appears in Convex dashboard (https://dashboard.convex.dev)
- Order has correct orderNumber, status "pending", all customer details
- Messenger redirect still works

- [ ] **Step 3: Start the Expo mobile app**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile
npx expo start
```

Scan QR code with Expo Go on Android device. Verify:
- Login screen appears
- Password "DonMacchiatos2026@" works
- Role selection (staff/owner) works
- Orders tab shows the test order from step 2
- Tapping an order shows full detail with customer info and items
- Status update buttons work (pending → confirmed → preparing → ready → completed)
- History tab shows completed orders
- Sales tab only visible when logged in as owner
- Sales tab shows correct revenue and breakdowns

- [ ] **Step 4: Test real-time updates**

Open the web app and mobile app simultaneously:
- Create a new order on the web
- Verify it appears on the mobile app within 1-2 seconds
- Verify audio alert plays on mobile when new order appears
- Verify push notification received on Android

- [ ] **Step 5: Final commit**

```bash
cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe
git add -A
git commit -m "feat: complete Convex order management with Expo mobile app"
```
