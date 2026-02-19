import React from 'react';
import { MenuItem, Bundle, Variation, ServingPreferenceOption, AddOn } from './types';
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
import BundleCustomizationModal from './components/BundleCustomizationModal';
import { useBanners } from './hooks/useBanners';
import { useMenu } from './hooks/useMenu';
import { useUpsells } from './hooks/useUpsells';
import { useBundles } from './hooks/useBundles';

function MainApp() {
  const cart = useCart();
  const { menuItems } = useMenu();
  const { upsells } = useUpsells();
  const { bundles } = useBundles();
  const { banners, loading: bannersLoading } = useBanners();
  const [currentView, setCurrentView] = React.useState<'menu' | 'cart' | 'checkout'>('menu');
  const [activeCategory, setActiveCategory] = React.useState('hot-coffee');
  const [upsellFlow, setUpsellFlow] = React.useState<'none' | 'upgrade_meal' | 'before_you_go'>('none');
  const [showAddToCartUpsell, setShowAddToCartUpsell] = React.useState(false);
  const [upsellTriggerItem, setUpsellTriggerItem] = React.useState<MenuItem | null>(null);

  // State for upsell customization modal
  const [customizeItem, setCustomizeItem] = React.useState<MenuItem | null>(null);
  const [customizeDiscountedPrice, setCustomizeDiscountedPrice] = React.useState<number | undefined>(undefined);

  // State for bundle customization modal
  const [customizeBundle, setCustomizeBundle] = React.useState<Bundle | null>(null);

  // Filter active banners
  const activeBanners = banners.filter(banner => {
    if (!banner.active) return false;
    const now = new Date();
    if (banner.start_date && new Date(banner.start_date) > now) return false;
    if (banner.end_date && new Date(banner.end_date) < now) return false;
    return true;
  });

  // Filter bundles visible on menu
  const menuBundles = React.useMemo(() =>
    bundles.filter(b => b.show_on_menu && b.active),
    [bundles]
  );

  // Wrapped addToCart that checks for upgrade_meal upsells after adding an item
  const handleAddToCart = React.useCallback(
    (item: MenuItem, quantity?: number, variations?: Variation[], servingPreference?: ServingPreferenceOption, addOns?: AddOn[]) => {
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

  // Bundle customization handlers
  const handleOpenBundleCustomization = React.useCallback((bundle: Bundle) => {
    setCustomizeBundle(bundle);
  }, []);

  const handleCloseBundleCustomization = React.useCallback(() => {
    setCustomizeBundle(null);
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

          {/* Bundles Section on Menu */}
          {menuBundles.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-2xl font-playfair font-semibold text-black mb-6">Combos & Bundles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuBundles.map(bundle => {
                  const originalPrice = bundle.items.reduce((sum, bi) => sum + bi.menuItem.basePrice, 0);
                  let bundlePrice: number;
                  if (bundle.pricing_type === 'fixed') {
                    bundlePrice = bundle.fixed_price;
                  } else if (bundle.discount_type === 'fixed') {
                    bundlePrice = Math.max(0, originalPrice - bundle.discount_value);
                  } else if (bundle.discount_type === 'percentage') {
                    bundlePrice = originalPrice * (1 - bundle.discount_value / 100);
                  } else {
                    bundlePrice = originalPrice;
                  }
                  const hasSavings = bundlePrice < originalPrice;

                  return (
                    <button
                      key={bundle.id}
                      onClick={() => handleOpenBundleCustomization(bundle)}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 text-left"
                    >
                      <div className="relative h-40 bg-gray-100">
                        {bundle.image_url ? (
                          <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <span className="text-4xl">📦</span>
                          </div>
                        )}
                        {hasSavings && (
                          <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            Save ₱{(originalPrice - bundlePrice).toFixed(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-playfair font-semibold text-black text-lg mb-1">{bundle.name}</h3>
                        {bundle.description && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{bundle.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mb-2">
                          {bundle.items.map(bi => bi.menuItem.name).join(' + ')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-black">₱{bundlePrice.toFixed(0)}</span>
                          {hasSavings && (
                            <span className="text-sm text-gray-400 line-through">₱{originalPrice.toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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
          bundleCartItems={cart.bundleCartItems}
          updateQuantity={cart.updateQuantity}
          removeFromCart={cart.removeFromCart}
          updateBundleQuantity={cart.updateBundleQuantity}
          removeBundleFromCart={cart.removeBundleFromCart}
          clearCart={cart.clearCart}
          getTotalPrice={cart.getTotalPrice}
          onContinueShopping={() => handleViewChange('menu')}
          onCheckout={() => handleViewChange('checkout')}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          cartItems={cart.cartItems}
          bundleCartItems={cart.bundleCartItems}
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
          bundles={bundles}
          onAddToCart={cart.addToCart}
          onCustomize={handleUpsellCustomize}
          onOpenBundleCustomization={handleOpenBundleCustomization}
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
          bundles={bundles}
          onAddToCart={cart.addToCart}
          onCustomize={handleUpsellCustomize}
          onOpenBundleCustomization={handleOpenBundleCustomization}
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

      {/* Bundle Customization Modal */}
      {customizeBundle && (
        <BundleCustomizationModal
          bundle={customizeBundle}
          isOpen={true}
          onClose={handleCloseBundleCustomization}
          onAddBundleToCart={cart.addBundleToCart}
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
