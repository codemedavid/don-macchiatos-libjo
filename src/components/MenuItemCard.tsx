import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { MenuItem, Variation, AddOn, ServingPreferenceOption } from '../types';
import ProductDetailModal from './ProductDetailModal';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    quantity?: number,
    variation?: Variation,
    servingPreference?: ServingPreferenceOption,
    addOns?: AddOn[]
  ) => void;
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

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-scale-in cursor-pointer ${!item.available ? 'opacity-60' : ''}`}
        onClick={() => item.available && setShowCustomization(true)}
      >
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
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
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
          <p className={`text-sm mb-4 leading-relaxed line-clamp-2 ${!item.available ? 'text-gray-400' : 'text-gray-600'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="text-lg font-semibold text-black">
                ₱{item.basePrice}
                {item.variations && item.variations.length > 0 && (
                  <span className="text-sm text-gray-500 ml-1">starting</span>
                )}
              </span>
            </div>

            {!item.available ? (
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-4 py-2 rounded-full cursor-not-allowed font-medium text-sm"
              >
                Unavailable
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCustomization(true);
                }}
                className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 font-medium text-sm"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-beige-100 rounded-full p-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDecrement}
                  className="p-1.5 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-black min-w-[20px] text-center text-sm">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="p-1.5 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDetailModal
        item={item}
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onAddToCart={onAddToCart}
      />
    </>
  );
};

export default MenuItemCard;
