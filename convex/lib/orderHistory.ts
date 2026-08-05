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

export function historyTimestamp(order: HistoryOrder): number {
  // NOTE: current production behaviour — windows on creation time.
  return order.createdAt;
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

export interface StatusPatch {
  status: string;
  updatedAt: number;
  completedAt?: number;
}

export function statusPatch(status: string, now: number): StatusPatch {
  return { status, updatedAt: now };
}
