import React from 'react';
import { ShoppingCart, Coffee } from 'lucide-react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-beige-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={onMenuClick}
            className="flex items-center space-x-2 text-black hover:text-cream-600 transition-colors duration-200"
          >
            <img src="/logo.jpg" className="w-4 h-4"/>
            <h1 className="text-2xl font-playfair font-semibold">Beracah Cafe</h1>
          </button>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#hot-coffee" className="text-gray-700 hover:text-black transition-colors duration-200">Hot Coffee</a>
            <a href="#iced-coffee" className="text-gray-700 hover:text-black transition-colors duration-200">Iced Coffee</a>
            <a href="#non-coffee" className="text-gray-700 hover:text-black transition-colors duration-200">Non-Coffee</a>
            <a href="#food" className="text-gray-700 hover:text-black transition-colors duration-200">Food</a>
          </nav>
          
          <button 
            onClick={onCartClick}
            className="relative p-2 text-gray-700 hover:text-black hover:bg-beige-100 rounded-full transition-all duration-200"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;