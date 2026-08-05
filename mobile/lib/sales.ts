/**
 * Pure sales aggregation over a list of orders. Kept free of React Native
 * imports so it can be unit-tested and reused by the Sales screen.
 */

export interface SalesOrder {
  status: string;
  total: number;
  serviceType: string;
  paymentMethod: string;
}

export interface Breakdown {
  count: number;
  revenue: number;
}

export interface SalesStats {
  totalRevenue: number;
  orderCount: number;
  allCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  byService: Record<string, Breakdown>;
  byPayment: Record<string, Breakdown>;
}

function addToBreakdown(
  map: Record<string, Breakdown>,
  key: string,
  amount: number
): void {
  if (!map[key]) {
    map[key] = { count: 0, revenue: 0 };
  }
  map[key].count += 1;
  map[key].revenue += amount;
}

export function computeSalesStats(orders: SalesOrder[]): SalesStats {
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
  const orderCount = completed.length;

  const byService: Record<string, Breakdown> = {};
  const byPayment: Record<string, Breakdown> = {};
  for (const o of completed) {
    addToBreakdown(byService, o.serviceType, o.total);
    addToBreakdown(byPayment, o.paymentMethod, o.total);
  }

  return {
    totalRevenue,
    orderCount,
    allCount: orders.length,
    cancelledCount: orders.filter((o) => o.status === "cancelled").length,
    averageOrderValue: orderCount === 0 ? 0 : totalRevenue / orderCount,
    byService,
    byPayment,
  };
}
