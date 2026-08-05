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

const SECTION_ORDER: { key: string; title: string; statuses: string[] }[] = [
  { key: "new", title: "New", statuses: ["pending"] },
  {
    key: "inProgress",
    title: "In Progress",
    statuses: ["confirmed", "preparing"],
  },
  { key: "ready", title: "Ready for Handover", statuses: ["ready"] },
];

export function buildActiveSections<T extends FilterableOrder>(
  orders: readonly T[]
): OrderSection<T>[] {
  return SECTION_ORDER.map((section) => ({
    key: section.key,
    title: section.title,
    data: orders.filter((o) => section.statuses.includes(o.status)),
  })).filter((section) => section.data.length > 0);
}
