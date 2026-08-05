import { computeSalesStats, SalesOrder } from "../lib/sales";

function order(partial: Partial<SalesOrder>): SalesOrder {
  return {
    status: "completed",
    total: 100,
    serviceType: "pickup",
    paymentMethod: "cash",
    ...partial,
  };
}

describe("computeSalesStats", () => {
  it("returns zeroed stats for an empty order list", () => {
    const stats = computeSalesStats([]);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.orderCount).toBe(0);
    expect(stats.allCount).toBe(0);
    expect(stats.cancelledCount).toBe(0);
    expect(stats.averageOrderValue).toBe(0);
  });

  it("sums revenue and counts only completed orders", () => {
    const stats = computeSalesStats([
      order({ status: "completed", total: 150 }),
      order({ status: "completed", total: 250 }),
      order({ status: "pending", total: 999 }),
      order({ status: "cancelled", total: 500 }),
    ]);
    expect(stats.totalRevenue).toBe(400);
    expect(stats.orderCount).toBe(2);
    expect(stats.allCount).toBe(4);
    expect(stats.cancelledCount).toBe(1);
  });

  it("computes average order value from completed orders only", () => {
    const stats = computeSalesStats([
      order({ status: "completed", total: 100 }),
      order({ status: "completed", total: 300 }),
      order({ status: "cancelled", total: 999 }),
    ]);
    expect(stats.averageOrderValue).toBe(200);
  });

  it("breaks down completed revenue by service type", () => {
    const stats = computeSalesStats([
      order({ status: "completed", total: 100, serviceType: "delivery" }),
      order({ status: "completed", total: 200, serviceType: "delivery" }),
      order({ status: "completed", total: 50, serviceType: "dine-in" }),
    ]);
    expect(stats.byService.delivery).toEqual({ count: 2, revenue: 300 });
    expect(stats.byService["dine-in"]).toEqual({ count: 1, revenue: 50 });
  });

  it("breaks down completed revenue by payment method", () => {
    const stats = computeSalesStats([
      order({ status: "completed", total: 100, paymentMethod: "gcash" }),
      order({ status: "completed", total: 100, paymentMethod: "cash" }),
    ]);
    expect(stats.byPayment.gcash).toEqual({ count: 1, revenue: 100 });
    expect(stats.byPayment.cash).toEqual({ count: 1, revenue: 100 });
  });
});
