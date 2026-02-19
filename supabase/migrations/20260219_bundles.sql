/*
  # Create Bundles System

  1. New Tables
    - `bundles` - bundle definitions with pricing
    - `bundle_items` - items in each bundle

  2. Alter existing
    - `upsells` - add bundle_id FK

  3. Security
    - Enable RLS
    - Public read access
    - Anon write access (same pattern as upsells)
*/

-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  pricing_type text NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'discount')),
  fixed_price decimal(10,2) NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'fixed', 'percentage')),
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  show_on_menu boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0
);

-- Add bundle_id to upsells
ALTER TABLE upsells ADD COLUMN IF NOT EXISTS bundle_id uuid REFERENCES bundles(id) ON DELETE SET NULL;

-- Enable RLS on bundles
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bundles"
  ON bundles FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage bundles"
  ON bundles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon users can insert bundles"
  ON bundles FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon users can update bundles"
  ON bundles FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon users can delete bundles"
  ON bundles FOR DELETE TO anon USING (true);

-- Enable RLS on bundle_items
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bundle_items"
  ON bundle_items FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage bundle_items"
  ON bundle_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon users can insert bundle_items"
  ON bundle_items FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon users can update bundle_items"
  ON bundle_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon users can delete bundle_items"
  ON bundle_items FOR DELETE TO anon USING (true);

-- Updated_at trigger for bundles
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
