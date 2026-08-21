import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkout from './Checkout';
import type { CartItem } from '../types';

const createOrder = vi.fn();
const useQueryMock = vi.fn();

vi.mock('convex/react', () => ({
  useMutation: () => createOrder,
  useAction: () => vi.fn(() => Promise.resolve()),
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

const cartItem: CartItem = {
  id: 'spanish-latte-large',
  menuItemId: 'spanish-latte',
  name: 'Spanish Latte',
  description: 'House blend',
  basePrice: 150,
  category: 'hot-coffee',
  popular: false,
  available: true,
  quantity: 2,
  selectedVariations: [],
  selectedAddOns: [],
  totalPrice: 150,
} as CartItem;

const placeOrder = async () => {
  render(
    <Checkout
      cartItems={[cartItem]}
      bundleCartItems={[]}
      totalPrice={300}
      onBack={vi.fn()}
      onOrderPlaced={vi.fn()}
    />
  );

  await userEvent.click(screen.getByRole('button', { name: /proceed to payment/i }));
  await userEvent.click(screen.getByRole('button', { name: /place order/i }));
};

describe('Checkout', () => {
  beforeEach(() => {
    createOrder.mockReset();
    createOrder.mockResolvedValue({
      orderId: 'order_123',
      orderNumber: 'ORD-20260821-004',
    });
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(undefined);
  });

  it('never mentions Messenger anywhere in the checkout flow', async () => {
    await placeOrder();

    expect(document.body.innerHTML).not.toMatch(/messenger/i);
  });

  it('shows the order tracking screen after the order is placed', async () => {
    await placeOrder();

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('ORD-20260821-004')).toBeInTheDocument();
    expect(screen.getByTestId('current-status')).toBeInTheDocument();
  });

  it('surfaces a retryable error when the order cannot be saved', async () => {
    createOrder.mockRejectedValue(new Error('network down'));

    await placeOrder();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not place your order/i
    );
    expect(screen.getByRole('button', { name: /place order/i })).toBeEnabled();
  });
});
