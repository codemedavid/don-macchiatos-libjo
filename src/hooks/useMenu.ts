import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MenuItem } from '../types';

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);

      // Fetch menu items with their option groups
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          variations (*),
          serving_preferences (*),
          add_ons (*)
        `)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      const formattedItems: MenuItem[] = items?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        basePrice: item.base_price,
        category: item.category,
        popular: item.popular,
        available: item.available ?? true,
        sort_order: item.sort_order ?? 0,
        image: item.image_url || undefined,
        variations: item.variations?.map(v => ({
          id: v.id,
          name: v.name,
          price: v.price,
          type: v.type || 'Size'
        })) || [],
        servingPreferences: item.serving_preferences?.map(s => ({
          id: s.id,
          name: s.name,
          value: s.value,
          price: s.price
        })) || [],
        addOns: item.add_ons?.map(a => ({
          id: a.id,
          name: a.name,
          price: a.price,
          category: a.category
        })) || []
      })) || [];

      setMenuItems(formattedItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      // Get the next sort_order value
      const maxSortOrder = Math.max(...menuItems.map(i => i.sort_order ?? 0), 0);

      // Insert menu item
      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          base_price: item.basePrice,
          category: item.category,
          popular: item.popular || false,
          available: item.available ?? true,
          sort_order: maxSortOrder + 1,
          image_url: item.image || null
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Insert variations if any
      if (item.variations && item.variations.length > 0) {
        const { error: variationsError } = await supabase
          .from('variations')
          .insert(
            item.variations.map(v => ({
              menu_item_id: menuItem.id,
              name: v.name,
              price: v.price,
              type: v.type || 'Size'
            }))
          );

        if (variationsError) throw variationsError;
      }

      // Insert serving preferences if any
      if (item.servingPreferences && item.servingPreferences.length > 0) {
        const { error: servingPreferencesError } = await supabase
          .from('serving_preferences')
          .insert(
            item.servingPreferences.map(s => ({
              menu_item_id: menuItem.id,
              name: s.name,
              value: s.value,
              price: s.price
            }))
          );

        if (servingPreferencesError) throw servingPreferencesError;
      }

      // Insert add-ons if any
      if (item.addOns && item.addOns.length > 0) {
        const { error: addOnsError } = await supabase
          .from('add_ons')
          .insert(
            item.addOns.map(a => ({
              menu_item_id: menuItem.id,
              name: a.name,
              price: a.price,
              category: a.category
            }))
          );

        if (addOnsError) throw addOnsError;
      }

      await fetchMenuItems();
      return menuItem;
    } catch (err) {
      console.error('Error adding menu item:', err);
      throw err;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      // Update menu item
      const { error: itemError } = await supabase
        .from('menu_items')
        .update({
          name: updates.name,
          description: updates.description,
          base_price: updates.basePrice,
          category: updates.category,
          popular: updates.popular,
          available: updates.available,
          sort_order: updates.sort_order,
          image_url: updates.image || null
        })
        .eq('id', id);

      if (itemError) throw itemError;

      // Delete existing option records
      await supabase.from('variations').delete().eq('menu_item_id', id);
      await supabase.from('serving_preferences').delete().eq('menu_item_id', id);
      await supabase.from('add_ons').delete().eq('menu_item_id', id);

      // Insert new variations
      if (updates.variations && updates.variations.length > 0) {
        const { error: variationsError } = await supabase
          .from('variations')
          .insert(
            updates.variations.map(v => ({
              menu_item_id: id,
              name: v.name,
              price: v.price,
              type: v.type || 'Size'
            }))
          );

        if (variationsError) throw variationsError;
      }

      // Insert new serving preferences
      if (updates.servingPreferences && updates.servingPreferences.length > 0) {
        const { error: servingPreferencesError } = await supabase
          .from('serving_preferences')
          .insert(
            updates.servingPreferences.map(s => ({
              menu_item_id: id,
              name: s.name,
              value: s.value,
              price: s.price
            }))
          );

        if (servingPreferencesError) throw servingPreferencesError;
      }

      // Insert new add-ons
      if (updates.addOns && updates.addOns.length > 0) {
        const { error: addOnsError } = await supabase
          .from('add_ons')
          .insert(
            updates.addOns.map(a => ({
              menu_item_id: id,
              name: a.name,
              price: a.price,
              category: a.category
            }))
          );

        if (addOnsError) throw addOnsError;
      }

      await fetchMenuItems();
    } catch (err) {
      console.error('Error updating menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchMenuItems();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      throw err;
    }
  };

  const reorderMenuItems = async (reorderedItems: MenuItem[]) => {
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('menu_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      await fetchMenuItems();
    } catch (err) {
      console.error('Error reordering menu items:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    refetch: fetchMenuItems
  };
};
