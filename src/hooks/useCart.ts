import { useState, useCallback } from 'react';
import { CartItem, MenuItem, Variation, ServingPreferenceOption, AddOn } from '../types';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    openCart,
    closeCart
  };
};
