/**
 * Pure order bucketing/filtering logic for the Orders and History screens,
 * kept free of React so it can be unit-tested directly.
 */

export interface FilterableOrder {
  status: string;
}

export interface SearchableOrder extends FilterableOrder {
  orderNumber: string;
  customerName: string;
  contactNumber: string;
}

export interface OrderSection<T> {
  key: string;
  title: string;
  data: T[];
}

export const OTHER_SECTION_KEY = "other";

const SECTION_ORDER: { key: string; title: string; statuses: string[] }[] = [
  { key: "new", title: "New", statuses: ["pending"] },
  {
    key: "inProgress",
    title: "In Progress",
    statuses: ["confirmed", "preparing"],
  },
  { key: "ready", title: "Ready for Handover", statuses: ["ready"] },
];

const SECTIONED_STATUSES = new Set(
  SECTION_ORDER.flatMap((section) => section.statuses)
);

export type ActiveFilterKey = "all" | "new" | "inProgress" | "ready";

export const ACTIVE_FILTERS: { key: ActiveFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "inProgress", label: "In Progress" },
  { key: "ready", label: "Ready" },
];

/**
 * `getActiveOrders` defines "active" as *not* closed, while the sections above
 * enumerate a fixed list of statuses. Those two definitions can drift, and when
 * they do an order is returned by the query but matches no section — it
 * disappears from the Orders tab without ever reaching History. The catch-all
 * keeps every active order reachable no matter what status it carries.
 *
 * A non-"all" filter narrows to that one section; the catch-all is only ever
 * shown under "all", which is also where its count is reported.
 */
export function buildActiveSections<T extends FilterableOrder>(
  orders: readonly T[],
  filter: ActiveFilterKey = "all"
): OrderSection<T>[] {
  const sections = SECTION_ORDER.filter(
    (section) => filter === "all" || section.key === filter
  ).map((section) => ({
    key: section.key,
    title: section.title,
    data: orders.filter((o) => section.statuses.includes(o.status)),
  }));

  if (filter === "all") {
    const unsectioned = orders.filter((o) => !SECTIONED_STATUSES.has(o.status));
    if (unsectioned.length > 0) {
      sections.push({
        key: OTHER_SECTION_KEY,
        title: "Other",
        data: unsectioned,
      });
    }
  }

  return sections.filter((section) => section.data.length > 0);
}

/**
 * Live counts for the Orders filter chips. `all` counts every active order,
 * including any that fall outside the named buckets, so the chip row can never
 * under-report what the staff are actually holding.
 */
export function activeFilterCounts<T extends FilterableOrder>(
  orders: readonly T[]
): Record<ActiveFilterKey, number> {
  const countOf = (key: ActiveFilterKey) => {
    const statuses =
      SECTION_ORDER.find((section) => section.key === key)?.statuses ?? [];
    return orders.filter((o) => statuses.includes(o.status)).length;
  };

  return {
    all: orders.length,
    new: countOf("new"),
    inProgress: countOf("inProgress"),
    ready: countOf("ready"),
  };
}

export type HistoryFilterKey = "all" | "completed" | "cancelled";

export const HISTORY_FILTERS: { key: HistoryFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export interface HistoryFilterOptions {
  status: HistoryFilterKey;
  search?: string;
}

function matchesSearch(order: SearchableOrder, term: string): boolean {
  return (
    order.orderNumber.toLowerCase().includes(term) ||
    order.customerName.toLowerCase().includes(term) ||
    order.contactNumber.includes(term)
  );
}

export function filterHistoryOrders<T extends SearchableOrder>(
  orders: readonly T[],
  { status, search = "" }: HistoryFilterOptions
): T[] {
  const term = search.trim().toLowerCase();

  return orders.filter((order) => {
    if (status !== "all" && order.status !== status) return false;
    if (term && !matchesSearch(order, term)) return false;
    return true;
  });
}

export function historyFilterCounts<T extends FilterableOrder>(
  orders: readonly T[]
): Record<HistoryFilterKey, number> {
  return {
    all: orders.length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };
}
