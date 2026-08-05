/**
 * Pure formatting + date-range helpers shared across screens.
 * `now` is injectable so the logic is deterministic and unit-testable.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimeAgo(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}

export function formatCurrency(amount: number): string {
  return `PHP ${amount.toFixed(2)}`;
}

export type DateFilter = "today" | "week" | "month" | "all";

export interface DateRange {
  start: number;
  end: number;
}

export function getDateRange(
  filter: DateFilter,
  now: number = Date.now()
): DateRange {
  const nowDate = new Date(now);
  const end = now;

  switch (filter) {
    case "today": {
      const start = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate()
      ).getTime();
      return { start, end };
    }
    case "week":
      return { start: end - 7 * DAY, end };
    case "month":
      return { start: end - 30 * DAY, end };
    case "all":
    default:
      return { start: 0, end };
  }
}
