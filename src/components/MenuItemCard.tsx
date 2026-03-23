import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { MenuItem, Variation, AddOn, ServingPreferenceOption } from '../types';
import ProductDetailModal from './ProductDetailModal';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    quantity?: number,
    variations?: Variation[],
    servingPreference?: ServingPreferenceOption,
    addOns?: AddOn[]
  ) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCustomize?: (item: MenuItem, discountedBasePrice?: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  quantity,
  onUpdateQuantity,
  onCustomize
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
        className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-scale-in cursor-pointer relative ${!item.available ? 'opacity-60' : ''}`}
        onClick={() => item.available && setShowCustomization(true)}
      >
        {item.popular && (
          <div className="bg-black text-white text-[10px] md:text-xs font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-full absolute top-2 right-2 md:top-4 md:right-4 z-10">
            Popular
          </div>
        )}

        {!item.available && (
          <div className="bg-red-500 text-white text-[10px] md:text-xs font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-full absolute top-2 left-2 md:top-4 md:left-4 z-10">
            Unavailable
          </div>
        )}

        <div className="bg-gradient-to-br from-espresso-50 to-beige-200 relative flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-28 md:h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              loading="eager"
              decoding="sync"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-4xl md:text-6xl opacity-30">☕</div>
          </div>
        </div>

        <div className="p-3 md:p-6">
          <h4 className="text-sm md:text-xl font-playfair font-medium text-black mb-0.5 md:mb-2 line-clamp-2">{item.name}</h4>
          <p className={`text-xs md:text-sm mb-2 md:mb-4 leading-snug md:leading-relaxed line-clamp-1 md:line-clamp-2 ${!item.available ? 'text-gray-400' : 'text-gray-500'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm md:text-lg font-semibold text-black">
              ₱{item.basePrice}
            </span>

            {!item.available ? (
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-2 py-1 md:px-4 md:py-2 rounded-full cursor-not-allowed font-medium text-[10px] md:text-sm"
              >
                N/A
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCustomization(true);
                }}
                className="bg-black text-white px-3 py-1 md:px-5 md:py-2 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-xs md:text-sm"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 md:space-x-3 bg-beige-100 rounded-full p-0.5 md:p-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDecrement}
                  className="p-1 md:p-1.5 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Minus className="h-3 w-3 md:h-4 md:w-4" />
                </button>
                <span className="font-semibold text-black min-w-[16px] md:min-w-[20px] text-center text-xs md:text-sm">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="p-1 md:p-1.5 hover:bg-beige-200 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
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
        onCustomize={onCustomize}
      />
    </>
  );
};

export default MenuItemCard;
