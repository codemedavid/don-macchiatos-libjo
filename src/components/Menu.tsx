import React from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';
import MobileNav from './MobileNav';

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}

const Menu: React.FC<MenuProps> = ({ 
  menuItems, 
  addToCart, 
  cartItems, 
  updateQuantity, 
  activeCategory: propActiveCategory,
  onCategoryChange 
}) => {
  const { categories } = useCategories();
  const [localActiveCategory, setLocalActiveCategory] = React.useState('hot-coffee');
  
  const activeCategory = propActiveCategory || localActiveCategory;
  const setActiveCategory = onCategoryChange || setLocalActiveCategory;

  // Preload all images immediately when component mounts
  React.useEffect(() => {
    const preloadImages = () => {
      menuItems.forEach(item => {
        if (item.image) {
          const img = new Image();
          img.src = item.image;
        }
      });
    };
    
    // Start preloading immediately
    preloadImages();
  }, [menuItems]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    console.log('Menu: Clicking category:', categoryId);
    // Scroll to the category section with proper offset
    const element = document.getElementById(categoryId);
    console.log('Menu: Found element:', element);
    if (element) {
      const headerHeight = 64;
      const subNavHeight = window.innerWidth >= 768 ? 72 : 60; // Desktop subnav or mobile nav
      const totalOffset = headerHeight + subNavHeight + 32;
      const elementPosition = element.offsetTop - totalOffset;
      console.log('Menu: Element offsetTop:', element.offsetTop);
      console.log('Menu: Total offset:', totalOffset);
      console.log('Menu: Scrolling to position:', elementPosition);
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    if (categories.length > 0 && !categories.find(cat => cat.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Improved scroll detection for active category
  React.useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => ({
        id: cat.id,
        element: document.getElementById(cat.id)
      })).filter(section => section.element);
      
      const headerHeight = 64;
      const subNavHeight = window.innerWidth >= 768 ? 72 : 60;
      const scrollPosition = window.scrollY + headerHeight + subNavHeight + 100;

      // Find the section that's currently in view
      let currentSection = sections[0]?.id;
      
      for (const section of sections) {
        if (section.element && section.element.offsetTop <= scrollPosition) {
          currentSection = section.id;
        } else {
          break;
        }
      }
      
      if (currentSection && currentSection !== activeCategory) {
        setActiveCategory(currentSection);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [categories, activeCategory, setActiveCategory]);

  // Initial scroll detection on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const handleScroll = () => {
        const sections = categories.map(cat => ({
          id: cat.id,
          element: document.getElementById(cat.id)
        })).filter(section => section.element);
        
        const headerHeight = 64;
        const subNavHeight = window.innerWidth >= 768 ? 72 : 60;
        const scrollPosition = window.scrollY + headerHeight + subNavHeight + 100;

        let currentSection = sections[0]?.id;
        
        for (const section of sections) {
          if (section.element && section.element.offsetTop <= scrollPosition) {
            currentSection = section.id;
          } else {
            break;
          }
        }
        
        if (currentSection && currentSection !== activeCategory) {
          setActiveCategory(categories[i].id);
        }
      };
      handleScroll();
    }, 100);

    return () => clearTimeout(timer);
  }, [categories]);

  React.useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => ({
        id: cat.id,
        element: document.getElementById(cat.id)
      })).filter(section => section.element);
      
      const headerHeight = 64;
      const subNavHeight = window.innerWidth >= 768 ? 72 : 60;
      const scrollPosition = window.scrollY + headerHeight + subNavHeight + 100;

      let currentSection = sections[0]?.id;
      
      for (const section of sections) {
        if (section.element && section.element.offsetTop <= scrollPosition) {
          currentSection = section.id;
        } else {
          break;
        }
      }
      
      if (currentSection && currentSection !== activeCategory) {
        setActiveCategory(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, setActiveCategory]);


  return (
    <>
      <MobileNav 
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-playfair font-semibold text-black mb-4">Our Menu</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our selection of premium coffees, refreshing drinks, and delicious pastries, 
          all crafted with love and the finest ingredients.
        </p>
      </div>

      {categories.map((category) => {
        const categoryItems = menuItems.filter(item => item.category === category.id);
        
        if (categoryItems.length === 0) return null;
        
        return (
          <section key={category.id} id={category.id} className="mb-16">
            <div className="flex items-center mb-8">
              <span className="text-3xl mr-3">{category.icon}</span>
              <h3 className="text-3xl font-playfair font-medium text-black">{category.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryItems.map((item) => {
                const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                    quantity={cartItem?.quantity || 0}
                    onUpdateQuantity={updateQuantity}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      </main>
    </>
  );
};

export default Menu;