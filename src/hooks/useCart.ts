import { useState, useCallback } from 'react';
import { CartItem, CartBundleItem, MenuItem, Variation, ServingPreferenceOption, AddOn, Bundle } from '../types';

interface ItemCustomization {
  selectedVariations: Record<string, Variation>;
  selectedServingPreference?: ServingPreferenceOption;
  selectedAddOns: AddOn[];
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bundleCartItems, setBundleCartItems] = useState<CartBundleItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const calculateItemPrice = (
    item: MenuItem,
    variations?: Variation[],
    servingPreference?: ServingPreferenceOption,
    addOns?: AddOn[]
  ) => {
    let price = item.basePrice;
    if (variations) {
      variations.forEach(v => {
        price += v.price;
      });
    }
    if (servingPreference) {
      price += servingPreference.price;
    }
    if (addOns) {
      addOns.forEach(addOn => {
        price += addOn.price;
      });
    }
    return price;
  };

  const addToCart = useCallback((
    item: MenuItem,
    quantity: number = 1,
    variations?: Variation[],
    servingPreference?: ServingPreferenceOption,
    addOns?: AddOn[]
  ) => {
    const totalPrice = calculateItemPrice(item, variations, servingPreference, addOns);

    const variationIds = variations?.map(v => v.id).sort().join(',') || 'none';
    const uniqueId = `${item.id}-${variationIds}-${servingPreference?.id || 'default'}-${addOns?.map(a => a.id).join(',') || 'none'}`;

    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === uniqueId);

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [...prev, {
          ...item,
          id: uniqueId,
          menuItemId: item.id,
          quantity,
          selectedVariations: variations || [],
          selectedServingPreference: servingPreference,
          selectedAddOns: addOns || [],
          totalPrice
        }];
      }
    });
  }, []);

  const addBundleToCart = useCallback((
    bundle: Bundle,
    quantity: number,
    itemCustomizations: Map<string, ItemCustomization>
  ) => {
    // Build cart items from customizations
    const items: CartItem[] = bundle.items.map(bi => {
      const customization = itemCustomizations.get(bi.id);
      const variations = customization ? Object.values(customization.selectedVariations) : [];
      const servingPreference = customization?.selectedServingPreference;
      const addOns = customization?.selectedAddOns || [];

      // Item base price within bundle is 0 (bundle has its own pricing)
      // But we store the original basePrice for display
      return {
        ...bi.menuItem,
        id: bi.id,
        menuItemId: bi.menu_item_id,
        quantity: 1,
        selectedVariations: variations,
        selectedServingPreference: servingPreference,
        selectedAddOns: addOns,
        totalPrice: bi.menuItem.basePrice,
      };
    });

    // Calculate bundle price
    const originalPrice = bundle.items.reduce((sum, bi) => sum + bi.menuItem.basePrice, 0);
    let bundleBasePrice: number;
    if (bundle.pricing_type === 'fixed') {
      bundleBasePrice = bundle.fixed_price;
    } else if (bundle.discount_type === 'fixed') {
      bundleBasePrice = Math.max(0, originalPrice - bundle.discount_value);
    } else if (bundle.discount_type === 'percentage') {
      bundleBasePrice = originalPrice * (1 - bundle.discount_value / 100);
    } else {
      bundleBasePrice = originalPrice;
    }

    // Add-ons are extra on top of bundle price
    const addOnsTotal = items.reduce((sum, item) =>
      sum + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0), 0
    );

    const bundlePrice = bundleBasePrice + addOnsTotal;

    // Generate unique ID from bundle + all customization selections
    const customizationKey = items.map(item => {
      const varKey = item.selectedVariations?.map(v => v.id).sort().join(',') || '';
      const spKey = item.selectedServingPreference?.id || '';
      const aoKey = item.selectedAddOns?.map(a => a.id).sort().join(',') || '';
      return `${item.menuItemId}:${varKey}:${spKey}:${aoKey}`;
    }).join('|');
    const uniqueId = `bundle-${bundle.id}-${customizationKey}`;

    setBundleCartItems(prev => {
      const existing = prev.find(b => b.id === uniqueId);
      if (existing) {
        return prev.map(b =>
          b.id === uniqueId
            ? { ...b, quantity: b.quantity + quantity }
            : b
        );
      }
      return [...prev, {
        id: uniqueId,
        bundleId: bundle.id,
        bundleName: bundle.name,
        bundleImage: bundle.image_url,
        quantity,
        items,
        bundlePrice,
        originalPrice: originalPrice + addOnsTotal,
      }];
    });
  }, []);

  const updateBundleQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeBundleFromCart(id);
      return;
    }
    setBundleCartItems(prev =>
      prev.map(b => b.id === id ? { ...b, quantity } : b)
    );
  }, []);

  const removeBundleFromCart = useCallback((id: string) => {
    setBundleCartItems(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setBundleCartItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    const itemsTotal = cartItems.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
    const bundlesTotal = bundleCartItems.reduce((total, b) => total + (b.bundlePrice * b.quantity), 0);
    return itemsTotal + bundlesTotal;
  }, [cartItems, bundleCartItems]);

  const getTotalItems = useCallback(() => {
    const itemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const bundlesCount = bundleCartItems.reduce((total, b) => total + b.quantity, 0);
    return itemsCount + bundlesCount;
  }, [cartItems, bundleCartItems]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    bundleCartItems,
    isCartOpen,
    addToCart,
    addBundleToCart,
    updateQuantity,
    updateBundleQuantity,
    removeFromCart,
    removeBundleFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    openCart,
    closeCart
  };
};
