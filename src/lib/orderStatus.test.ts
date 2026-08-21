import { describe, it, expect } from 'vitest';
import {
  TRACKED_STAGES,
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  getStageIndex,
  isStageReached,
  isReady,
  isCancelled,
  hasBecomeReady,
} from './orderStatus';

describe('orderStatus', () => {
  describe('TRACKED_STAGES', () => {
    it('lists the customer-facing stages in fulfilment order', () => {
      expect(TRACKED_STAGES).toEqual([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
      ]);
    });

    it('has a label and description for every possible order status', () => {
      const allStatuses = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
        'cancelled',
      ] as const;

      allStatuses.forEach((status) => {
        expect(STATUS_LABELS[status]).toBeTruthy();
        expect(STATUS_DESCRIPTIONS[status]).toBeTruthy();
      });
    });
  });

  describe('getStageIndex', () => {
    it('returns the position of a tracked status', () => {
      expect(getStageIndex('pending')).toBe(0);
      expect(getStageIndex('preparing')).toBe(2);
      expect(getStageIndex('completed')).toBe(4);
    });

    it('returns -1 for cancelled orders because they leave the pipeline', () => {
      expect(getStageIndex('cancelled')).toBe(-1);
    });
  });

  describe('isStageReached', () => {
    it('marks earlier and current stages as reached', () => {
      expect(isStageReached('pending', 'preparing')).toBe(true);
      expect(isStageReached('preparing', 'preparing')).toBe(true);
    });

    it('does not mark later stages as reached', () => {
      expect(isStageReached('ready', 'preparing')).toBe(false);
    });

    it('marks no stage as reached for a cancelled order', () => {
      expect(isStageReached('pending', 'cancelled')).toBe(false);
      expect(isStageReached('completed', 'cancelled')).toBe(false);
    });
  });

  describe('isReady / isCancelled', () => {
    it('detects the ready status', () => {
      expect(isReady('ready')).toBe(true);
      expect(isReady('preparing')).toBe(false);
    });

    it('detects the cancelled status', () => {
      expect(isCancelled('cancelled')).toBe(true);
      expect(isCancelled('ready')).toBe(false);
    });
  });

  describe('hasBecomeReady', () => {
    it('is true when the status transitions into ready', () => {
      expect(hasBecomeReady('preparing', 'ready')).toBe(true);
    });

    it('is false when ready was already observed', () => {
      expect(hasBecomeReady('ready', 'ready')).toBe(false);
    });

    it('is false on the first observation so a reload does not ring', () => {
      expect(hasBecomeReady(null, 'ready')).toBe(false);
      expect(hasBecomeReady(undefined, 'ready')).toBe(false);
    });

    it('is false for any transition that does not land on ready', () => {
      expect(hasBecomeReady('ready', 'completed')).toBe(false);
      expect(hasBecomeReady('pending', 'preparing')).toBe(false);
    });
  });
});
