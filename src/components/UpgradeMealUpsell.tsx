import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { MenuItem, CartItem, Upsell, Variation, AddOn, ServingPreferenceOption, Bundle } from '../types';

interface UpgradeMealUpsellProps {
    triggerItem?: MenuItem;
    cartItems: CartItem[];
    menuItems: MenuItem[];
    upsells: Upsell[];
    bundles?: Bundle[];
    onAddToCart: (
        item: MenuItem,
        quantity?: number,
        variations?: Variation[],
        servingPreference?: ServingPreferenceOption,
        addOns?: AddOn[]
    ) => void;
    onCustomize: (item: MenuItem, discountedBasePrice?: number) => void;
    onOpenBundleCustomization?: (bundle: Bundle) => void;
    onDismiss: () => void;
}

const UpgradeMealUpsell: React.FC<UpgradeMealUpsellProps> = ({
    triggerItem,
    cartItems,
    menuItems,
    upsells,
    bundles = [],
    onAddToCart,
    onCustomize,
    onOpenBundleCustomization,
    onDismiss,
}) => {
    const [selectedChoice, setSelectedChoice] = useState<'none' | 'ala_carte' | 'upgrade'>('none');
    const [visible, setVisible] = useState(false);

    const cartMenuItemIds = useMemo(() => cartItems.map(ci => ci.menuItemId), [cartItems]);

    const relevantUpsell = useMemo(() => {
        if (triggerItem) {
            return upsells.find(
                u => u.type === 'upgrade_meal' && u.active && u.trigger_item_ids.includes(triggerItem.id)
            ) || null;
        }
        return upsells.find(
            u => u.type === 'upgrade_meal' && u.active && u.trigger_item_ids.some(tid => cartMenuItemIds.includes(tid))
        ) || null;
    }, [upsells, triggerItem, cartMenuItemIds]);

    const displayTriggerItem = useMemo(() => {
        if (triggerItem) return triggerItem;
        if (!relevantUpsell) return null;
        const matchingCartItemId = relevantUpsell.trigger_item_ids.find(tid => cartMenuItemIds.includes(tid));
        if (matchingCartItemId) return menuItems.find(mi => mi.id === matchingCartItemId) || null;
        return null;
    }, [triggerItem, relevantUpsell, cartMenuItemIds, menuItems]);

    const offerItems = useMemo(() => {
        if (!relevantUpsell) return [];
        return relevantUpsell.offer_item_ids
            .map(id => menuItems.find(mi => mi.id === id))
            .filter((item): item is MenuItem => !!item)
            .filter(item => item.available !== false);
    }, [relevantUpsell, menuItems]);

    const upgradeExtraPrice = useMemo(() => {
        if (!relevantUpsell || offerItems.length === 0) return 0;
        const totalOfferPrice = offerItems.reduce((sum, item) => sum + item.basePrice, 0);
        if (relevantUpsell.discount_type === 'fixed') return Math.max(0, totalOfferPrice - relevantUpsell.discount_value);
        if (relevantUpsell.discount_type === 'percentage') return totalOfferPrice * (1 - relevantUpsell.discount_value / 100);
        return totalOfferPrice;
    }, [relevantUpsell, offerItems]);

    const originalOfferPrice = useMemo(() => offerItems.reduce((sum, item) => sum + item.basePrice, 0), [offerItems]);
    const hasSavings = relevantUpsell?.discount_type !== 'none' && upgradeExtraPrice < originalOfferPrice;
    const savings = originalOfferPrice - upgradeExtraPrice;

    useEffect(() => {
        if (!relevantUpsell || offerItems.length === 0 || !displayTriggerItem) {
            onDismiss();
        }
    }, []);

    useEffect(() => {
        if (relevantUpsell && offerItems.length > 0 && displayTriggerItem) {
            const timer = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(timer);
        }
    }, [relevantUpsell, offerItems.length, displayTriggerItem]);

    if (!relevantUpsell || offerItems.length === 0 || !displayTriggerItem) return null;

    const handleAlaCarte = () => {
        setSelectedChoice('ala_carte');
        setTimeout(() => onDismiss(), 250);
    };

    // Check if this upsell is linked to a bundle
    const linkedBundle = useMemo(() => {
        if (!relevantUpsell?.bundle_id) return null;
        return bundles.find(b => b.id === relevantUpsell.bundle_id && b.active) || null;
    }, [relevantUpsell, bundles]);

    const handleUpgrade = () => {
        setSelectedChoice('upgrade');

        // If linked to a bundle, open bundle customization instead
        if (linkedBundle && onOpenBundleCustomization) {
            onOpenBundleCustomization(linkedBundle);
            setTimeout(() => onDismiss(), 250);
            return;
        }

        offerItems.forEach(item => {
            const perItemPrice = relevantUpsell && offerItems.length > 0
                ? upgradeExtraPrice / offerItems.length
                : item.basePrice;
            const needsCustomization = (item.variations && item.variations.length > 0) ||
                (item.servingPreferences && item.servingPreferences.length > 0) ||
                (item.addOns && item.addOns.length > 0);

            if (needsCustomization) {
                onCustomize(item, perItemPrice);
            } else {
                onAddToCart({ ...item, basePrice: perItemPrice }, 1);
            }
        });
        setTimeout(() => onDismiss(), 250);
    };

    const upsellName = relevantUpsell.name || 'Upgrade Your Order';
    const description = relevantUpsell.description || `Would you like to make it a meal?`;
    const skipLabel = relevantUpsell.skip_label || 'Just This';
    const acceptLabel = relevantUpsell.accept_label || 'Make It a Meal';

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center ${visible ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Drawer/Modal Container — same shape as ProductDetailModal */}
            <div className={`bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden relative ${visible ? 'animate-slide-up sm:animate-scale-in' : ''}`}>

                {/* Floating Close Button */}
                <div className="absolute top-0 right-0 p-4 z-10">
                    <button
                        onClick={onDismiss}
                        className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Hero Image — trigger item */}
                <div className="relative h-48 sm:h-56 w-full bg-gray-100">
                    {displayTriggerItem.image ? (
                        <img
                            src={displayTriggerItem.image}
                            alt={displayTriggerItem.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <span className="text-6xl">☕</span>
                        </div>
                    )}
                    {/* Gradient overlay at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
                </div>

                {/* Content Body */}
                <div className="p-6 pt-2">
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 font-playfair mb-1">{upsellName}</h2>
                    <p className="text-gray-600 leading-relaxed text-sm mb-6">{description}</p>

                    <div className="h-px w-full bg-gray-100 mb-6"></div>

                    {/* Choice Section */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Choose Your Option</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Pick 1</span>
                        </div>

                        <div className="space-y-3">
                            {/* Option 1: Ala Carte */}
                            <button
                                onClick={handleAlaCarte}
                                className={`
                                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                                    ${selectedChoice === 'ala_carte'
                                        ? 'border-gray-900 bg-gray-900 shadow-lg scale-[1.02]'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${selectedChoice === 'ala_carte' ? 'bg-white border-white' : 'border-gray-300 bg-white'}
                                `}>
                                    {selectedChoice === 'ala_carte' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-semibold ${selectedChoice === 'ala_carte' ? 'text-white' : 'text-gray-900'}`}>
                                        {skipLabel}
                                    </span>
                                    <p className={`text-xs mt-0.5 ${selectedChoice === 'ala_carte' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {displayTriggerItem.name} only
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Make It a Meal */}
                            <button
                                onClick={handleUpgrade}
                                className={`
                                    w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden
                                    ${selectedChoice === 'upgrade'
                                        ? 'border-gray-900 bg-gray-900 shadow-lg scale-[1.02]'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {/* Savings badge */}
                                {hasSavings && selectedChoice !== 'upgrade' && (
                                    <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">
                                        SAVE ₱{savings.toFixed(0)}
                                    </div>
                                )}
                                {hasSavings && selectedChoice === 'upgrade' && (
                                    <div className="absolute top-0 right-0 bg-white text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">
                                        SAVE ₱{savings.toFixed(0)}
                                    </div>
                                )}

                                <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                                    ${selectedChoice === 'upgrade' ? 'bg-white border-white' : 'border-gray-300 bg-white'}
                                `}>
                                    {selectedChoice === 'upgrade' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between pr-14">
                                        <span className={`text-sm font-semibold ${selectedChoice === 'upgrade' ? 'text-white' : 'text-gray-900'}`}>
                                            {acceptLabel}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-2">
                                            {hasSavings && (
                                                <span className={`text-xs line-through ${selectedChoice === 'upgrade' ? 'text-gray-400' : 'text-gray-400'}`}>
                                                    +₱{originalOfferPrice.toFixed(0)}
                                                </span>
                                            )}
                                            <span className={`text-sm font-bold ${selectedChoice === 'upgrade' ? 'text-white' : 'text-gray-900'}`}>
                                                +₱{upgradeExtraPrice.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Included items list */}
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedChoice === 'upgrade' ? 'bg-white/20 border-white/30' : 'bg-gray-100 border-gray-200'}`}>
                                                <Check className={`w-2.5 h-2.5 ${selectedChoice === 'upgrade' ? 'text-white' : 'text-gray-400'}`} />
                                            </div>
                                            <span className={`text-xs ${selectedChoice === 'upgrade' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {displayTriggerItem.name}
                                            </span>
                                        </div>
                                        {offerItems.map(item => (
                                            <div key={item.id} className="flex items-center gap-2.5">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedChoice === 'upgrade' ? 'bg-white/20 border-white/30' : 'bg-gray-100 border-gray-200'}`}>
                                                    <Check className={`w-2.5 h-2.5 ${selectedChoice === 'upgrade' ? 'text-white' : 'text-gray-400'}`} />
                                                </div>
                                                <span className={`text-xs font-medium ${selectedChoice === 'upgrade' ? 'text-white' : 'text-gray-700'}`}>
                                                    {item.name}
                                                </span>
                                                {item.image && (
                                                    <img src={item.image} alt="" className="w-5 h-5 rounded object-cover ml-auto flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer — same style as ProductDetailModal */}
                <div className="bg-white border-t border-gray-100 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                        <button
                            onClick={handleAlaCarte}
                            className="flex-1 py-3.5 px-4 rounded-xl border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-50 transition-colors"
                        >
                            {skipLabel}
                        </button>
                        <button
                            onClick={handleUpgrade}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg shadow-gray-200 transition-all transform hover:scale-[1.02]"
                        >
                            {acceptLabel}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UpgradeMealUpsell;
