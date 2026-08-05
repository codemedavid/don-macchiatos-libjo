/**
 * Pure order bucketing/filtering logic for the Orders and History screens,
 * kept free of React so it can be unit-tested directly.
 */

export interface FilterableOrder {
  status: string;
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

/**
 * `getActiveOrders` defines "active" as *not* closed, while the sections below
 * enumerate a fixed list of statuses. Those two definitions can drift, and when
 * they do an order is returned by the query but matches no section — it
 * disappears from the Orders tab without ever reaching History. The catch-all
 * keeps every active order reachable no matter what status it carries.
 */
export function buildActiveSections<T extends FilterableOrder>(
  orders: readonly T[]
): OrderSection<T>[] {
  const sections = SECTION_ORDER.map((section) => ({
    key: section.key,
    title: section.title,
    data: orders.filter((o) => section.statuses.includes(o.status)),
  }));

  const unsectioned = orders.filter((o) => !SECTIONED_STATUSES.has(o.status));
  if (unsectioned.length > 0) {
    sections.push({ key: OTHER_SECTION_KEY, title: "Other", data: unsectioned });
  }

  return sections.filter((section) => section.data.length > 0);
}
