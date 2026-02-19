import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { Bundle, BundleItem, MenuItem, Variation, AddOn, ServingPreferenceOption, CartItem } from '../types';

interface ItemCustomization {
    selectedVariations: Record<string, Variation>;
    selectedServingPreference?: ServingPreferenceOption;
    selectedAddOns: AddOn[];
}

interface BundleCustomizationModalProps {
    bundle: Bundle;
    isOpen: boolean;
    onClose: () => void;
    onAddBundleToCart: (
        bundle: Bundle,
        quantity: number,
        itemCustomizations: Map<string, ItemCustomization>
    ) => void;
}

const BundleCustomizationModal: React.FC<BundleCustomizationModalProps> = ({
    bundle,
    isOpen,
    onClose,
    onAddBundleToCart,
}) => {
    const [quantity, setQuantity] = useState(1);
    const [customizations, setCustomizations] = useState<Map<string, ItemCustomization>>(new Map());

    // Initialize customizations for each bundle item
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            const initial = new Map<string, ItemCustomization>();
            bundle.items.forEach(bi => {
                const mi = bi.menuItem;
                const groupedVars = mi.variations?.reduce((g, v) => {
                    const t = v.type || 'Size';
                    if (!g[t]) g[t] = [];
                    g[t].push(v);
                    return g;
                }, {} as Record<string, Variation[]>) || {};

                const defaults: Record<string, Variation> = {};
                Object.entries(groupedVars).forEach(([type, vars]) => {
                    if (vars.length > 0) defaults[type] = vars[0];
                });

                initial.set(bi.id, {
                    selectedVariations: defaults,
                    selectedServingPreference: mi.servingPreferences?.[0],
                    selectedAddOns: [],
                });
            });
            setCustomizations(initial);
        }
    }, [isOpen, bundle]);

    const updateItemCustomization = (bundleItemId: string, update: Partial<ItemCustomization>) => {
        setCustomizations(prev => {
            const next = new Map(prev);
            const current = next.get(bundleItemId) || { selectedVariations: {}, selectedAddOns: [] };
            next.set(bundleItemId, { ...current, ...update });
            return next;
        });
    };

    // Calculate total add-ons price
    const addOnsTotal = useMemo(() => {
        let total = 0;
        customizations.forEach(c => {
            c.selectedAddOns.forEach(a => { total += a.price; });
        });
        return total;
    }, [customizations]);

    // Bundle base price calculation
    const originalPrice = useMemo(() => {
        return bundle.items.reduce((sum, bi) => sum + bi.menuItem.basePrice, 0);
    }, [bundle]);

    const bundleBasePrice = useMemo(() => {
        if (bundle.pricing_type === 'fixed') return bundle.fixed_price;
        if (bundle.discount_type === 'fixed') return Math.max(0, originalPrice - bundle.discount_value);
        if (bundle.discount_type === 'percentage') return originalPrice * (1 - bundle.discount_value / 100);
        return originalPrice;
    }, [bundle, originalPrice]);

    const totalPrice = (bundleBasePrice + addOnsTotal) * quantity;
    const savings = originalPrice - bundleBasePrice;
    const hasSavings = savings > 0;

    const handleAddToCart = () => {
        onAddBundleToCart(bundle, quantity, customizations);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in pb-8 relative">

                {/* Floating Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                    <button
                        onClick={onClose}
                        className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32">

                    {/* Hero Image */}
                    <div className="relative h-48 sm:h-56 w-full bg-gray-100">
                        {bundle.image_url ? (
                            <img
                                src={bundle.image_url}
                                alt={bundle.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-6xl">📦</span>
                            </div>
                        )}
                    </div>

                    {/* Bundle Info */}
                    <div className="p-6">
                        <h2 className="text-3xl font-bold text-gray-900 font-playfair mb-1">{bundle.name}</h2>
                        {bundle.description && (
                            <p className="text-gray-600 leading-relaxed text-sm mb-3">{bundle.description}</p>
                        )}

                        {hasSavings && (
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                                Save ₱{savings.toFixed(0)}
                            </div>
                        )}

                        <div className="h-px w-full bg-gray-100 mb-6"></div>

                        {/* Bundle Items with Customizations */}
                        <div className="space-y-8">
                            {bundle.items.map((bi, index) => {
                                const mi = bi.menuItem;
                                const itemCustom = customizations.get(bi.id) || { selectedVariations: {}, selectedAddOns: [] };

                                // Group variations by type
                                const groupedVariations = mi.variations?.reduce((g, v) => {
                                    const t = v.type || 'Size';
                                    if (!g[t]) g[t] = [];
                                    g[t].push(v);
                                    return g;
                                }, {} as Record<string, Variation[]>) || {};

                                const groupedAddOns = mi.addOns?.reduce((g, a) => {
                                    if (!g[a.category]) g[a.category] = [];
                                    g[a.category].push(a);
                                    return g;
                                }, {} as Record<string, AddOn[]>);

                                const hasCustomizations = Object.keys(groupedVariations).length > 0
                                    || (mi.servingPreferences && mi.servingPreferences.length > 0)
                                    || (mi.addOns && mi.addOns.length > 0);

                                return (
                                    <div key={bi.id}>
                                        {/* Item Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {mi.image && (
                                                <img src={mi.image} alt={mi.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{mi.name}</h3>
                                                <p className="text-xs text-gray-500">₱{mi.basePrice}</p>
                                            </div>
                                        </div>

                                        {/* Variation Groups */}
                                        {Object.entries(groupedVariations).map(([type, variations]) => (
                                            <div key={`${bi.id}-${type}`} className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-700">{type}</h4>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Pick 1</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {variations.map(variation => {
                                                        const isSelected = itemCustom.selectedVariations[type]?.id === variation.id;
                                                        return (
                                                            <button
                                                                key={variation.id}
                                                                onClick={() => {
                                                                    updateItemCustomization(bi.id, {
                                                                        selectedVariations: {
                                                                            ...itemCustom.selectedVariations,
                                                                            [type]: variation,
                                                                        },
                                                                    });
                                                                }}
                                                                className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                                                                    isSelected
                                                                        ? 'border-black bg-gray-900 text-white shadow-lg scale-[1.02]'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{variation.name}</span>
                                                                {variation.price > 0 && (
                                                                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>+₱{variation.price}</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Serving Preference */}
                                        {mi.servingPreferences && mi.servingPreferences.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-700">Preference</h4>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Pick 1</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {mi.servingPreferences.map(pref => {
                                                        const isSelected = itemCustom.selectedServingPreference?.id === pref.id;
                                                        return (
                                                            <button
                                                                key={pref.id}
                                                                onClick={() => updateItemCustomization(bi.id, { selectedServingPreference: pref })}
                                                                className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                                                                    isSelected
                                                                        ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-[1.02]'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{pref.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add-ons */}
                                        {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-700">Add-ons</h4>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional · Extra</span>
                                                </div>
                                                {Object.entries(groupedAddOns).map(([category, addOns]) => (
                                                    <div key={`${bi.id}-${category}`} className="mb-3 last:mb-0">
                                                        <h5 className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">{category}</h5>
                                                        <div className="space-y-2">
                                                            {addOns.map(addOn => {
                                                                const isSelected = itemCustom.selectedAddOns.some(a => a.id === addOn.id);
                                                                return (
                                                                    <label
                                                                        key={addOn.id}
                                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                                                            isSelected ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center space-x-3">
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                                                isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
                                                                            }`}>
                                                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                                                            </div>
                                                                            <span className="text-sm font-medium text-gray-900">{addOn.name}</span>
                                                                            <input
                                                                                type="checkbox"
                                                                                className="hidden"
                                                                                checked={isSelected}
                                                                                onChange={() => {
                                                                                    const newAddOns = isSelected
                                                                                        ? itemCustom.selectedAddOns.filter(a => a.id !== addOn.id)
                                                                                        : [...itemCustom.selectedAddOns, addOn];
                                                                                    updateItemCustomization(bi.id, { selectedAddOns: newAddOns });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-medium text-gray-900">
                                                                            {addOn.price > 0 ? `+₱${addOn.price}` : 'Free'}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Divider between items */}
                                        {index < bundle.items.length - 1 && (
                                            <div className="h-px w-full bg-gray-200 mt-6"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex flex-col space-y-4">
                        {/* Price and Quantity Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-900">₱{totalPrice.toFixed(2)}</span>
                                    {hasSavings && (
                                        <span className="text-base text-gray-400 line-through">₱{((originalPrice + addOnsTotal) * quantity).toFixed(2)}</span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                    {addOnsTotal > 0 ? `Bundle + ₱${addOnsTotal} add-ons` : 'Bundle Price'}
                                </span>
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-gray-100 rounded-full p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition-shadow text-gray-700 disabled:opacity-50"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition-shadow text-gray-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            className="w-full py-3.5 px-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg shadow-gray-200 transition-all transform hover:scale-[1.02]"
                        >
                            Add Bundle to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundleCustomizationModal;
