import React, { useRef, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';

interface MobileNavProps {
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeCategory, onCategoryClick }) => {
  const { categories } = useCategories();
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll sidebar to keep active category visible
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;

      if (elTop < containerTop || elBottom > containerBottom) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeCategory]);

  if (categories.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="md:hidden flex-shrink-0 w-[82px] overflow-y-auto overflow-x-hidden scrollbar-hide bg-white border-r border-beige-200"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryClick(category.id)}
            className={`w-full flex flex-col items-center justify-center py-3 px-1 transition-all duration-200 border-l-[3px] ${
              isActive
                ? 'border-l-espresso-700 bg-espresso-50'
                : 'border-l-transparent hover:bg-beige-50'
            }`}
          >
            <span className="text-2xl mb-1">{category.icon}</span>
            <span
              className={`text-[10px] leading-tight text-center font-medium line-clamp-2 ${
                isActive ? 'text-espresso-800' : 'text-gray-500'
              }`}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNav;