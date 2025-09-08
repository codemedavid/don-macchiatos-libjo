import React from 'react';
import { useCategories } from '../hooks/useCategories';

const DesktopSubNav: React.FC = () => {
  const { categories } = useCategories();

  if (categories.length === 0) return null;

  return (
    <div className="hidden md:block sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-beige-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center space-x-8 py-4">
          {categories.map((category) => (
            <a 
              key={category.id}
              href={`#${category.id}`} 
              className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200 font-medium group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                {category.icon}
              </span>
              <span>{category.name}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default DesktopSubNav;