import { formatTimeAgo, formatCurrency, getDateRange } from "../lib/format";

const NOW = new Date("2026-07-16T12:00:00.000Z").getTime();

describe("formatTimeAgo", () => {
  it("shows 'Just now' for orders under a minute old", () => {
    expect(formatTimeAgo(NOW - 30 * 1000, NOW)).toBe("Just now");
  });

  it("shows minutes for orders under an hour old", () => {
    expect(formatTimeAgo(NOW - 5 * 60 * 1000, NOW)).toBe("5m ago");
  });

  it("shows hours for orders under a day old", () => {
    expect(formatTimeAgo(NOW - 2 * 60 * 60 * 1000, NOW)).toBe("2h ago");
  });

  it("shows days for orders a day or more old", () => {
    expect(formatTimeAgo(NOW - 3 * 24 * 60 * 60 * 1000, NOW)).toBe("3d ago");
  });

  it("treats a future or clock-skewed timestamp as 'Just now'", () => {
    expect(formatTimeAgo(NOW + 5000, NOW)).toBe("Just now");
  });
});

describe("formatCurrency", () => {
  it("formats a whole number with two decimals and PHP prefix", () => {
    expect(formatCurrency(120)).toBe("PHP 120.00");
  });

  it("formats a fractional amount with two decimals", () => {
    expect(formatCurrency(99.5)).toBe("PHP 99.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("PHP 0.00");
  });
});

describe("getDateRange", () => {
  it("returns start of the current calendar day for 'today'", () => {
    const { start, end } = getDateRange("today", NOW);
    const startDate = new Date(start);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(end).toBe(NOW);
  });

  it("returns a 7-day window for 'week'", () => {
    const { start, end } = getDateRange("week", NOW);
    expect(end - start).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns a 30-day window for 'month'", () => {
    const { start, end } = getDateRange("month", NOW);
    expect(end - start).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("returns from epoch for 'all'", () => {
    const { start } = getDateRange("all", NOW);
    expect(start).toBe(0);
  });
});
