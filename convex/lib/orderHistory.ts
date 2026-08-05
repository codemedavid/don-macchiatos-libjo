/**
 * Pure order-history selection logic, kept free of Convex bindings so it can be
 * unit-tested directly. `convex/orders.ts` is the only production caller.
 */

export const CLOSED_STATUSES = ["completed", "cancelled"] as const;

export interface HistoryOrder {
  _id: string;
  status: string;
  createdAt: number;
  completedAt?: number;
}

export interface HistoryWindow {
  startTime?: number;
  endTime?: number;
}

export function isClosedStatus(status: string): boolean {
  return (CLOSED_STATUSES as readonly string[]).includes(status);
}

/**
 * The moment History should file an order under.
 *
 * Closing time, not creation time: an order taken at 5pm and completed the
 * next morning belongs in the morning's History, not the previous day's.
 * Rows written before `completedAt` existed fall back to `createdAt`.
 */
export function historyTimestamp(order: HistoryOrder): number {
  return order.completedAt ?? order.createdAt;
}

export function selectHistoryOrders<T extends HistoryOrder>(
  orders: readonly T[],
  window: HistoryWindow = {}
): T[] {
  const { startTime, endTime } = window;

  return orders
    .filter((order) => {
      if (!isClosedStatus(order.status)) return false;
      const at = historyTimestamp(order);
      if (startTime !== undefined && at < startTime) return false;
      if (endTime !== undefined && at > endTime) return false;
      return true;
    })
    .slice()
    .sort((a, b) => historyTimestamp(b) - historyTimestamp(a));
}

export interface StatusPatch<S extends string = string> {
  status: S;
  updatedAt: number;
  completedAt?: number;
}

/**
 * Fields to patch onto an order when its status changes. Closing an order also
 * stamps `completedAt` so History can window on it.
 */
export function statusPatch<S extends string>(
  status: S,
  now: number
): StatusPatch<S> {
  return isClosedStatus(status)
    ? { status, updatedAt: now, completedAt: now }
    : { status, updatedAt: now };
}
