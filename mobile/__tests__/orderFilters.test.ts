import { buildActiveSections } from "../lib/orderFilters";

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
