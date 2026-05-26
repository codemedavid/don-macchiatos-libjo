# Push Notifications with Ringtone Sound — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace notification sound with ringtone.mp3 and wire up backend-triggered push notifications for new orders.

**Architecture:** Convex `createOrder` mutation schedules `sendNewOrderNotification` action via `ctx.scheduler.runAfter`. The action calls Expo Push API with custom sound. On the mobile side, all sound references swap from `new-order.wav` to `ringtone.mp3`, and a notification response listener navigates to the order on tap.

**Tech Stack:** Convex (backend mutations/actions/scheduler), Expo Notifications, Expo AV, Expo Router

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `mobile/app.json` | Modify | Register `ringtone.mp3` in expo-notifications plugin |
| `mobile/lib/notifications.ts` | Modify | Swap sound file, add notification tap handler |
| `mobile/app/_layout.tsx` | Modify | Wire up notification response listener for navigation |
| `convex/notifications.ts` | Modify | Update action args/payload (orderId, sound, channelId) |
| `convex/orders.ts` | Modify | Schedule push notification after order creation |

---

### Task 1: Swap Sound in app.json

**Files:**
- Modify: `mobile/app.json:36-38`

- [ ] **Step 1: Update expo-notifications plugin sound reference**

In `mobile/app.json`, change the sounds array in the expo-notifications plugin:

```json
[
  "expo-notifications",
  {
    "sounds": ["./assets/sounds/ringtone.mp3"]
  }
]
```

This replaces the previous `"./assets/sounds/new-order.wav"` entry.

- [ ] **Step 2: Verify JSON is valid**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe && node -e "JSON.parse(require('fs').readFileSync('mobile/app.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add mobile/app.json
git commit -m "feat: register ringtone.mp3 as notification sound in app.json"
```

---

### Task 2: Swap Sound in notifications.ts

**Files:**
- Modify: `mobile/lib/notifications.ts:41,57-59`

- [ ] **Step 1: Update Android notification channel sound**

In `mobile/lib/notifications.ts`, line 41, change the channel sound:

```typescript
sound: "ringtone.mp3",
```

This replaces `"new-order.wav"`.

- [ ] **Step 2: Update playNewOrderSound to use ringtone.mp3**

In `mobile/lib/notifications.ts`, in the `playNewOrderSound` function, change the require:

```typescript
const { sound: newSound } = await Audio.Sound.createAsync(
  require("../assets/sounds/ringtone.mp3")
);
```

This replaces `require("../assets/sounds/new-order.wav")`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to notifications.ts

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/notifications.ts
git commit -m "feat: swap notification sound to ringtone.mp3"
```

---

### Task 3: Add Notification Response Listener

**Files:**
- Modify: `mobile/lib/notifications.ts` (add export)
- Modify: `mobile/app/_layout.tsx` (add listener)

- [ ] **Step 1: Add setupNotificationResponseListener to notifications.ts**

Add the following at the bottom of `mobile/lib/notifications.ts`:

```typescript
import * as Notifications from "expo-notifications";
// (already imported at top — do not duplicate)

export function addNotificationResponseListener(
  onTap: (orderId: string) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.orderId) {
      onTap(data.orderId as string);
    }
  });
}
```

This exports a function that sets up a listener for when the user taps a notification. It extracts `orderId` from the notification data and calls the provided callback.

- [ ] **Step 2: Wire up listener in _layout.tsx**

In `mobile/app/_layout.tsx`, add the import:

```typescript
import { addNotificationResponseListener } from "../lib/notifications";
```

Then add a `useEffect` inside `RootLayout`, after the existing auth effects (before the `authContext` declaration):

```typescript
useEffect(() => {
  const subscription = addNotificationResponseListener((orderId) => {
    router.push(`/order/${orderId}`);
  });
  return () => subscription.remove();
}, [router]);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/notifications.ts mobile/app/_layout.tsx
git commit -m "feat: navigate to order detail on notification tap"
```

---

### Task 4: Update Convex sendNewOrderNotification Action

**Files:**
- Modify: `convex/notifications.ts:49-95`

- [ ] **Step 1: Add orderId arg and update notification payload**

In `convex/notifications.ts`, update the `sendNewOrderNotification` action:

```typescript
export const sendNewOrderNotification = action({
  args: {
    orderNumber: v.string(),
    customerName: v.string(),
    total: v.number(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(api.notifications.getAllPushTokens);

    if (tokens.length === 0) return;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: "New Order!",
      body: `Order ${args.orderNumber} from ${args.customerName || "Customer"} - PHP ${args.total.toFixed(2)}`,
      sound: "ringtone.mp3",
      channelId: "orders",
      data: { orderNumber: args.orderNumber, orderId: args.orderId },
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

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
```

Changes from original:
- Added `orderId: v.string()` to args
- Changed `sound: "default"` → `sound: "ringtone.mp3"`
- Added `channelId: "orders"` to route through the high-importance Android channel
- Added `orderId` to data payload

- [ ] **Step 2: Verify Convex types**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe && npx convex dev --once 2>&1 | tail -10`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add convex/notifications.ts
git commit -m "feat: update push notification with ringtone sound and orderId"
```

---

### Task 5: Trigger Push Notification from createOrder

**Files:**
- Modify: `convex/orders.ts:1-2,76-94`

- [ ] **Step 1: Add internal API import**

In `convex/orders.ts`, update the import at line 1 to include `action` reference and add the api import:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
```

The `api` import is needed for `ctx.scheduler.runAfter`.

- [ ] **Step 2: Schedule notification after order insert**

In `convex/orders.ts`, in the `createOrder` handler, add the scheduler call right after the `ctx.db.insert` and before the `return`:

```typescript
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

    await ctx.scheduler.runAfter(0, api.notifications.sendNewOrderNotification, {
      orderNumber,
      customerName: args.customerName,
      total: args.total,
      orderId: orderId,
    });

    return { orderId, orderNumber };
```

`ctx.scheduler.runAfter(0, ...)` schedules the action to run immediately after the mutation completes. This is the correct Convex pattern — mutations cannot directly call actions, but they can schedule them.

- [ ] **Step 3: Verify Convex deployment**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe && npx convex dev --once 2>&1 | tail -10`
Expected: Successful deployment, no errors

- [ ] **Step 4: Commit**

```bash
git add convex/orders.ts
git commit -m "feat: trigger push notification when new order is created"
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Start the mobile dev server**

Run: `cd /Users/codemedavid/Documents/don-macchiatos/beracah-cafe/mobile && npx expo start`

- [ ] **Step 2: Test on physical device**

1. Open the app on a physical device (push notifications don't work on simulators)
2. Log in as staff
3. From another device/browser, create a new order via the web app
4. Verify:
   - Push notification appears with "New Order!" title and order details
   - Notification plays ringtone.mp3 sound
   - Tapping the notification navigates to the order detail screen
   - When the app is open, the in-app sound also plays ringtone.mp3

- [ ] **Step 3: Test background notification**

1. Close the app (swipe away)
2. Create another order from web
3. Verify system notification appears with ringtone.mp3 sound
4. Tap notification → app opens to order detail screen
