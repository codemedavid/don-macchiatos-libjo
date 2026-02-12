import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Upsell, UpsellType, MenuItem } from '../types';

export const useUpsells = () => {
    const [upsells, setUpsells] = useState<Upsell[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUpsells = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('upsells')
                .select('*')
                .order('sort_order', { ascending: true });

            if (fetchError) throw fetchError;

            const formatted: Upsell[] = (data || []).map(row => ({
                id: row.id,
                type: row.type as UpsellType,
                name: row.name,
                description: row.description || '',
                trigger_item_ids: row.trigger_item_ids || [],
                offer_item_ids: row.offer_item_ids || [],
                discount_type: row.discount_type as Upsell['discount_type'],
                discount_value: Number(row.discount_value) || 0,
                active: row.active,
                sort_order: row.sort_order || 0,
                image_url: row.image_url || undefined,
                skip_label: row.skip_label || 'No, thanks',
                accept_label: row.accept_label || 'Add to Order',
                created_at: row.created_at,
                updated_at: row.updated_at,
            }));

            setUpsells(formatted);
            setError(null);
        } catch (err) {
            console.error('Error fetching upsells:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch upsells');
        } finally {
            setLoading(false);
        }
    };

    const addUpsell = async (upsell: Omit<Upsell, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const maxSortOrder = Math.max(...upsells.map(u => u.sort_order), 0);
            const { error: insertError } = await supabase
                .from('upsells')
                .insert({
                    type: upsell.type,
                    name: upsell.name,
                    description: upsell.description,
                    trigger_item_ids: upsell.trigger_item_ids,
                    offer_item_ids: upsell.offer_item_ids,
                    discount_type: upsell.discount_type,
                    discount_value: upsell.discount_value,
                    active: upsell.active,
                    sort_order: upsell.sort_order || maxSortOrder + 1,
                    image_url: upsell.image_url || null,
                    skip_label: upsell.skip_label || 'No, thanks',
                    accept_label: upsell.accept_label || 'Add to Order',
                });

            if (insertError) throw insertError;
            await fetchUpsells();
        } catch (err) {
            console.error('Error adding upsell:', err);
            throw err;
        }
    };

    const updateUpsell = async (id: string, updates: Partial<Upsell>) => {
        try {
            const { error: updateError } = await supabase
                .from('upsells')
                .update({
                    type: updates.type,
                    name: updates.name,
                    description: updates.description,
                    trigger_item_ids: updates.trigger_item_ids,
                    offer_item_ids: updates.offer_item_ids,
                    discount_type: updates.discount_type,
                    discount_value: updates.discount_value,
                    active: updates.active,
                    sort_order: updates.sort_order,
                    image_url: updates.image_url || null,
                    skip_label: updates.skip_label,
                    accept_label: updates.accept_label,
                })
                .eq('id', id);

            if (updateError) throw updateError;
            await fetchUpsells();
        } catch (err) {
            console.error('Error updating upsell:', err);
            throw err;
        }
    };

    const deleteUpsell = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('upsells')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchUpsells();
        } catch (err) {
            console.error('Error deleting upsell:', err);
            throw err;
        }
    };

    // Get best_pair upsells for a specific menu item
    const getUpsellsForItem = useCallback(
        (itemId: string): Upsell[] => {
            return upsells.filter(
                u => u.type === 'best_pair' && u.active && u.trigger_item_ids.includes(itemId)
            );
        },
        [upsells]
    );

    // Get upgrade_meal upsells relevant to current cart items
    const getUpgradeMealUpsells = useCallback(
        (cartItemIds: string[]): Upsell[] => {
            return upsells.filter(
                u =>
                    u.type === 'upgrade_meal' &&
                    u.active &&
                    u.trigger_item_ids.some(tid => cartItemIds.includes(tid))
            );
        },
        [upsells]
    );

    // Get all active before_you_go upsells
    const getBeforeYouGoUpsells = useCallback((): Upsell[] => {
        return upsells.filter(u => u.type === 'before_you_go' && u.active);
    }, [upsells]);

    // Resolve offer_item_ids to full MenuItem objects
    const resolveOfferItems = useCallback(
        (offerItemIds: string[], menuItems: MenuItem[]): MenuItem[] => {
            return offerItemIds
                .map(id => menuItems.find(mi => mi.id === id))
                .filter((item): item is MenuItem => !!item);
        },
        []
    );

    useEffect(() => {
        fetchUpsells();
    }, []);

    return {
        upsells,
        loading,
        error,
        addUpsell,
        updateUpsell,
        deleteUpsell,
        getUpsellsForItem,
        getUpgradeMealUpsells,
        getBeforeYouGoUpsells,
        resolveOfferItems,
        refetch: fetchUpsells,
    };
};
