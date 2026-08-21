export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

/**
 * Customer-facing fulfilment pipeline, in order. `cancelled` is deliberately
 * excluded: it leaves the pipeline rather than advancing through it.
 */
export const TRACKED_STAGES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'We got your order and it is waiting for the barista.',
  confirmed: 'Your order is confirmed and queued up.',
  preparing: 'Your drinks are being made right now.',
  ready: 'Your order is ready — please proceed to the counter.',
  completed: 'Order handed over. Enjoy, and thank you!',
  cancelled: 'This order was cancelled. Please contact the store if unexpected.',
};

export const getStageIndex = (status: OrderStatus): number =>
  TRACKED_STAGES.indexOf(status);

export const isStageReached = (
  stage: OrderStatus,
  currentStatus: OrderStatus
): boolean => {
  const currentIndex = getStageIndex(currentStatus);
  if (currentIndex === -1) return false;
  return getStageIndex(stage) <= currentIndex;
};

export const isReady = (status: OrderStatus): boolean => status === 'ready';

export const isCancelled = (status: OrderStatus): boolean =>
  status === 'cancelled';

/**
 * True only on the transition into `ready`. The first observed status never
 * counts, so reloading the page on an already-ready order does not re-ring.
 */
export const hasBecomeReady = (
  previousStatus: OrderStatus | null | undefined,
  nextStatus: OrderStatus
): boolean => {
  if (!previousStatus) return false;
  return !isReady(previousStatus) && isReady(nextStatus);
};
