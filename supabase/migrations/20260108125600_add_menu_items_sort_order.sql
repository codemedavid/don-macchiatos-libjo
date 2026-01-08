/*
  # Add sort_order to menu_items table
  
  1. Changes
    - Add `sort_order` column to `menu_items` table for ordering items
    - Initialize existing items with incrementing sort order based on created_at
*/

-- Add sort_order column to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Initialize sort_order for existing items based on created_at order
WITH ordered_items AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM menu_items
)
UPDATE menu_items 
SET sort_order = ordered_items.row_num
FROM ordered_items 
WHERE menu_items.id = ordered_items.id;
