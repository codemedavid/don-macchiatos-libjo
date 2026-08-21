import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderTracking from './OrderTracking';
import type { TrackedOrder } from './OrderTracking';

const buildOrder = (overrides: Partial<TrackedOrder> = {}): TrackedOrder => ({
  orderNumber: 'ORD-20260821-004',
  status: 'preparing',
  customerName: 'Maria Santos',
  contactNumber: '09171234567',
  serviceType: 'pickup',
  pickupTime: '15-20 minutes',
  paymentMethod: 'gcash',
  notes: 'Less ice please',
  items: [
    {
      name: 'Spanish Latte',
      quantity: 2,
      totalPrice: 150,
      variations: [{ type: 'Size', name: 'Large' }],
      addOns: ['Extra shot'],
    },
  ],
  bundleItems: [
    {
      bundleName: 'Barkada Combo',
      quantity: 1,
      bundlePrice: 400,
      items: [{ name: 'Americano' }, { name: 'Cheesecake' }],
    },
  ],
  total: 700,
  ...overrides,
});

describe('OrderTracking', () => {
  it('shows the order number so the customer can reference it at the counter', () => {
    render(<OrderTracking order={buildOrder()} onNewOrder={vi.fn()} />);

    expect(screen.getByText('ORD-20260821-004')).toBeInTheDocument();
  });

  it('shows the full order summary instead of redirecting anywhere', () => {
    render(<OrderTracking order={buildOrder()} onNewOrder={vi.fn()} />);

    expect(screen.getByText(/Spanish Latte/)).toBeInTheDocument();
    expect(screen.getByText(/Size: Large/)).toBeInTheDocument();
    expect(screen.getByText(/Extra shot/)).toBeInTheDocument();
    expect(screen.getByText(/Barkada Combo/)).toBeInTheDocument();
    expect(screen.getByText(/Less ice please/)).toBeInTheDocument();
    expect(screen.getByText('₱700')).toBeInTheDocument();
  });

  it('highlights the current status and the stages already reached', () => {
    render(<OrderTracking order={buildOrder({ status: 'preparing' })} onNewOrder={vi.fn()} />);

    expect(screen.getByTestId('current-status')).toHaveTextContent('Preparing');
    expect(screen.getByTestId('stage-pending')).toHaveAttribute('data-reached', 'true');
    expect(screen.getByTestId('stage-preparing')).toHaveAttribute('data-reached', 'true');
    expect(screen.getByTestId('stage-ready')).toHaveAttribute('data-reached', 'false');
  });

  it('announces a ready order prominently', () => {
    render(<OrderTracking order={buildOrder({ status: 'ready' })} onNewOrder={vi.fn()} />);

    expect(screen.getByTestId('ready-banner')).toBeInTheDocument();
    expect(screen.getByTestId('stage-ready')).toHaveAttribute('data-reached', 'true');
  });

  it('hides the stage tracker for a cancelled order and explains the status', () => {
    render(<OrderTracking order={buildOrder({ status: 'cancelled' })} onNewOrder={vi.fn()} />);

    expect(screen.queryByTestId('stage-preparing')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-status')).toHaveTextContent('Cancelled');
  });

  it('lets the customer start another order', async () => {
    const onNewOrder = vi.fn();
    render(<OrderTracking order={buildOrder()} onNewOrder={onNewOrder} />);

    await userEvent.click(screen.getByRole('button', { name: /place another order/i }));

    expect(onNewOrder).toHaveBeenCalledTimes(1);
  });

  it('never links out to Messenger', () => {
    const { container } = render(<OrderTracking order={buildOrder()} onNewOrder={vi.fn()} />);

    expect(container.innerHTML).not.toMatch(/messenger/i);
  });
});
