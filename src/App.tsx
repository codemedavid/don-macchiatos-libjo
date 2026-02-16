import React from 'react';
import { MenuItem } from './types';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingCartButton from './components/FloatingCartButton';
import AdminDashboard from './components/AdminDashboard';
import BannerCarousel from './components/BannerCarousel';
import UpgradeMealUpsell from './components/UpgradeMealUpsell';
import BeforeYouGoUpsell from './components/BeforeYouGoUpsell';
import ProductDetailModal from './components/ProductDetailModal';
import { useBanners } from './hooks/useBanners';
import { useMenu } from './hooks/useMenu';
import { useUpsells } from './hooks/useUpsells';

function MainApp() {
  const cart = useCart();
  const { menuItems } = useMenu();
  const { upsells } = useUpsells();
  const { banners, loading: bannersLoading } = useBanners();
  const [currentView, setCurrentView] = React.useState<'menu' | 'cart' | 'checkout'>('menu');
  const [activeCategory, setActiveCategory] = React.useState('hot-coffee');
  const [upsellFlow, setUpsellFlow] = React.useState<'none' | 'upgrade_meal' | 'before_you_go'>('none');
  const [showAddToCartUpsell, setShowAddToCartUpsell] = React.useState(false);
  const [upsellTriggerItem, setUpsellTriggerItem] = React.useState<MenuItem | null>(null);

  // State for upsell customization modal
  const [customizeItem, setCustomizeItem] = React.useState<MenuItem | null>(null);
  const [customizeDiscountedPrice, setCustomizeDiscountedPrice] = React.useState<number | undefined>(undefined);

  // Filter active banners
  const activeBanners = banners.filter(banner => {
    if (!banner.active) return false;
    const now = new Date();
    if (banner.start_date && new Date(banner.start_date) > now) return false;
    if (banner.end_date && new Date(banner.end_date) < now) return false;
    return true;
  });

  // Wrapped addToCart that checks for upgrade_meal upsells after adding an item
  const handleAddToCart = React.useCallback(
    (item: import('./types').MenuItem, quantity?: number, variations?: import('./types').Variation[], servingPreference?: import('./types').ServingPreferenceOption, addOns?: import('./types').AddOn[]) => {
      // Add the item to cart first
      cart.addToCart(item, quantity, variations, servingPreference, addOns);

      // Check if this item triggers any upgrade_meal upsells
      const hasUpgradeUpsell = upsells.some(
        u => u.type === 'upgrade_meal' && u.active && u.trigger_item_ids.includes(item.id)
      );

      if (hasUpgradeUpsell) {
        setUpsellTriggerItem(item);
        setShowAddToCartUpsell(true);
      }
    },
    [cart.addToCart, upsells]
  );

  const handleViewChange = (view: 'menu' | 'cart' | 'checkout') => {
    if (view === 'checkout' && currentView === 'cart') {
      // Check if there are any "before_you_go" upsell items not already in cart
      const cartMenuItemIds = cart.cartItems.map(ci => ci.menuItemId);
      const activeBeforeYouGoUpsells = upsells.filter(u => u.type === 'before_you_go' && u.active);
      const allOfferIds = [...new Set(activeBeforeYouGoUpsells.flatMap(u => u.offer_item_ids))];
      const hasUpsellItemsToShow = allOfferIds.some(id => {
        const item = menuItems.find(mi => mi.id === id);
        return item && item.available !== false && !cartMenuItemIds.includes(id);
      });

      if (hasUpsellItemsToShow) {
        // Intercept: show "Before You Go" upsell before checkout
        setUpsellFlow('before_you_go');
      } else {
        // No upsell items to show — go directly to checkout
        setCurrentView('checkout');
      }
    } else {
      setCurrentView(view);
    }
  };

  const handleUpgradeDismiss = () => {
    // Move to next step: Before You Go
    setUpsellFlow('before_you_go');
  };

  const handleBeforeYouGoDismiss = () => {
    // Done with upsell flow — navigate to checkout
    setUpsellFlow('none');
    setCurrentView('checkout');
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Handler for when an upsell item needs customization (has variations/add-ons)
  const handleUpsellCustomize = React.useCallback(
    (item: MenuItem, discountedBasePrice?: number) => {
      setCustomizeItem(item);
      setCustomizeDiscountedPrice(discountedBasePrice);
    },
    []
  );

  const handleCustomizeClose = React.useCallback(() => {
    setCustomizeItem(null);
    setCustomizeDiscountedPrice(undefined);
  }, []);

  return (
    <div className="min-h-screen bg-beige-50 font-inter">
      <Header
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={() => handleViewChange('menu')}
      />

      {currentView === 'menu' && (
        <>
          {!bannersLoading && activeBanners.length > 0 ? (
            <BannerCarousel banners={activeBanners} />
          ) : (
            <Hero />
          )}
          <Menu
            menuItems={menuItems}
            addToCart={handleAddToCart}
            cartItems={cart.cartItems}
            updateQuantity={cart.updateQuantity}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onCustomize={handleUpsellCustomize}
          />
        </>
      )}

      {currentView === 'cart' && (
        <Cart
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
          removeFromCart={cart.removeFromCart}
          clearCart={cart.clearCart}
          getTotalPrice={cart.getTotalPrice}
          onContinueShopping={() => handleViewChange('menu')}
          onCheckout={() => handleViewChange('checkout')}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          cartItems={cart.cartItems}
          totalPrice={cart.getTotalPrice()}
          onBack={() => handleViewChange('cart')}
        />
      )}

      {currentView === 'menu' && (
        <FloatingCartButton
          itemCount={cart.getTotalItems()}
          onCartClick={() => handleViewChange('cart')}
        />
      )}

      {/* Upgrade Upsell triggered by adding a trigger item to cart */}
      {showAddToCartUpsell && upsellTriggerItem && (
        <UpgradeMealUpsell
          triggerItem={upsellTriggerItem}
          cartItems={cart.cartItems}
          menuItems={menuItems}
          upsells={upsells}
          onAddToCart={cart.addToCart}
          onCustomize={handleUpsellCustomize}
          onDismiss={() => {
            setShowAddToCartUpsell(false);
            setUpsellTriggerItem(null);
          }}
        />
      )}

      {/* Upsell Overlay Flow (cart → checkout) */}
      {upsellFlow === 'upgrade_meal' && (
        <UpgradeMealUpsell
          cartItems={cart.cartItems}
          menuItems={menuItems}
          upsells={upsells}
          onAddToCart={cart.addToCart}
          onCustomize={handleUpsellCustomize}
          onDismiss={handleUpgradeDismiss}
        />
      )}

      {upsellFlow === 'before_you_go' && (
        <BeforeYouGoUpsell
          cartItems={cart.cartItems}
          menuItems={menuItems}
          upsells={upsells}
          onAddToCart={cart.addToCart}
          onCustomize={handleUpsellCustomize}
          onDismiss={handleBeforeYouGoDismiss}
        />
      )}

      {/* Customization modal for upsell items with variations/add-ons */}
      {customizeItem && (
        <ProductDetailModal
          item={customizeItem}
          isOpen={true}
          onClose={handleCustomizeClose}
          onAddToCart={handleAddToCart}
          discountedBasePrice={customizeDiscountedPrice}
          onCustomize={handleUpsellCustomize}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;