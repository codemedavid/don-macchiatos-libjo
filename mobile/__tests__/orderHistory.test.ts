import {
  HistoryOrder,
  historyTimestamp,
  isClosedStatus,
  selectHistoryOrders,
  statusPatch,
} from "../../convex/lib/orderHistory";

const DAY = 24 * 60 * 60 * 1000;

/** 2026-08-05 09:00 UTC — "today" in every assertion below. */
const TODAY_9AM = Date.UTC(2026, 7, 5, 9, 0, 0);
const TODAY_START = Date.UTC(2026, 7, 5, 0, 0, 0);
const TODAY_END = Date.UTC(2026, 7, 5, 23, 59, 59);
const YESTERDAY_5PM = Date.UTC(2026, 7, 4, 17, 0, 0);

function order(partial: Partial<HistoryOrder> = {}): HistoryOrder {
  return {
    _id: "order_1",
    status: "completed",
    createdAt: TODAY_9AM,
    ...partial,
  };
}

describe("isClosedStatus", () => {
  it("treats completed and cancelled as closed", () => {
    expect(isClosedStatus("completed")).toBe(true);
    expect(isClosedStatus("cancelled")).toBe(true);
  });

  it("treats every in-flight status as open", () => {
    for (const status of ["pending", "confirmed", "preparing", "ready"]) {
      expect(isClosedStatus(status)).toBe(false);
    }
  });
});

describe("historyTimestamp", () => {
  it("uses completedAt when the order recorded one", () => {
    // Arrange
    const closedToday = order({
      createdAt: YESTERDAY_5PM,
      completedAt: TODAY_9AM,
    });

    // Act
    const timestamp = historyTimestamp(closedToday);

    // Assert
    expect(timestamp).toBe(TODAY_9AM);
  });

  it("falls back to createdAt for rows written before completedAt existed", () => {
    const legacy = order({ createdAt: YESTERDAY_5PM, completedAt: undefined });

    expect(historyTimestamp(legacy)).toBe(YESTERDAY_5PM);
  });
});

describe("selectHistoryOrders", () => {
  it("excludes orders that are still in flight", () => {
    // Arrange
    const orders = [
      order({ _id: "pending", status: "pending" }),
      order({ _id: "confirmed", status: "confirmed" }),
      order({ _id: "preparing", status: "preparing" }),
      order({ _id: "ready", status: "ready" }),
    ];

    // Act
    const selected = selectHistoryOrders(orders);

    // Assert
    expect(selected).toEqual([]);
  });

  it("includes both completed and cancelled orders", () => {
    const orders = [
      order({ _id: "done", status: "completed" }),
      order({ _id: "void", status: "cancelled" }),
    ];

    const ids = selectHistoryOrders(orders).map((o) => o._id);

    expect(ids.sort()).toEqual(["done", "void"]);
  });

  it("includes an order created yesterday but completed inside today's window", () => {
    // This is the reported bug: History windowed on createdAt, so an order
    // carried over from a previous day never appeared under the Today filter
    // no matter how many times staff completed it.

    // Arrange
    const carriedOver = order({
      _id: "carried_over",
      createdAt: YESTERDAY_5PM,
      completedAt: TODAY_9AM,
    });

    // Act
    const selected = selectHistoryOrders([carriedOver], {
      startTime: TODAY_START,
      endTime: TODAY_END,
    });

    // Assert
    expect(selected.map((o) => o._id)).toEqual(["carried_over"]);
  });

  it("excludes an order created today but completed after the window closes", () => {
    const closedTomorrow = order({
      _id: "late",
      createdAt: TODAY_9AM,
      completedAt: TODAY_END + DAY,
    });

    const selected = selectHistoryOrders([closedTomorrow], {
      startTime: TODAY_START,
      endTime: TODAY_END,
    });

    expect(selected).toEqual([]);
  });

  it("excludes an order closed before the window opens", () => {
    const closedYesterday = order({
      _id: "old",
      createdAt: YESTERDAY_5PM,
      completedAt: YESTERDAY_5PM,
    });

    const selected = selectHistoryOrders([closedYesterday], {
      startTime: TODAY_START,
      endTime: TODAY_END,
    });

    expect(selected).toEqual([]);
  });

  it("includes orders sitting exactly on both window boundaries", () => {
    const orders = [
      order({ _id: "at_start", completedAt: TODAY_START }),
      order({ _id: "at_end", completedAt: TODAY_END }),
    ];

    const ids = selectHistoryOrders(orders, {
      startTime: TODAY_START,
      endTime: TODAY_END,
    }).map((o) => o._id);

    expect(ids.sort()).toEqual(["at_end", "at_start"]);
  });

  it("returns every closed order when no window is given", () => {
    const orders = [
      order({ _id: "ancient", completedAt: 0 }),
      order({ _id: "recent", completedAt: TODAY_9AM }),
    ];

    expect(selectHistoryOrders(orders)).toHaveLength(2);
  });

  it("sorts most recently closed first", () => {
    // Arrange — deliberately supplied oldest-first
    const orders = [
      order({ _id: "oldest", completedAt: TODAY_9AM - 2 * DAY }),
      order({ _id: "newest", completedAt: TODAY_9AM }),
      order({ _id: "middle", completedAt: TODAY_9AM - DAY }),
    ];

    // Act
    const ids = selectHistoryOrders(orders).map((o) => o._id);

    // Assert
    expect(ids).toEqual(["newest", "middle", "oldest"]);
  });

  it("does not mutate the caller's array", () => {
    const orders = [
      order({ _id: "a", completedAt: TODAY_9AM - DAY }),
      order({ _id: "b", completedAt: TODAY_9AM }),
    ];
    const snapshot = [...orders];

    selectHistoryOrders(orders);

    expect(orders).toEqual(snapshot);
  });
});

describe("statusPatch", () => {
  it("stamps completedAt when an order closes", () => {
    // Arrange / Act
    const patch = statusPatch("completed", TODAY_9AM);

    // Assert
    expect(patch).toEqual({
      status: "completed",
      updatedAt: TODAY_9AM,
      completedAt: TODAY_9AM,
    });
  });

  it("stamps completedAt when an order is cancelled", () => {
    expect(statusPatch("cancelled", TODAY_9AM).completedAt).toBe(TODAY_9AM);
  });

  it("leaves completedAt unset while the order is still in flight", () => {
    for (const status of ["confirmed", "preparing", "ready"]) {
      const patch = statusPatch(status, TODAY_9AM);
      expect(patch.completedAt).toBeUndefined();
      expect(patch.updatedAt).toBe(TODAY_9AM);
    }
  });
});
