import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface MobileNavProps {
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onCategoryClick }) => {
  const { categories } = useCategories();

  const handleCategoryClick = (categoryId: string) => {
    onCategoryClick(categoryId);
    
    console.log('MobileNav: Clicking category:', categoryId);
    // Ensure proper scrolling for mobile
    setTimeout(() => {
      const element = document.getElementById(categoryId);
      console.log('MobileNav: Found element:', element);
      if (element) {
        const headerHeight = 64;
        const mobileNavHeight = 60;
        const totalOffset = headerHeight + mobileNavHeight + 32;
        const elementPosition = element.offsetTop - totalOffset;
        console.log('MobileNav: Element offsetTop:', element.offsetTop);
        console.log('MobileNav: Total offset:', totalOffset);
        console.log('MobileNav: Scrolling to position:', elementPosition);
        
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }, 50);
  };
  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-beige-200 md:top-28 md:hidden shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full mr-3 transition-all duration-200 ${
              activeCategory === category.id
                ? 'bg-black text-white'
                : 'bg-beige-100 text-gray-700 hover:bg-beige-200'
            }`}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;