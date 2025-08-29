import React, { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { CartItem, PaymentMethod, ServiceType } from '../types';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Scroll to top when step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const paymentDetails = {
    gcash: {
      name: 'GCash',
      number: '09XX XXX XXXX',
      accountName: 'Beracah Cafe',
      qr: 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    maya: {
      name: 'Maya (PayMaya)',
      number: '09XX XXX XXXX',
      accountName: 'Beracah Cafe',
      qr: 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    'bank-transfer': {
      name: 'Bank Transfer',
      number: 'Account: 1234-5678-9012',
      accountName: 'Beracah Cafe',
      qr: 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    }
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const timeInfo = serviceType === 'pickup' 
      ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`)
      : '';

    const orderDetails = `
🛒 BERACAH CAFE ORDER

👤 Customer: ${customerName}
📞 Contact: ${contactNumber}
📍 Service: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
${serviceType === 'delivery' ? `🏠 Address: ${address}` : ''}
${serviceType === 'pickup' ? `⏰ Pickup Time: ${timeInfo}` : ''}

📋 ORDER DETAILS:
${cartItems.map(item => `• ${item.name} x${item.quantity} - ₱${item.price * item.quantity}`).join('\n')}

💰 TOTAL: ₱${totalPrice}

💳 Payment: ${paymentDetails[paymentMethod].name}
🔗 Reference: ${referenceNumber}

${notes ? `📝 Notes: ${notes}` : ''}

Please confirm this order to proceed. Thank you for choosing Beracah Cafe! ☕
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/BeracahCafeUptown?text=${encodedMessage}`;
    
    window.open(messengerUrl, '_blank');
    
  };

  const isDetailsValid = customerName && contactNumber && (serviceType !== 'delivery' || address) && (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime));
  const isPaymentValid = referenceNumber;

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
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-beige-100">
                  <div>
                    <h4 className="font-medium text-black">{item.name}</h4>
                    <p className="text-sm text-gray-600">₱{item.price} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-black">₱{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
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
                <label className="block text-sm font-medium text-black mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
                  placeholder="09XX XXX XXXX"
                  required
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
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        serviceType === option.value
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
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                            pickupTime === option.value
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
                        className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid
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
              { value: 'gcash', label: 'GCash', icon: '💳' },
              { value: 'maya', label: 'Maya', icon: '💰' },
              { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  paymentMethod === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-beige-300 bg-white text-gray-700 hover:border-beige-400'
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code */}
          <div className="bg-beige-50 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-black mb-4">Payment Details</h3>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{paymentDetails[paymentMethod].name}</p>
                <p className="font-mono text-black font-medium">{paymentDetails[paymentMethod].number}</p>
                <p className="text-sm text-gray-600 mb-3">Account Name: {paymentDetails[paymentMethod].accountName}</p>
                <p className="text-xl font-semibold text-black">Amount: ₱{totalPrice}</p>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src={paymentDetails[paymentMethod].qr} 
                  alt={`${paymentDetails[paymentMethod].name} QR Code`}
                  className="w-32 h-32 rounded-lg border-2 border-beige-300 shadow-sm"
                />
                <p className="text-xs text-gray-500 text-center mt-2">Scan to pay</p>
              </div>
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Payment Reference Number *</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter payment reference number"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the reference number from your payment confirmation
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-playfair font-medium text-black mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-beige-50 rounded-lg p-4">
              <h4 className="font-medium text-black mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
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
                  <p className="text-sm text-gray-600">₱{item.price} x {item.quantity}</p>
                </div>
                <span className="font-semibold text-black">₱{item.price * item.quantity}</span>
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
            disabled={!isPaymentValid}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
              isPaymentValid
                ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
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