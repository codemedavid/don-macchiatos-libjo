export interface Variation {
  id: string;
  name: string;
  price: number;
  type: string;
}

export interface ServingPreferenceOption {
  id: string;
  name: string;
  value: string;
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
  sort_order?: number;
  variations?: Variation[];
  servingPreferences?: ServingPreferenceOption[];
  addOns?: AddOn[];
}

export interface CartItem extends MenuItem {
  menuItemId: string;
  quantity: number;
  selectedVariations?: Variation[];
  selectedServingPreference?: ServingPreferenceOption;
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

export interface PromotionalBanner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  active: boolean;
  sort_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'gcash' | 'bank-transfer' | 'cards';
export type ServiceType = 'dine-in' | 'pickup' | 'delivery';

export type UpsellType = 'best_pair' | 'upgrade_meal' | 'before_you_go';

export interface Upsell {
  id: string;
  type: UpsellType;
  name: string;
  description: string;
  trigger_item_ids: string[];
  offer_item_ids: string[];
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value: number;
  active: boolean;
  sort_order: number;
  image_url?: string;
  skip_label: string;
  accept_label: string;
  created_at: string;
  updated_at: string;
}
