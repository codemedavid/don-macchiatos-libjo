import React from 'react';
import { MenuItem, CartItem, Variation, ServingPreferenceOption, AddOn } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';
import MobileNav from './MobileNav';
import DesktopSubNav from './DesktopSubNav';

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (
    item: MenuItem,
    quantity?: number,
    variations?: Variation[],
    servingPreference?: ServingPreferenceOption,
    addOns?: AddOn[]
  ) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onCustomize?: (item: MenuItem, discountedBasePrice?: number) => void;
}

const Menu: React.FC<MenuProps> = ({
  menuItems,
  addToCart,
  cartItems,
  updateQuantity,
  activeCategory: propActiveCategory,
  onCategoryChange,
  onCustomize
}) => {
  const { categories } = useCategories();
  const [localActiveCategory, setLocalActiveCategory] = React.useState('hot-coffee');
  const mobileContentRef = React.useRef<HTMLDivElement>(null);

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

    // Scroll to the category section
    const element = document.getElementById(categoryId);
    if (element) {
      const headerHeight = 64;
      const subNavHeight = window.innerWidth >= 768 ? 72 : 60;
      const offset = headerHeight + subNavHeight + 20;

      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

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

  // Use Intersection Observer for better section detection
  React.useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let activeSection = '';

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeSection = entry.target.id;
          }
        });

        // Only update if we have a significant intersection and it's different
        if (maxRatio > 0.1 && activeSection && activeSection !== activeCategory) {
          setActiveCategory(activeSection);
        }
      },
      {
        rootMargin: '-140px 0px -50% 0px', // Account for sticky headers
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all category sections
    categories.forEach((category) => {
      const element = document.getElementById(category.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [categories, activeCategory, setActiveCategory]);


  // Scroll to category in the mobile content area (scrolls container, not window)
  const handleMobileCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);

    const container = mobileContentRef.current;
    const element = document.getElementById(`mobile-${categoryId}`);
    if (element && container) {
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: elementTop - 8, behavior: 'smooth' });
    }
  };

  // Intersection Observer for mobile scroll container
  React.useEffect(() => {
    if (categories.length === 0) return;
    const container = mobileContentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let activeSection = '';

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            // Strip "mobile-" prefix to get the actual category id
            activeSection = entry.target.id.replace('mobile-', '');
          }
        });

        if (maxRatio > 0.1 && activeSection) {
          setActiveCategory(activeSection);
        }
      },
      {
        root: container,
        rootMargin: '-10px 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    categories.forEach((category) => {
      const element = document.getElementById(`mobile-${category.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories, setActiveCategory]);

  return (
    <>
      <DesktopSubNav
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Mobile: sidebar + content layout */}
      <div className="md:hidden sticky top-16 z-30 flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <MobileNav
          activeCategory={activeCategory}
          onCategoryClick={handleMobileCategoryClick}
        />
        <div className="flex-1 overflow-y-auto bg-beige-50" ref={mobileContentRef}>
          <div className="px-3 py-4">
            {categories.map((category) => {
              const categoryItems = menuItems.filter(item => item.category === category.id);
              if (categoryItems.length === 0) return null;

              return (
                <section key={category.id} id={`mobile-${category.id}`} className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-1 h-6 bg-espresso-700 rounded-full mr-2" />
                    <h3 className="text-lg font-playfair font-semibold text-black">{category.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {categoryItems.map((item) => {
                      const cartItem = cartItems.find(ci => ci.id === item.id);
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAddToCart={addToCart}
                          quantity={cartItem?.quantity || 0}
                          onUpdateQuantity={updateQuantity}
                          onCustomize={onCustomize}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: original full-width layout */}
      <main className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                      onCustomize={onCustomize}
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
