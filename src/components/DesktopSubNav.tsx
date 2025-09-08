import React, { useEffect, useRef } from 'react';
import { useCategories } from '../hooks/useCategories';

interface DesktopSubNavProps {
  activeCategory?: string;
  onCategoryClick?: (categoryId: string) => void;
}

const DesktopSubNav: React.FC<DesktopSubNavProps> = ({ activeCategory, onCategoryClick }) => {
  const { categories } = useCategories();
  const navRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active category
  useEffect(() => {
    if (activeCategory && navRef.current) {
      const activeElement = navRef.current.querySelector(`[data-category="${activeCategory}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory]);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    } else {
      // Fallback to anchor navigation
      const element = document.getElementById(categoryId);
      if (element) {
        const headerHeight = 64; // Main header height
        const subNavHeight = 60; // SubNav height
        const offset = headerHeight + subNavHeight + 20;
        const elementPosition = element.offsetTop - offset;
        
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="hidden md:block sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-beige-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={navRef}
          className="flex items-center overflow-x-auto scrollbar-hide py-4 space-x-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              data-category={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 font-medium group whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-black text-white shadow-md'
                  : 'text-gray-700 hover:text-black hover:bg-beige-100'
              }`}
            >
              <span className={`text-lg transition-transform duration-200 ${
                activeCategory === category.id ? '' : 'group-hover:scale-110'
              }`}>
                {category.icon}
              </span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopSubNav;