export interface Variation {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  popular?: boolean;
  available?: boolean;
  variations?: Variation[];
  addOns?: AddOn[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedVariation?: Variation;
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderData {
  items: CartItem[];
  customerName: string;
  contactNumber: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  address?: string;
  pickupTime?: string;
  paymentMethod: 'cash' | 'gcash' | 'bank-transfer';
  referenceNumber?: string;
  total: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'gcash' | 'bank-transfer';
export type PaymentMethod = 'cash' | 'gcash' | 'cards';
export type ServiceType = 'dine-in' | 'pickup' | 'delivery';