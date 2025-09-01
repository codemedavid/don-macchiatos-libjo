import React, { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity 
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  const calculatePrice = () => {
    let price = item.basePrice;
    if (selectedVariation) {
      price = item.basePrice + selectedVariation.price;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    onAddToCart(item, 1, selectedVariation, selectedAddOns);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.id === addOn.id);
      if (exists) {
        return prev.filter(a => a.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-scale-in ${!item.available ? 'opacity-60' : ''}`}>
        {item.popular && (
          <div className="bg-black text-white text-xs font-medium px-3 py-1 rounded-full absolute top-4 right-4 z-10">
            Popular
          </div>
        )}
        
        {!item.available && (
          <div className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full absolute top-4 left-4 z-10">
            Unavailable
          </div>
        )}
        
        <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-cream-100 to-beige-200 relative">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
              loading="eager"
              decoding="sync"
              fetchpriority="high"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-6xl opacity-30">☕</div>
          </div>
        </div>
        
        <div className="p-6">
          <h4 className="text-xl font-playfair font-medium text-black mb-2">{item.name}</h4>
          <p className={`text-sm mb-4 leading-relaxed ${!item.available ? 'text-gray-400' : 'text-gray-600'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-lg font-semibold text-black">
                ₱{item.basePrice}
                {item.variations && item.variations.length > 0 && (
                  <span className="text-sm text-gray-500 ml-1">starting</span>
                )}
              </span>
              {item.variations && item.variations.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.variations.length} size{item.variations.length > 1 ? 's' : ''} available
                </div>
              )}
            </div>
            
            {!item.available ? (
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-6 py-2 rounded-full cursor-not-allowed font-medium"
              >
                Unavailable
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 font-medium"
              >
                {item.variations?.length || item.addOns?.length ? 'Customize' : 'Add to Cart'}
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-beige-100 rounded-full p-1">
                <button
                  onClick={handleDecrement}
                  className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-black min-w-[24px] text-center">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="p-2 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {item.addOns && item.addOns.length > 0 && (
            <div className="text-xs text-gray-500">
              {item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''} available
            </div>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-beige-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-playfair font-medium text-black">Customize {item.name}</h3>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-beige-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-black mb-3">Choose Size</h4>
                  <div className="space-y-2">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className="flex items-center justify-between p-3 border border-beige-300 rounded-lg hover:bg-beige-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-black focus:ring-cream-500"
                          />
                          <span className="font-medium text-black">{variation.name}</span>
                        </div>
                        <span className="text-black font-medium">
                          ₱{item.basePrice + variation.price}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-black mb-3">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-2">
                        {addOns.map((addOn) => (
                          <label
                            key={addOn.id}
                            className="flex items-center justify-between p-3 border border-beige-300 rounded-lg hover:bg-beige-50 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedAddOns.some(a => a.id === addOn.id)}
                                onChange={() => toggleAddOn(addOn)}
                                className="rounded border-beige-300 text-black focus:ring-cream-500"
                              />
                              <span className="font-medium text-black">{addOn.name}</span>
                            </div>
                            <span className="text-black font-medium">
                              {addOn.price > 0 ? `+₱${addOn.price}` : 'Free'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-beige-200 pt-4 mb-6">
                <div className="flex items-center justify-between text-xl font-playfair font-semibold text-black">
                  <span>Total:</span>
                  <span>₱{calculatePrice()}</span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                Add to Cart - ₱{calculatePrice()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;