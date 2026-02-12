import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { MenuItem, CartItem, Upsell, Variation, AddOn, ServingPreferenceOption } from '../types';

interface BeforeYouGoUpsellProps {
    cartItems: CartItem[];
    menuItems: MenuItem[];
    upsells: Upsell[];
    onAddToCart: (
        item: MenuItem,
        quantity?: number,
        variations?: Variation[],
        servingPreference?: ServingPreferenceOption,
        addOns?: AddOn[]
    ) => void;
    onDismiss: () => void;
}

const BeforeYouGoUpsell: React.FC<BeforeYouGoUpsellProps> = ({
    cartItems,
    menuItems,
    upsells,
    onAddToCart,
    onDismiss,
}) => {
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
    const [visible, setVisible] = useState(false);

    const cartMenuItemIds = useMemo(() => cartItems.map(ci => ci.menuItemId), [cartItems]);

    const activeUpsells = useMemo(
        () => upsells.filter(u => u.type === 'before_you_go' && u.active),
        [upsells]
    );

    const offerItems = useMemo(() => {
        if (activeUpsells.length === 0) return [];
        const allOfferIds = [...new Set(activeUpsells.flatMap(u => u.offer_item_ids))];
        return allOfferIds
            .map(id => menuItems.find(mi => mi.id === id))
            .filter((item): item is MenuItem => !!item)
            .filter(item => item.available !== false && !cartMenuItemIds.includes(item.id));
    }, [activeUpsells, menuItems, cartMenuItemIds]);

    // Auto-dismiss if nothing to show
    useEffect(() => {
        if (activeUpsells.length === 0 || offerItems.length === 0) {
            onDismiss();
        }
    }, []); // Only on mount — data is already loaded from parent

    // Animate in
    useEffect(() => {
        if (activeUpsells.length > 0 && offerItems.length > 0) {
            const timer = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(timer);
        }
    }, [activeUpsells.length, offerItems.length]);

    if (activeUpsells.length === 0 || offerItems.length === 0) {
        return null;
    }

    const primaryUpsell = activeUpsells[0];

    const getDiscountedPrice = (item: MenuItem) => {
        const upsell = activeUpsells.find(
            u => u.offer_item_ids.includes(item.id) && u.discount_type !== 'none'
        );
        if (!upsell) return null;
        if (upsell.discount_type === 'fixed') return Math.max(0, item.basePrice - upsell.discount_value);
        if (upsell.discount_type === 'percentage') return item.basePrice * (1 - upsell.discount_value / 100);
        return null;
    };

    const handleAdd = (item: MenuItem) => {
        if (addedItems.has(item.id)) return;
        onAddToCart(item, 1);
        setAddedItems(prev => new Set(prev).add(item.id));
    };

    return (
        <div className={`fixed inset-0 z-50 transition-all duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/40" />
            <div className={`relative h-full flex flex-col items-center justify-center p-4 sm:p-6 transition-transform duration-500 ${visible ? 'translate-y-0' : 'translate-y-8'}`}>
                <div
                    className="w-full max-w-lg flex flex-col max-h-[90vh]"
                    style={{
                        background: '#f0eeeb',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                    }}
                >
                    {/* Heading */}
                    <div style={{ padding: '40px 32px 28px', textAlign: 'center' }}>
                        <h2
                            style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#1a1a1a',
                                lineHeight: 1.3,
                                letterSpacing: '-0.01em',
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                            }}
                        >
                            {primaryUpsell.name || "Don't miss out on these"}
                            <br />
                            {primaryUpsell.description || 'favorites!'}
                        </h2>
                    </div>

                    {/* Product Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px',
                            }}
                        >
                            {offerItems.slice(0, 4).map(item => {
                                const discountedPrice = getDiscountedPrice(item);
                                const isAdded = addedItems.has(item.id);
                                const displayPrice = discountedPrice !== null ? discountedPrice : item.basePrice;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAdd(item)}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            border: isAdded ? '2.5px solid #2d7d46' : '1px solid #e8e5e0',
                                            cursor: isAdded ? 'default' : 'pointer',
                                            padding: 0,
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                        }}
                                        className={!isAdded ? 'hover:shadow-lg hover:scale-[1.02]' : ''}
                                    >
                                        {/* Added checkmark overlay */}
                                        {isAdded && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: '#2d7d46',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 2,
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                }}
                                            >
                                                <Check style={{ width: '16px', height: '16px', color: '#fff' }} />
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <div
                                            style={{
                                                height: '140px',
                                                background: '#f5f3ef',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease',
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '48px', opacity: 0.2 }}>☕</span>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div style={{ padding: '12px 14px 14px' }}>
                                            <h4
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    color: '#1a1a1a',
                                                    lineHeight: 1.3,
                                                    marginBottom: '4px',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {item.name}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span
                                                    style={{
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#666',
                                                    }}
                                                >
                                                    PHP{displayPrice.toFixed(2)}
                                                </span>
                                                {discountedPrice !== null && (
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#aaa',
                                                            textDecoration: 'line-through',
                                                        }}
                                                    >
                                                        PHP{item.basePrice.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Not Today Button */}
                    <div style={{ padding: '0 24px 28px' }}>
                        <button
                            onClick={onDismiss}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#ffffff',
                                border: '1.5px solid #d4d0ca',
                                borderRadius: '14px',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#1a1a1a',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                            }}
                            className="hover:bg-gray-50"
                        >
                            {addedItems.size > 0 ? (primaryUpsell.accept_label || 'Continue to Checkout') : (primaryUpsell.skip_label || 'Not Today')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeforeYouGoUpsell;
