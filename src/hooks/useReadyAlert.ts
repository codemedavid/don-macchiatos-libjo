import { useEffect, useRef } from 'react';
import { hasBecomeReady, type OrderStatus } from '../lib/orderStatus';
import { readyChime, type ChimePlayer } from '../lib/chime';

const VIBRATION_PATTERN_MS = [200, 100, 200, 100, 400];

const vibrate = () => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    navigator.vibrate(VIBRATION_PATTERN_MS);
  } catch {
    /* Vibration is a nice-to-have; never let it break the tracker. */
  }
};

const defaultAlert: ChimePlayer = {
  prime: () => readyChime.prime(),
  play: () => {
    vibrate();
    return readyChime.play();
  },
};

/**
 * Rings once when the order status transitions into `ready`.
 *
 * The first observed status is only recorded, never rung, so a customer who
 * reloads an already-ready order is not startled by a chime.
 */
export const useReadyAlert = (
  status: OrderStatus | undefined,
  alert: ChimePlayer = defaultAlert
): void => {
  const previousStatusRef = useRef<OrderStatus | null>(null);

  useEffect(() => {
    if (!status) return;

    if (hasBecomeReady(previousStatusRef.current, status)) {
      alert.play();
    }

    previousStatusRef.current = status;
  }, [status, alert]);
};
