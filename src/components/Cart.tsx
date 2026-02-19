import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem, CartBundleItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  bundleCartItems: CartBundleItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateBundleQuantity: (id: string, quantity: number) => void;
  removeBundleFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  bundleCartItems,
  updateQuantity,
  removeFromCart,
  updateBundleQuantity,
  removeBundleFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  const isEmpty = cartItems.length === 0 && bundleCartItems.length === 0;

  if (isEmpty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-2xl font-playfair font-medium text-black mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-200"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Continue Shopping</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-black">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-500 hover:text-red-600 transition-colors duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        {/* Regular Cart Items */}
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 || bundleCartItems.length > 0 ? 'border-b border-beige-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-playfair font-medium text-black mb-1">{item.name}</h3>
                {item.selectedVariations && item.selectedVariations.length > 0 && (
                  <p className="text-sm text-gray-500 mb-1">
                    {item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(' · ')}
                  </p>
                )}
                {item.selectedServingPreference && (
                  <p className="text-sm text-gray-500 mb-1">
                    Serving: {item.selectedServingPreference.name}
                  </p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-gray-500 mb-1">
                    Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                  </p>
                )}
                <p className="text-lg font-semibold text-black">₱{item.totalPrice} each</p>
              </div>

              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-beige-100 rounded-full p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-black min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-black">₱{item.totalPrice * item.quantity}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Bundle Cart Items */}
        {bundleCartItems.map((bundle, index) => (
          <div key={bundle.id} className={`p-6 ${index !== bundleCartItems.length - 1 ? 'border-b border-beige-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded">BUNDLE</span>
                  <h3 className="text-lg font-playfair font-medium text-black">{bundle.bundleName}</h3>
                </div>
                {/* List each item in the bundle */}
                <div className="ml-2 space-y-1 mb-2">
                  {bundle.items.map(item => (
                    <div key={item.id} className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      {item.selectedVariations && item.selectedVariations.length > 0 && (
                        <span> ({item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(', ')})</span>
                      )}
                      {item.selectedServingPreference && (
                        <span> [{item.selectedServingPreference.name}]</span>
                      )}
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <span> + {item.selectedAddOns.map(a => a.name).join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-black">₱{bundle.bundlePrice} each</p>
                  {bundle.bundlePrice < bundle.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">₱{bundle.originalPrice}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-beige-100 rounded-full p-1">
                  <button
                    onClick={() => updateBundleQuantity(bundle.id, bundle.quantity - 1)}
                    className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-black min-w-[32px] text-center">{bundle.quantity}</span>
                  <button
                    onClick={() => updateBundleQuantity(bundle.id, bundle.quantity + 1)}
                    className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-black">₱{bundle.bundlePrice * bundle.quantity}</p>
                </div>

                <button
                  onClick={() => removeBundleFromCart(bundle.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-black mb-6">
          <span>Total:</span>
          <span>₱{parseFloat(getTotalPrice() || 0).toFixed(2)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
