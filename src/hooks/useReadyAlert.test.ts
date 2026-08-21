import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReadyAlert } from './useReadyAlert';
import { readyChime } from '../lib/chime';
import type { OrderStatus } from '../lib/orderStatus';

vi.mock('../lib/chime', () => ({
  readyChime: { prime: vi.fn(), play: vi.fn(() => true) },
}));

const renderAlert = (initialStatus: OrderStatus | undefined) => {
  const alert = { prime: vi.fn(), play: vi.fn() };

  const view = renderHook(
    ({ status }: { status: OrderStatus | undefined }) =>
      useReadyAlert(status, alert),
    { initialProps: { status: initialStatus } }
  );

  return { alert, view };
};

describe('useReadyAlert default alert', () => {
  beforeEach(() => {
    vi.mocked(readyChime.play).mockClear();
  });

  const renderWithDefaultAlert = () =>
    renderHook(
      ({ status }: { status: OrderStatus }) => useReadyAlert(status),
      { initialProps: { status: 'preparing' as OrderStatus } }
    );

  it('rings the chime and vibrates the device when the order becomes ready', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });

    const view = renderWithDefaultAlert();
    view.rerender({ status: 'ready' });

    expect(readyChime.play).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('still rings when the device cannot vibrate', () => {
    const vibrate = vi.fn(() => {
      throw new Error('vibration blocked');
    });
    vi.stubGlobal('navigator', { ...navigator, vibrate });

    const view = renderWithDefaultAlert();

    expect(() => view.rerender({ status: 'ready' })).not.toThrow();
    expect(readyChime.play).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});

describe('useReadyAlert', () => {
  it('rings when the status transitions into ready', () => {
    const { alert, view } = renderAlert('preparing');

    expect(alert.play).not.toHaveBeenCalled();

    view.rerender({ status: 'ready' });

    expect(alert.play).toHaveBeenCalledTimes(1);
  });

  it('does not ring again while the order stays ready', () => {
    const { alert, view } = renderAlert('preparing');

    view.rerender({ status: 'ready' });
    view.rerender({ status: 'ready' });

    expect(alert.play).toHaveBeenCalledTimes(1);
  });

  it('does not ring on the first observed status, even if already ready', () => {
    const { alert } = renderAlert('ready');

    expect(alert.play).not.toHaveBeenCalled();
  });

  it('does not treat an undefined loading status as an observation', () => {
    const { alert, view } = renderAlert(undefined);

    view.rerender({ status: 'ready' });

    expect(alert.play).not.toHaveBeenCalled();
  });

  it('does not ring for non-ready transitions', () => {
    const { alert, view } = renderAlert('pending');

    view.rerender({ status: 'confirmed' });
    view.rerender({ status: 'preparing' });

    expect(alert.play).not.toHaveBeenCalled();
  });
});
