import {
  ACTIVE_FILTERS,
  HISTORY_FILTERS,
  activeFilterCounts,
  buildActiveSections,
  filterHistoryOrders,
  historyFilterCounts,
} from "../lib/orderFilters";

interface TestOrder {
  _id: string;
  status: string;
}

const order = (_id: string, status: string): TestOrder => ({ _id, status });

const idsIn = (sections: { data: TestOrder[] }[]) =>
  sections.flatMap((s) => s.data.map((o) => o._id)).sort();

describe("buildActiveSections", () => {
  it("files a pending order under New", () => {
    const sections = buildActiveSections([order("a", "pending")]);

    expect(sections.map((s) => s.title)).toEqual(["New"]);
    expect(sections[0].data).toHaveLength(1);
  });

  it("files a confirmed order under In Progress", () => {
    const sections = buildActiveSections([order("a", "confirmed")]);

    expect(sections.map((s) => s.title)).toEqual(["In Progress"]);
  });

  it("files a preparing order under In Progress alongside confirmed orders", () => {
    const sections = buildActiveSections([
      order("a", "confirmed"),
      order("b", "preparing"),
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("In Progress");
    expect(idsIn(sections)).toEqual(["a", "b"]);
  });

  it("files a ready order under Ready for Handover", () => {
    const sections = buildActiveSections([order("a", "ready")]);

    expect(sections.map((s) => s.title)).toEqual(["Ready for Handover"]);
  });

  it("orders sections New, then In Progress, then Ready for Handover", () => {
    const sections = buildActiveSections([
      order("c", "ready"),
      order("a", "pending"),
      order("b", "confirmed"),
    ]);

    expect(sections.map((s) => s.title)).toEqual([
      "New",
      "In Progress",
      "Ready for Handover",
    ]);
  });

  it("omits sections that have no orders", () => {
    const sections = buildActiveSections([order("a", "pending")]);

    expect(sections).toHaveLength(1);
  });

  it("returns no sections for an empty list", () => {
    expect(buildActiveSections([])).toEqual([]);
  });

  // The reported symptom: an order that is still active but whose status the
  // screen does not enumerate is silently dropped from every section, so it
  // vanishes from the Orders tab without ever reaching History.
  it("never drops an active order whose status has no dedicated section", () => {
    const sections = buildActiveSections([
      order("a", "pending"),
      order("mystery", "on-hold"),
    ]);

    expect(idsIn(sections)).toEqual(["a", "mystery"]);
  });

  it("does not mutate the caller's array", () => {
    const orders = [order("a", "pending"), order("b", "ready")];
    const snapshot = [...orders];

    buildActiveSections(orders);

    expect(orders).toEqual(snapshot);
  });
});

describe("buildActiveSections with a status filter", () => {
  const orders = [
    order("p", "pending"),
    order("c", "confirmed"),
    order("pr", "preparing"),
    order("r", "ready"),
  ];

  it("shows every section under the All filter", () => {
    expect(idsIn(buildActiveSections(orders, "all"))).toEqual([
      "c",
      "p",
      "pr",
      "r",
    ]);
  });

  it("defaults to All when no filter is given", () => {
    expect(idsIn(buildActiveSections(orders))).toEqual(["c", "p", "pr", "r"]);
  });

  it("narrows to just new orders", () => {
    const sections = buildActiveSections(orders, "new");

    expect(sections.map((s) => s.title)).toEqual(["New"]);
    expect(idsIn(sections)).toEqual(["p"]);
  });

  it("keeps confirmed orders reachable under the In Progress filter", () => {
    const sections = buildActiveSections(orders, "inProgress");

    expect(sections.map((s) => s.title)).toEqual(["In Progress"]);
    expect(idsIn(sections)).toEqual(["c", "pr"]);
  });

  it("narrows to orders waiting for handover", () => {
    expect(idsIn(buildActiveSections(orders, "ready"))).toEqual(["r"]);
  });

  it("returns no sections when the selected filter matches nothing", () => {
    expect(buildActiveSections([order("p", "pending")], "ready")).toEqual([]);
  });
});

describe("activeFilterCounts", () => {
  it("counts each bucket and the total", () => {
    const counts = activeFilterCounts([
      order("a", "pending"),
      order("b", "pending"),
      order("c", "confirmed"),
      order("d", "preparing"),
      order("e", "ready"),
    ]);

    expect(counts).toEqual({
      all: 5,
      new: 2,
      inProgress: 2,
      ready: 1,
    });
  });

  it("reports zero for every bucket when there are no orders", () => {
    expect(activeFilterCounts([])).toEqual({
      all: 0,
      new: 0,
      inProgress: 0,
      ready: 0,
    });
  });

  it("counts an unbucketed active order in the total so it is never hidden", () => {
    expect(activeFilterCounts([order("x", "on-hold")]).all).toBe(1);
  });

  it("exposes a filter chip for every counted bucket", () => {
    const counts = activeFilterCounts([]);

    expect(ACTIVE_FILTERS.map((f) => f.key).sort()).toEqual(
      Object.keys(counts).sort()
    );
  });
});

describe("filterHistoryOrders", () => {
  const closed = (
    _id: string,
    status: string,
    fields: Partial<{
      orderNumber: string;
      customerName: string;
      contactNumber: string;
    }> = {}
  ) => ({
    _id,
    status,
    orderNumber: fields.orderNumber ?? `ORD-${_id}`,
    customerName: fields.customerName ?? "Someone",
    contactNumber: fields.contactNumber ?? "09000000000",
  });

  const orders = [
    closed("1", "completed", { customerName: "Ana", contactNumber: "09171234567" }),
    closed("2", "cancelled", { customerName: "Ben" }),
    closed("3", "completed", { customerName: "Cara" }),
  ];

  it("returns everything under the All filter", () => {
    expect(filterHistoryOrders(orders, { status: "all" }).map((o) => o._id)).toEqual(
      ["1", "2", "3"]
    );
  });

  it("narrows to completed orders", () => {
    expect(
      filterHistoryOrders(orders, { status: "completed" }).map((o) => o._id)
    ).toEqual(["1", "3"]);
  });

  it("narrows to cancelled orders", () => {
    expect(
      filterHistoryOrders(orders, { status: "cancelled" }).map((o) => o._id)
    ).toEqual(["2"]);
  });

  it("matches a search term against the customer name, case-insensitively", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "ana" }).map((o) => o._id)
    ).toEqual(["1"]);
  });

  it("matches a search term against the order number", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "ORD-2" }).map(
        (o) => o._id
      )
    ).toEqual(["2"]);
  });

  it("matches a search term against the contact number", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "0917" }).map(
        (o) => o._id
      )
    ).toEqual(["1"]);
  });

  it("ignores surrounding whitespace in the search term", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "  Ben  " }).map(
        (o) => o._id
      )
    ).toEqual(["2"]);
  });

  it("treats a blank search as no search at all", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "   " })
    ).toHaveLength(3);
  });

  it("applies the status filter and the search term together", () => {
    expect(
      filterHistoryOrders(orders, { status: "cancelled", search: "Ana" })
    ).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(
      filterHistoryOrders(orders, { status: "all", search: "nobody" })
    ).toEqual([]);
  });

  it("does not mutate the caller's array", () => {
    const snapshot = [...orders];

    filterHistoryOrders(orders, { status: "completed", search: "Ana" });

    expect(orders).toEqual(snapshot);
  });
});

describe("historyFilterCounts", () => {
  it("counts completed, cancelled, and the total", () => {
    const counts = historyFilterCounts([
      { _id: "1", status: "completed" },
      { _id: "2", status: "completed" },
      { _id: "3", status: "cancelled" },
    ]);

    expect(counts).toEqual({ all: 3, completed: 2, cancelled: 1 });
  });

  it("exposes a filter chip for every counted bucket", () => {
    expect(HISTORY_FILTERS.map((f) => f.key).sort()).toEqual(
      Object.keys(historyFilterCounts([])).sort()
    );
  });
});
