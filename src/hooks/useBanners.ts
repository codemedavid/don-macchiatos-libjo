import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PromotionalBanner } from '../types';
import { getCache, setCache } from '../lib/cache';

const CACHE_KEY = 'banners';

export const useBanners = () => {
    const cached = getCache<PromotionalBanner[]>(CACHE_KEY);
    const [banners, setBanners] = useState<PromotionalBanner[]>(cached || []);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);
    const isInitialLoad = useRef(true);

    const fetchBanners = async (activeOnly = false) => {
        try {
            // Only show loading spinner on first load with no cache
            if (!isInitialLoad.current || !cached) {
                setLoading(true);
            }

            let query = supabase
                .from('promotional_banners')
                .select('*')
                .order('sort_order', { ascending: true });

            if (activeOnly) {
                const now = new Date().toISOString();
                query = query
                    .eq('active', true)
                    .or(`start_date.is.null,start_date.lte.${now}`)
                    .or(`end_date.is.null,end_date.gte.${now}`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const result = data || [];
            setBanners(result);
            setCache(CACHE_KEY, result);
            setError(null);
        } catch (err) {
            console.error('Error fetching banners:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch banners');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    };

    const addBanner = async (banner: Omit<PromotionalBanner, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            // Get the max sort_order
            const { data: maxOrderData } = await supabase
                .from('promotional_banners')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1);

            const nextOrder = (maxOrderData?.[0]?.sort_order ?? 0) + 1;

            const { data, error: insertError } = await supabase
                .from('promotional_banners')
                .insert({
                    title: banner.title,
                    description: banner.description,
                    image_url: banner.image_url,
                    link_url: banner.link_url,
                    active: banner.active ?? true,
                    sort_order: nextOrder,
                    start_date: banner.start_date,
                    end_date: banner.end_date
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchBanners();
            return data;
        } catch (err) {
            console.error('Error adding banner:', err);
            throw err;
        }
    };

    const updateBanner = async (id: string, updates: Partial<PromotionalBanner>) => {
        try {
            const { error: updateError } = await supabase
                .from('promotional_banners')
                .update({
                    title: updates.title,
                    description: updates.description,
                    image_url: updates.image_url,
                    link_url: updates.link_url,
                    active: updates.active,
                    sort_order: updates.sort_order,
                    start_date: updates.start_date,
                    end_date: updates.end_date
                })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchBanners();
        } catch (err) {
            console.error('Error updating banner:', err);
            throw err;
        }
    };

    const deleteBanner = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('promotional_banners')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchBanners();
        } catch (err) {
            console.error('Error deleting banner:', err);
            throw err;
        }
    };

    const reorderBanners = async (reorderedBanners: PromotionalBanner[]) => {
        try {
            const updates = reorderedBanners.map((banner, index) => ({
                id: banner.id,
                sort_order: index + 1
            }));

            for (const update of updates) {
                await supabase
                    .from('promotional_banners')
                    .update({ sort_order: update.sort_order })
                    .eq('id', update.id);
            }

            await fetchBanners();
        } catch (err) {
            console.error('Error reordering banners:', err);
            throw err;
        }
    };

    const toggleBannerActive = async (id: string, active: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('promotional_banners')
                .update({ active })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchBanners();
        } catch (err) {
            console.error('Error toggling banner:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    return {
        banners,
        loading,
        error,
        addBanner,
        updateBanner,
        deleteBanner,
        reorderBanners,
        toggleBannerActive,
        refetch: fetchBanners
    };
};
