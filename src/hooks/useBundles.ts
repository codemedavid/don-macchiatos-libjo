import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Bundle, BundleItem, MenuItem, CartItem } from '../types';

export const useBundles = () => {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBundles = async () => {
        try {
            setLoading(true);

            // Fetch bundles with their items, and each item's menu_item with relations
            const { data, error: fetchError } = await supabase
                .from('bundles')
                .select(`
                    *,
                    bundle_items (
                        id,
                        bundle_id,
                        menu_item_id,
                        sort_order,
                        menu_items (
                            *,
                            variations (*),
                            serving_preferences (*),
                            add_ons (*)
                        )
                    )
                `)
                .order('sort_order', { ascending: true });

            if (fetchError) throw fetchError;

            const formatted: Bundle[] = (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description || '',
                image_url: row.image_url || undefined,
                pricing_type: row.pricing_type,
                fixed_price: Number(row.fixed_price) || 0,
                discount_type: row.discount_type,
                discount_value: Number(row.discount_value) || 0,
                active: row.active,
                show_on_menu: row.show_on_menu,
                sort_order: row.sort_order || 0,
                created_at: row.created_at,
                updated_at: row.updated_at,
                items: (row.bundle_items || [])
                    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((bi: any) => {
                        const mi = bi.menu_items;
                        return {
                            id: bi.id,
                            bundle_id: bi.bundle_id,
                            menu_item_id: bi.menu_item_id,
                            sort_order: bi.sort_order || 0,
                            menuItem: mi ? {
                                id: mi.id,
                                name: mi.name,
                                description: mi.description,
                                basePrice: mi.base_price,
                                category: mi.category,
                                popular: mi.popular,
                                available: mi.available ?? true,
                                sort_order: mi.sort_order ?? 0,
                                image: mi.image_url || undefined,
                                variations: mi.variations?.map((v: any) => ({
                                    id: v.id,
                                    name: v.name,
                                    price: v.price,
                                    type: v.type || 'Size'
                                })) || [],
                                servingPreferences: mi.serving_preferences?.map((s: any) => ({
                                    id: s.id,
                                    name: s.name,
                                    value: s.value,
                                    price: s.price
                                })) || [],
                                addOns: mi.add_ons?.map((a: any) => ({
                                    id: a.id,
                                    name: a.name,
                                    price: a.price,
                                    category: a.category
                                })) || []
                            } : null
                        };
                    })
                    .filter((bi: any) => bi.menuItem !== null) as BundleItem[]
            }));

            setBundles(formatted);
            setError(null);
        } catch (err) {
            console.error('Error fetching bundles:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch bundles');
        } finally {
            setLoading(false);
        }
    };

    const addBundle = async (
        bundle: Omit<Bundle, 'id' | 'created_at' | 'updated_at' | 'items'>,
        itemIds: string[]
    ) => {
        try {
            const maxSortOrder = Math.max(...bundles.map(b => b.sort_order), 0);

            const { data, error: insertError } = await supabase
                .from('bundles')
                .insert({
                    name: bundle.name,
                    description: bundle.description,
                    image_url: bundle.image_url || null,
                    pricing_type: bundle.pricing_type,
                    fixed_price: bundle.fixed_price,
                    discount_type: bundle.discount_type,
                    discount_value: bundle.discount_value,
                    active: bundle.active,
                    show_on_menu: bundle.show_on_menu,
                    sort_order: bundle.sort_order || maxSortOrder + 1,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Insert bundle items
            if (itemIds.length > 0) {
                const bundleItems = itemIds.map((menuItemId, index) => ({
                    bundle_id: data.id,
                    menu_item_id: menuItemId,
                    sort_order: index,
                }));

                const { error: itemsError } = await supabase
                    .from('bundle_items')
                    .insert(bundleItems);

                if (itemsError) throw itemsError;
            }

            await fetchBundles();
        } catch (err) {
            console.error('Error adding bundle:', err);
            throw err;
        }
    };

    const updateBundle = async (
        id: string,
        updates: Partial<Omit<Bundle, 'items'>>,
        itemIds?: string[]
    ) => {
        try {
            const { error: updateError } = await supabase
                .from('bundles')
                .update({
                    name: updates.name,
                    description: updates.description,
                    image_url: updates.image_url || null,
                    pricing_type: updates.pricing_type,
                    fixed_price: updates.fixed_price,
                    discount_type: updates.discount_type,
                    discount_value: updates.discount_value,
                    active: updates.active,
                    show_on_menu: updates.show_on_menu,
                    sort_order: updates.sort_order,
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // If itemIds provided, delete existing and re-insert
            if (itemIds !== undefined) {
                const { error: deleteError } = await supabase
                    .from('bundle_items')
                    .delete()
                    .eq('bundle_id', id);

                if (deleteError) throw deleteError;

                if (itemIds.length > 0) {
                    const bundleItems = itemIds.map((menuItemId, index) => ({
                        bundle_id: id,
                        menu_item_id: menuItemId,
                        sort_order: index,
                    }));

                    const { error: itemsError } = await supabase
                        .from('bundle_items')
                        .insert(bundleItems);

                    if (itemsError) throw itemsError;
                }
            }

            await fetchBundles();
        } catch (err) {
            console.error('Error updating bundle:', err);
            throw err;
        }
    };

    const deleteBundle = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('bundles')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchBundles();
        } catch (err) {
            console.error('Error deleting bundle:', err);
            throw err;
        }
    };

    const calculateBundlePrice = useCallback(
        (bundle: Bundle, itemCustomizations?: { addOns?: { price: number }[] }[]) => {
            const addOnsTotal = itemCustomizations
                ? itemCustomizations.reduce((sum, item) => {
                    return sum + (item.addOns || []).reduce((s, a) => s + a.price, 0);
                }, 0)
                : 0;

            if (bundle.pricing_type === 'fixed') {
                return bundle.fixed_price + addOnsTotal;
            }

            // Discount pricing: calculate from item base prices
            const itemsTotal = bundle.items.reduce((sum, bi) => sum + bi.menuItem.basePrice, 0);

            if (bundle.discount_type === 'fixed') {
                return Math.max(0, itemsTotal - bundle.discount_value) + addOnsTotal;
            }
            if (bundle.discount_type === 'percentage') {
                return itemsTotal * (1 - bundle.discount_value / 100) + addOnsTotal;
            }

            return itemsTotal + addOnsTotal;
        },
        []
    );

    const getOriginalPrice = useCallback(
        (bundle: Bundle) => {
            return bundle.items.reduce((sum, bi) => sum + bi.menuItem.basePrice, 0);
        },
        []
    );

    useEffect(() => {
        fetchBundles();
    }, []);

    return {
        bundles,
        loading,
        error,
        addBundle,
        updateBundle,
        deleteBundle,
        calculateBundlePrice,
        getOriginalPrice,
        refetch: fetchBundles,
    };
};
