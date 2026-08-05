import { useEffect, useMemo, useState } from "react";
import { DateFilter, DateRange, getDateRange } from "./format";

const MINUTE_MS = 60_000;

const currentMinuteBucket = () => Math.ceil(Date.now() / MINUTE_MS) * MINUTE_MS;

/**
 * Date range for a filter, stable across renders.
 *
 * `getDateRange` defaults to `Date.now()`, so calling it directly in a render
 * body produces a different `end` on every pass. Feeding that into a Convex
 * `useQuery` re-keys the subscription each render, and Convex's `useSubscription`
 * responds by setting state during render — an unbreakable render loop.
 *
 * Bucketing "now" to the next minute boundary keeps the range referentially
 * stable between renders while still advancing, so newly completed orders show
 * up within a minute. `Math.ceil` puts the upper bound slightly ahead of the
 * clock so orders completed inside the current minute are already included.
 */
export function useDateRange(filter: DateFilter): DateRange {
  const [nowBucket, setNowBucket] = useState(currentMinuteBucket);

  useEffect(() => {
    const id = setInterval(() => setNowBucket(currentMinuteBucket()), MINUTE_MS);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => getDateRange(filter, nowBucket), [filter, nowBucket]);
}
