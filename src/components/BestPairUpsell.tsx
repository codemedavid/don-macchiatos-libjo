import React from 'react';
import { Plus } from 'lucide-react';
import { Upsell, MenuItem, Variation, AddOn, ServingPreferenceOption } from '../types';
import { useUpsells } from '../hooks/useUpsells';
import { useMenu } from '../hooks/useMenu';

interface BestPairUpsellProps {
    currentItemId: string;
    onAddToCart: (
        item: MenuItem,
        quantity: number,
        variations?: Variation[],
        servingPreference?: ServingPreferenceOption,
        addOns?: AddOn[]
    ) => void;
}

const BestPairUpsell: React.FC<BestPairUpsellProps> = ({ currentItemId, onAddToCart }) => {
    const { getUpsellsForItem, resolveOfferItems } = useUpsells();
    const { menuItems } = useMenu();

    const relevantUpsells = getUpsellsForItem(currentItemId);

    if (relevantUpsells.length === 0) return null;

    // Collect all unique offer items from all relevant upsells
    const allOfferIds = [...new Set(relevantUpsells.flatMap(u => u.offer_item_ids))];
    const offerItems = resolveOfferItems(allOfferIds, menuItems).filter(
        item => item.id !== currentItemId && item.available !== false
    );

    if (offerItems.length === 0) return null;

    // Get the best discount from any matching upsell
    const getDiscountForItem = (itemId: string): Upsell | null => {
        return relevantUpsells.find(u =>
            u.offer_item_ids.includes(itemId) && u.discount_type !== 'none'
        ) || null;
    };

    const getDiscountedPrice = (item: MenuItem): number | null => {
        const upsell = getDiscountForItem(item.id);
        if (!upsell) return null;
        if (upsell.discount_type === 'fixed') {
            return Math.max(0, item.basePrice - upsell.discount_value);
        }
        if (upsell.discount_type === 'percentage') {
            return item.basePrice * (1 - upsell.discount_value / 100);
        }
        return null;
    };

    // Use description from first relevant upsell that has one
    const sectionTitle = relevantUpsells.find(u => u.description)?.description || 'Perfect Pair';

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🍽️</span>
                <h3 className="text-lg font-bold text-gray-900">{sectionTitle}</h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {offerItems.map(item => {
                    const discountedPrice = getDiscountedPrice(item);
                    return (
                        <div
                            key={item.id}
                            className="flex-shrink-0 w-40 bg-beige-50 rounded-xl overflow-hidden border border-beige-200 hover:shadow-md transition-all duration-200 group"
                        >
                            {/* Image */}
                            <div className="relative h-28 bg-gradient-to-br from-cream-100 to-beige-200">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-3xl opacity-30">☕</span>
                                    </div>
                                )}
                                {discountedPrice !== null && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        SAVE
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{item.name}</h4>
                                <div className="flex items-center gap-1.5 mb-2">
                                    {discountedPrice !== null ? (
                                        <>
                                            <span className="text-sm font-bold text-gray-900">₱{discountedPrice.toFixed(0)}</span>
                                            <span className="text-xs text-gray-400 line-through">₱{item.basePrice}</span>
                                        </>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-900">₱{item.basePrice}</span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToCart(item, 1);
                                    }}
                                    className="w-full flex items-center justify-center gap-1 bg-black text-white py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BestPairUpsell;
