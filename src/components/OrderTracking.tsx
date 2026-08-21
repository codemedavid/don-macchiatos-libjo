import { BellRing, Check, CircleSlash, Loader2 } from 'lucide-react';
import type { PaymentMethod, ServiceType } from '../types';
import { PAYMENT_LABELS, SERVICE_LABELS } from '../lib/orderLabels';
import {
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  TRACKED_STAGES,
  isCancelled,
  isReady,
  isStageReached,
  type OrderStatus,
} from '../lib/orderStatus';

export interface TrackedItem {
  name: string;
  quantity: number;
  totalPrice: number;
  variations?: { type: string; name: string }[];
  servingPreference?: string;
  addOns?: string[];
}

export interface TrackedBundle {
  bundleName: string;
  quantity: number;
  bundlePrice: number;
  items: {
    name: string;
    variations?: { type: string; name: string }[];
    servingPreference?: string;
    addOns?: string[];
  }[];
}

export interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  customerName?: string;
  contactNumber?: string;
  serviceType: ServiceType;
  address?: string;
  pickupTime?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: TrackedItem[];
  bundleItems?: TrackedBundle[];
  total: number;
}

type Props = {
  order: TrackedOrder;
  /** False while the live status has not been confirmed by the server yet. */
  isLive?: boolean;
  onNewOrder: () => void;
};

const describeItem = (item: TrackedItem | TrackedBundle['items'][number]) => {
  const parts: string[] = [];

  if (item.variations?.length) {
    parts.push(item.variations.map((v) => `${v.type}: ${v.name}`).join(' · '));
  }
  if (item.servingPreference) {
    parts.push(item.servingPreference);
  }
  if (item.addOns?.length) {
    parts.push(`+ ${item.addOns.join(', ')}`);
  }

  return parts.join(' · ');
};

function StageTracker({ status }: { status: OrderStatus }) {
  return (
    <ol className="space-y-3">
      {TRACKED_STAGES.map((stage) => {
        const reached = isStageReached(stage, status);
        const isCurrent = stage === status;

        return (
          <li
            key={stage}
            data-testid={`stage-${stage}`}
            data-reached={String(reached)}
            className="flex items-start gap-3"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                reached
                  ? 'border-black bg-black text-white'
                  : 'border-beige-300 bg-white text-transparent'
              }`}
            >
              {isCurrent && !reached ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
            <div>
              <p
                className={`font-medium ${reached ? 'text-black' : 'text-gray-400'}`}
              >
                {STATUS_LABELS[stage]}
              </p>
              {isCurrent && (
                <p className="text-sm text-gray-600">
                  {STATUS_DESCRIPTIONS[stage]}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderTracking({ order, isLive = true, onNewOrder }: Props) {
  const { status } = order;
  const cancelled = isCancelled(status);
  const ready = isReady(status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-playfair font-semibold text-black">
          Thank you{order.customerName ? `, ${order.customerName}` : ''}!
        </h1>
        <p className="text-gray-600 mt-2">
          Your order is in. Keep this screen open to follow its progress.
        </p>
        <p
          className="mt-4 inline-block rounded-lg bg-black px-4 py-2 font-mono text-lg font-semibold tracking-wide text-white"
          aria-label="Order number"
        >
          {order.orderNumber}
        </p>
      </div>

      {ready && (
        <div
          data-testid="ready-banner"
          role="status"
          className="mb-8 flex items-center gap-4 rounded-xl border-2 border-black bg-beige-50 p-6 animate-pulse"
        >
          <BellRing className="h-8 w-8 shrink-0 text-black" />
          <div>
            <h2 className="text-xl font-playfair font-semibold text-black">
              Your order is ready!
            </h2>
            <p className="text-sm text-gray-700">
              {STATUS_DESCRIPTIONS.ready}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-playfair font-medium text-black">
              Order Status
            </h2>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                isLive ? 'text-green-700' : 'text-gray-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? 'bg-green-600 animate-pulse' : 'bg-gray-300'
                }`}
              />
              {isLive ? 'Live' : 'Connecting…'}
            </span>
          </div>

          <div
            data-testid="current-status"
            className="mb-6 rounded-lg bg-beige-50 p-4"
          >
            <p className="text-lg font-semibold text-black">
              {STATUS_LABELS[status]}
            </p>
            <p className="text-sm text-gray-600">
              {STATUS_DESCRIPTIONS[status]}
            </p>
          </div>

          {cancelled ? (
            <div className="flex items-center gap-3 text-gray-600">
              <CircleSlash className="h-5 w-5" />
              <p className="text-sm">
                This order is no longer being prepared.
              </p>
            </div>
          ) : (
            <StageTracker status={status} />
          )}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-playfair font-medium text-black mb-6">
            Order Summary
          </h2>

          <div className="bg-beige-50 rounded-lg p-4 mb-4 space-y-0.5">
            {order.customerName && (
              <p className="text-sm text-gray-600">Name: {order.customerName}</p>
            )}
            {order.contactNumber && (
              <p className="text-sm text-gray-600">
                Contact: {order.contactNumber}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Service: {SERVICE_LABELS[order.serviceType]}
            </p>
            {order.address && (
              <p className="text-sm text-gray-600">Address: {order.address}</p>
            )}
            {order.pickupTime && (
              <p className="text-sm text-gray-600">
                Pickup Time: {order.pickupTime}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Payment: {PAYMENT_LABELS[order.paymentMethod]}
            </p>
            {order.notes && (
              <p className="text-sm text-gray-600">Notes: {order.notes}</p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => {
              const details = describeItem(item);

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start justify-between py-2 border-b border-beige-100"
                >
                  <div>
                    <h4 className="font-medium text-black">
                      {item.name} x{item.quantity}
                    </h4>
                    {details && (
                      <p className="text-sm text-gray-600">{details}</p>
                    )}
                  </div>
                  <span className="font-semibold text-black">
                    ₱{item.totalPrice * item.quantity}
                  </span>
                </div>
              );
            })}

            {order.bundleItems?.map((bundle, index) => (
              <div
                key={`${bundle.bundleName}-${index}`}
                className="py-2 border-b border-beige-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded">
                        BUNDLE
                      </span>
                      <h4 className="font-medium text-black">
                        {bundle.bundleName} x{bundle.quantity}
                      </h4>
                    </div>
                    <div className="ml-2 mt-1 space-y-0.5">
                      {bundle.items.map((bundleItem, bundleItemIndex) => {
                        const details = describeItem(bundleItem);

                        return (
                          <p
                            key={`${bundleItem.name}-${bundleItemIndex}`}
                            className="text-sm text-gray-600"
                          >
                            • {bundleItem.name}
                            {details ? ` (${details})` : ''}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                  <span className="font-semibold text-black">
                    ₱{bundle.bundlePrice * bundle.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-beige-200 pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-black">
              <span>Total:</span>
              <span>₱{order.total}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNewOrder}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-black text-white hover:bg-gray-800 hover:scale-[1.02]"
          >
            Place Another Order
          </button>
        </div>
      </div>
    </div>
  );
}
