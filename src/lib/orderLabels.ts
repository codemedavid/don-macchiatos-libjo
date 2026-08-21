import type { PaymentMethod, ServiceType } from '../types';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  'bank-transfer': 'Bank Transfer',
  cards: 'Credit/Debit Cards',
};

export const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  cash: '💰',
  gcash: '💳',
  'bank-transfer': '🏦',
  cards: '💳',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  'dine-in': 'Dine In',
  pickup: 'Pickup',
  delivery: 'Delivery',
};
