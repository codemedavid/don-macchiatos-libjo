-- Add 'type' column to variations table for grouping (e.g., Size, Flavor, Milk)
ALTER TABLE variations ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'Size';
