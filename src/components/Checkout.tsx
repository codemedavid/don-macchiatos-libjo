import React, { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { CartItem, CartBundleItem, PaymentMethod, ServiceType } from '../types';

interface CheckoutProps {
  cartItems: CartItem[];
  bundleCartItems: CartBundleItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, bundleCartItems, totalPrice, onBack }) => {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  // Scroll to top when step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const paymentMethods = {
    cash: { name: 'Cash', icon: '' },
    gcash: { name: 'GCash', icon: '💳' },
    cards: { name: 'Credit/Debit Cards', icon: '💳' }
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    const timeInfo = serviceType === 'pickup'
      ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`)
      : '';

    // Build regular items text
    const regularItemsText = cartItems.map(item => {
      let itemDetails = `• ${item.name}`;
      if (item.selectedVariations && item.selectedVariations.length > 0) {
        itemDetails += ` (${item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(', ')})`;
      }
      if (item.selectedServingPreference) {
        itemDetails += ` [${item.selectedServingPreference.name}]`;
      }
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        itemDetails += ` + ${item.selectedAddOns.map(addOn => addOn.name).join(', ')}`;
      }
      itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
      return itemDetails;
    }).join('\n');

    // Build bundle items text
    const bundleItemsText = bundleCartItems.map(bundle => {
      let bundleText = `📦 BUNDLE: ${bundle.bundleName} x${bundle.quantity} - ₱${bundle.bundlePrice * bundle.quantity}`;
      bundle.items.forEach(item => {
        let itemLine = `    • ${item.name}`;
        if (item.selectedVariations && item.selectedVariations.length > 0) {
          itemLine += ` (${item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(', ')})`;
        }
        if (item.selectedServingPreference) {
          itemLine += ` [${item.selectedServingPreference.name}]`;
        }
        if (item.selectedAddOns && item.selectedAddOns.length > 0) {
          itemLine += ` + ${item.selectedAddOns.map(addOn => addOn.name).join(', ')}`;
        }
        bundleText += `\n${itemLine}`;
      });
      return bundleText;
    }).join('\n');

    const allItemsText = [regularItemsText, bundleItemsText].filter(Boolean).join('\n');

    const orderDetails = `
🛒 DON MACCHIATOS ORDER

${customerName ? `👤 Customer: ${customerName}` : ''}
${contactNumber ? `📞 Contact: ${contactNumber}` : ''}
📍 Service: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
${serviceType === 'delivery' ? `🏠 Address: ${address}` : ''}
${serviceType === 'pickup' ? `⏰ Pickup Time: ${timeInfo}` : ''}


📋 ORDER DETAILS:
${allItemsText}

💰 TOTAL: ₱${totalPrice}

💳 Payment Method: ${paymentMethods[paymentMethod].name}

${notes ? `📝 Notes: ${notes}` : ''}

Please confirm this order to proceed. Thank you for choosing Don Macchiatos! ☕
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    window.open(`https://www.messenger.com/t/donmacchiatospdi?text=${encodedMessage}`, '_blank');

  };

  const isDetailsValid =
    (serviceType === 'dine-in' || (customerName && contactNumber)) &&
    (serviceType !== 'delivery' || address) &&
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime));

  // Render order summary items (used in both steps)
  const renderOrderSummary = () => (
    <div className="space-y-4 mb-6">
      {cartItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b border-beige-100">
          <div>
            <h4 className="font-medium text-black">{item.name}</h4>
            {item.selectedVariations && item.selectedVariations.length > 0 && (
              <p className="text-sm text-gray-600">
                {item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(' · ')}
              </p>
            )}
            {item.selectedServingPreference && (
              <p className="text-sm text-gray-600">Serving: {item.selectedServingPreference.name}</p>
            )}
            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
              <p className="text-sm text-gray-600">
                Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
              </p>
            )}
            <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
          </div>
          <span className="font-semibold text-black">₱{item.totalPrice * item.quantity}</span>
        </div>
      ))}

      {/* Bundle Items */}
      {bundleCartItems.map((bundle) => (
        <div key={bundle.id} className="py-2 border-b border-beige-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded">BUNDLE</span>
                <h4 className="font-medium text-black">{bundle.bundleName}</h4>
              </div>
              <div className="ml-2 mt-1 space-y-0.5">
                {bundle.items.map(item => (
                  <p key={item.id} className="text-sm text-gray-600">
                    • {item.name}
                    {item.selectedVariations && item.selectedVariations.length > 0 && (
                      <span> ({item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(', ')})</span>
                    )}
                    {item.selectedServingPreference && (
                      <span> [{item.selectedServingPreference.name}]</span>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <span> + {item.selectedAddOns.map(a => a.name).join(', ')}</span>
                    )}
                  </p>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">₱{bundle.bundlePrice} x {bundle.quantity}</p>
            </div>
            <span className="font-semibold text-black">₱{bundle.bundlePrice * bundle.quantity}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-black ml-8">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-playfair font-medium text-black mb-6">Order Summary</h2>
            {renderOrderSummary()}
            <div className="border-t border-beige-200 pt-4">
              <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-black">
                <span>Total:</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-playfair font-medium text-black mb-6">Customer Information</h2>

            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name {serviceType !== 'dine-in' ? '*' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-espresso-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  required={serviceType !== 'dine-in'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Contact Number {serviceType !== 'dine-in' ? '*' : '(Optional)'}
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-espresso-500 focus:border-transparent transition-all duration-200"
                  placeholder="09XX XXX XXXX"
                  required={serviceType !== 'dine-in'}
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">Service Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dine-in', label: 'Dine In', icon: '🪑' },
                    { value: 'pickup', label: 'Pickup', icon: '🚶' },
                    { value: 'delivery', label: 'Delivery', icon: '🛵' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value as ServiceType)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${serviceType === option.value
                        ? 'border-black bg-black text-white'
                        : 'border-beige-300 bg-white text-gray-700 hover:border-beige-400'
                        }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Time Selection */}
              {serviceType === 'pickup' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-3">Pickup Time *</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: '5-10', label: '5-10 minutes' },
                        { value: '15-20', label: '15-20 minutes' },
                        { value: '25-30', label: '25-30 minutes' },
                        { value: 'custom', label: 'Custom Time' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPickupTime(option.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${pickupTime === option.value
                            ? 'border-black bg-black text-white'
                            : 'border-beige-300 bg-white text-gray-700 hover:border-beige-400'
                            }`}
                        >
                          <Clock className="h-4 w-4 mx-auto mb-1" />
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {pickupTime === 'custom' && (
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-espresso-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., 45 minutes, 1 hour, 2:30 PM"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {serviceType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Delivery Address *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-espresso-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your complete delivery address"
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-espresso-500 focus:border-transparent transition-all duration-200"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${isDetailsValid
                  ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-black ml-8">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-playfair font-medium text-black mb-6">Choose Payment Method</h2>

          <div className="grid grid-cols-1 gap-4 mb-6">
            {[
              { value: 'cash', label: 'Cash', icon: '💰' },
              { value: 'gcash', label: 'GCash', icon: '💳' },

              { value: 'cards', label: 'Credit/Debit Cards', icon: '💳' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${paymentMethod === option.value
                  ? 'border-black bg-black text-white'
                  : 'border-beige-300 bg-white text-gray-700 hover:border-beige-400'
                  }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-beige-50 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-black mb-2">Selected Payment Method</h3>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{paymentMethods[paymentMethod].icon}</span>
              <span className="text-lg font-medium text-black">{paymentMethods[paymentMethod].name}</span>
            </div>
            <p className="text-xl font-semibold text-black mt-4">Total Amount: ₱{totalPrice}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-playfair font-medium text-black mb-6">Final Order Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="bg-beige-50 rounded-lg p-4">
              <h4 className="font-medium text-black mb-2">Customer Details</h4>
              {customerName && <p className="text-sm text-gray-600">Name: {customerName}</p>}
              {contactNumber && <p className="text-sm text-gray-600">Contact: {contactNumber}</p>}
              <p className="text-sm text-gray-600">Service: {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</p>
              {serviceType === 'delivery' && <p className="text-sm text-gray-600">Address: {address}</p>}
              {serviceType === 'pickup' && (
                <p className="text-sm text-gray-600">
                  Pickup Time: {pickupTime === 'custom' ? customTime : `${pickupTime} minutes`}
                </p>
              )}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-beige-100">
                <div>
                  <h4 className="font-medium text-black">{item.name}</h4>
                  {item.selectedVariations && item.selectedVariations.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(' · ')}
                    </p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-black">₱{item.totalPrice * item.quantity}</span>
              </div>
            ))}

            {/* Bundle Items in Final Summary */}
            {bundleCartItems.map((bundle) => (
              <div key={bundle.id} className="py-2 border-b border-beige-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded">BUNDLE</span>
                      <h4 className="font-medium text-black">{bundle.bundleName}</h4>
                    </div>
                    <div className="ml-2 mt-1 space-y-0.5">
                      {bundle.items.map(item => (
                        <p key={item.id} className="text-sm text-gray-600">
                          • {item.name}
                          {item.selectedVariations && item.selectedVariations.length > 0 && (
                            <span> ({item.selectedVariations.map(v => `${v.type}: ${v.name}`).join(', ')})</span>
                          )}
                          {item.selectedServingPreference && (
                            <span> [{item.selectedServingPreference.name}]</span>
                          )}
                        </p>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">₱{bundle.bundlePrice} x {bundle.quantity}</p>
                  </div>
                  <span className="font-semibold text-black">₱{bundle.bundlePrice * bundle.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-beige-200 pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-black">
              <span>Total:</span>
              <span>₱{totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-black text-white hover:bg-gray-800 hover:scale-[1.02]"
          >
            Place Order via Messenger
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
