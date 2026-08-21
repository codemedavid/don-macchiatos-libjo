import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useReadyAlert } from '../hooks/useReadyAlert';
import OrderTracking, { type TrackedOrder } from './OrderTracking';
import type { OrderStatus } from '../lib/orderStatus';
import type { PaymentMethod, ServiceType } from '../types';

type Props = {
  /** Convex document id returned by createOrder. */
  orderId: string;
  /** Locally built snapshot, shown until the server confirms the live document. */
  placedOrder: TrackedOrder;
  onNewOrder: () => void;
};

type ServerOrder = {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  contactNumber: string;
  serviceType: ServiceType;
  address?: string;
  pickupTime?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: TrackedOrder['items'];
  bundleItems?: TrackedOrder['bundleItems'];
  total: number;
};

const toTrackedOrder = (order: ServerOrder): TrackedOrder => ({
  orderNumber: order.orderNumber,
  status: order.status,
  customerName: order.customerName || undefined,
  contactNumber: order.contactNumber || undefined,
  serviceType: order.serviceType,
  address: order.address,
  pickupTime: order.pickupTime,
  paymentMethod: order.paymentMethod,
  notes: order.notes,
  items: order.items,
  bundleItems: order.bundleItems,
  total: order.total,
});

/**
 * Subscribes to the placed order. Convex pushes every status change over its
 * live query subscription, so the tracker updates without a manual poll.
 */
export default function OrderTracker({ orderId, placedOrder, onNewOrder }: Props) {
  const serverOrder = useQuery(api.orders.getOrderById, {
    orderId: orderId as never,
  }) as ServerOrder | null | undefined;

  const isLive = Boolean(serverOrder);
  const order = serverOrder ? toTrackedOrder(serverOrder) : placedOrder;

  useReadyAlert(serverOrder?.status);

  return (
    <OrderTracking order={order} isLive={isLive} onNewOrder={onNewOrder} />
  );
}
