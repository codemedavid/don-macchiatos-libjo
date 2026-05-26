# Push Notifications with Ringtone Sound

**Date:** 2026-04-05
**Status:** Approved

## Summary

Replace the `new-order.wav` notification sound with `ringtone.mp3` and wire up backend-triggered push notifications so staff/owners get notified of new orders even when the app is closed.

## Current State

- `mobile/lib/notifications.ts` has push token registration, Android channel setup, and in-app sound playback — all using `new-order.wav`
- `mobile/app.json` registers `new-order.wav` in the expo-notifications plugin
- `convex/notifications.ts` has a `sendNewOrderNotification` action that calls Expo Push API — but it is **never invoked** from `createOrder`
- `convex/orders.ts` `createOrder` mutation creates orders but does not trigger any notification
- `ringtone.mp3` exists at `mobile/assets/sounds/ringtone.mp3` but is unused
- Orders screen (`mobile/app/(tabs)/orders.tsx`) detects new orders client-side and plays sound, but this only works when app is open

## Changes

### 1. Sound Swap — `new-order.wav` → `ringtone.mp3`

**`mobile/app.json`**
- Change `sounds: ["./assets/sounds/new-order.wav"]` → `sounds: ["./assets/sounds/ringtone.mp3"]`

**`mobile/lib/notifications.ts`**
- Android channel sound: `"new-order.wav"` → `"ringtone.mp3"`
- `playNewOrderSound()`: change `require("../assets/sounds/new-order.wav")` → `require("../assets/sounds/ringtone.mp3")`

### 2. Backend Push Notification Trigger

**`convex/notifications.ts`** — Update `sendNewOrderNotification`:
- Change `sound: "default"` → `sound: "ringtone.mp3"` so the custom sound plays on the device
- Add `channelId: "orders"` for Android to route through the high-importance channel
- Add `orderId` to the `data` payload so the app can navigate to the order on tap

**`convex/orders.ts`** — Update `createOrder`:
- After inserting the order, use `ctx.scheduler.runAfter(0, ...)` to schedule `sendNewOrderNotification` with the order number, customer name, total, and order ID
- This requires converting or adding an import for the internal API since mutations can schedule actions

### 3. Notification Tap → Navigate to Order

**`mobile/lib/notifications.ts`**
- Export a function `setupNotificationResponseListener` that takes a router and listens for notification taps
- On tap, extract `orderId` from notification data and navigate to `/order/[id]`

**`mobile/app/_layout.tsx`**
- Call `setupNotificationResponseListener(router)` in a `useEffect` to handle taps from both foreground and background states
- Clean up the listener on unmount

### 4. Update `sendNewOrderNotification` Args

**`convex/notifications.ts`**
- Add `orderId` (string) to the action args so we can pass it in the notification data payload

## Files Modified

| File | Change |
|------|--------|
| `mobile/app.json` | Swap sound file reference |
| `mobile/lib/notifications.ts` | Swap sound file, add notification tap handler |
| `mobile/app/_layout.tsx` | Add notification response listener |
| `convex/notifications.ts` | Update sound, add orderId to payload |
| `convex/orders.ts` | Schedule push notification after order creation |

## Architecture

```
Customer places order (web)
  → Convex createOrder mutation
    → Inserts order into DB
    → Schedules sendNewOrderNotification action (ctx.scheduler.runAfter)
      → Fetches all registered push tokens
      → Calls Expo Push API with sound: "ringtone.mp3", channelId: "orders"
        → Device receives push notification
          → If app open: notification banner + in-app sound
          → If app closed: system notification with ringtone.mp3 sound
          → On tap: navigates to /order/[orderId]
```

## Out of Scope

- Notification preferences per user
- Different sounds for different events (status changes, etc.)
- iOS-specific sound configuration (iOS plays the custom sound from the expo-notifications plugin config)
- Removing `new-order.wav` file (can be cleaned up later)
