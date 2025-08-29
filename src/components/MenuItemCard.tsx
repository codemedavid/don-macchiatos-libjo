import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity 
}) => {
  const handleAddToCart = () => {
    onAddToCart(item, 1);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-scale-in">
      {item.popular && (
        <div className="bg-black text-white text-xs font-medium px-3 py-1 rounded-full absolute top-4 right-4 z-10">
          Popular
        </div>
      )}
      
      <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-cream-100 to-beige-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl opacity-30">☕</div>
        </div>
      </div>
      
      <div className="p-6">
        <h4 className="text-xl font-playfair font-medium text-black mb-2">{item.name}</h4>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold text-black">₱{item.price}</span>
          
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 font-medium"
            >
              Add to Cart
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
      </div>
    </div>
  );
};

export default MenuItemCard;