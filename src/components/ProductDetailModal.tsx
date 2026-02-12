import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Share2, Minus, Plus, Star } from 'lucide-react';
import { MenuItem, Variation, AddOn, ServingPreferenceOption } from '../types';
import { useCategories } from '../hooks/useCategories';

import BestPairUpsell from './BestPairUpsell';

interface ProductDetailModalProps {
    item: MenuItem;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (
        item: MenuItem,
        quantity: number,
        variations?: Variation[],
        servingPreference?: ServingPreferenceOption,
        addOns?: AddOn[]
    ) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    item,
    isOpen,
    onClose,
    onAddToCart
}) => {
    const { categories } = useCategories();
    const [quantity, setQuantity] = useState(1);
    const [selectedServingPreference, setSelectedServingPreference] = useState<ServingPreferenceOption | undefined>(
        item.servingPreferences?.[0]
    );
    const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
    const categoryName = categories.find(c => c.id === item.category)?.name || 'Menu';

    // Group variations by type
    const groupedVariations = useMemo(() => {
        if (!item.variations || item.variations.length === 0) return {};
        return item.variations.reduce((groups, variation) => {
            const type = variation.type || 'Size';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(variation);
            return groups;
        }, {} as Record<string, Variation[]>);
    }, [item.variations]);

    // Track one selected variation per type
    const [selectedVariations, setSelectedVariations] = useState<Record<string, Variation>>(() => {
        const defaults: Record<string, Variation> = {};
        Object.entries(groupedVariations).forEach(([type, vars]) => {
            if (vars.length > 0) defaults[type] = vars[0];
        });
        return defaults;
    });

    // Reset state when item changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            const defaults: Record<string, Variation> = {};
            const groups = item.variations?.reduce((g, v) => {
                const t = v.type || 'Size';
                if (!g[t]) g[t] = [];
                g[t].push(v);
                return g;
            }, {} as Record<string, Variation[]>) || {};
            Object.entries(groups).forEach(([type, vars]) => {
                if (vars.length > 0) defaults[type] = vars[0];
            });
            setSelectedVariations(defaults);
            setSelectedServingPreference(item.servingPreferences?.[0]);
            setSelectedAddOns([]);
        }
    }, [isOpen, item]);

    const calculatePrice = () => {
        let price = item.basePrice;
        Object.values(selectedVariations).forEach(v => {
            price += v.price;
        });
        if (selectedServingPreference) {
            price += selectedServingPreference.price;
        }
        selectedAddOns.forEach(addOn => {
            price += addOn.price;
        });
        return price * quantity;
    };

    const handleAddToCart = () => {
        const variationsArray = Object.values(selectedVariations);
        onAddToCart(item, quantity, variationsArray.length > 0 ? variationsArray : undefined, selectedServingPreference, selectedAddOns);
        onClose();
    };

    const handleBuyNow = () => {
        handleAddToCart();
    };

    const toggleAddOn = (addOn: AddOn) => {
        setSelectedAddOns(prev => {
            const exists = prev.find(a => a.id === addOn.id);
            if (exists) {
                return prev.filter(a => a.id !== addOn.id);
            } else {
                return [...prev, addOn];
            }
        });
    };

    const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
        const category = addOn.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(addOn);
        return groups;
    }, {} as Record<string, AddOn[]>);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center animate-fade-in">
            {/* Drawer/Modal Container */}
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in pb-8 relative">

                {/* Floating Header Actions (Web/Mobile consistent) */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                    {/* Back/Close Button */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" /> {/* Using ChevronLeft as "Back" for mobile feel, or X for modal */}
                        {/* Alternatively use X for desktop modal feel */}
                        {/* <X className="w-6 h-6" /> */}
                    </button>

                    {/* Share Button (Visual only for now) */}
                    <button className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32"> {/* pb-32 to account for sticky footer */}

                    {/* Hero Image */}
                    <div className="relative h-64 sm:h-80 w-full bg-gray-100">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-6xl">☕</span>
                            </div>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="p-6">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center text-sm text-gray-500 mb-4 overflow-hidden whitespace-nowrap text-ellipsis">
                            <span>Home</span>
                            <span className="mx-2">/</span>
                            <span>Menu</span>
                            <span className="mx-2">/</span>
                            <span className="text-black font-medium">{categoryName}</span>
                        </nav>

                        {/* Title & Rating */}
                        <div className="flex flex-col mb-4">
                            <div className="flex items-start justify-between">
                                <h2 className="text-3xl font-bold text-gray-900 font-playfair">{item.name}</h2>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed mb-8">
                            {item.description}
                        </p>

                        <div className="h-px w-full bg-gray-100 mb-8"></div>

                        {/* Variations / Options */}
                        <div className="space-y-8">
                            {/* Variation Groups (Size, Flavor, etc.) */}
                            {Object.entries(groupedVariations).map(([type, variations]) => (
                                <div key={type}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">{type}</h3>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Pick 1</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {variations.map((variation) => {
                                            const isSelected = selectedVariations[type]?.id === variation.id;
                                            return (
                                                <button
                                                    key={variation.id}
                                                    onClick={() => setSelectedVariations(prev => ({ ...prev, [type]: variation }))}
                                                    className={`
                                        flex-1 min-w-[100px] py-3 px-4 rounded-xl border-2 transition-all duration-200
                                        flex flex-col items-center justify-center
                                        ${isSelected
                                                            ? 'border-black bg-gray-900 text-white shadow-lg scale-[1.02]'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                        }
                                    `}
                                                >
                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{variation.name}</span>
                                                    {variation.price > 0 && (
                                                        <span className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>+₱{variation.price.toFixed(2)}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Serving Preference */}
                            {item.servingPreferences && item.servingPreferences.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Preference</h3>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Pick 1</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {item.servingPreferences.map((pref) => {
                                            const isSelected = selectedServingPreference?.id === pref.id;
                                            return (
                                                <button
                                                    key={pref.id}
                                                    onClick={() => setSelectedServingPreference(pref)}
                                                    className={`
                                        flex-1 min-w-[100px] py-3 px-4 rounded-xl border-2 transition-all duration-200
                                        flex flex-col items-center justify-center
                                        ${isSelected
                                                            ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-[1.02]'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                        }
                                    `}
                                                >
                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{pref.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Add-ons */}
                            {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Add-ons</h3>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                                    </div>

                                    {Object.entries(groupedAddOns).map(([category, addOns]) => (
                                        <div key={category} className="mb-4 last:mb-0">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">{category}</h4>
                                            <div className="space-y-3">
                                                {addOns.map((addOn) => {
                                                    const isSelected = selectedAddOns.some(a => a.id === addOn.id);
                                                    return (
                                                        <label
                                                            key={addOn.id}
                                                            className={`
                                                    flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer
                                                    ${isSelected ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:bg-gray-50'}
                                                `}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`
                                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                        ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}
                                                    `}>
                                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                                </div>
                                                                <span className="font-medium text-gray-900">{addOn.name}</span>
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleAddOn(addOn)}
                                                                />
                                                            </div>
                                                            <span className="font-medium text-gray-900">
                                                                {addOn.price > 0 ? `+₱${addOn.price.toFixed(2)}` : 'Free'}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Best Pair Upsell */}
                        <BestPairUpsell
                            currentItemId={item.id}
                            onAddToCart={onAddToCart}
                        />
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 sm:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">

                    <div className="flex flex-col space-y-4">
                        {/* Price and Quantity Row */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-gray-900">₱{calculatePrice().toFixed(2)}</span>
                                <span className="text-xs text-gray-500 font-medium">Total Price</span>
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

                        {/* Buttons Row */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleBuyNow}
                                className="flex-1 py-3.5 px-4 rounded-xl border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Buy Now
                            </button>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black shadow-lg shadow-gray-200 transition-all transform hover:scale-[1.02]"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetailModal;
