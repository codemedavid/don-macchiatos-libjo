/*
  # Create Upsells System

  1. New Tables
    - `upsells`
      - `id` (uuid, primary key)
      - `type` (text) - 'best_pair', 'upgrade_meal', or 'before_you_go'
      - `name` (text)
      - `description` (text)
      - `trigger_item_ids` (uuid[]) - menu items that activate the upsell
      - `offer_item_ids` (uuid[]) - menu items offered as the upsell
      - `discount_type` (text) - 'none', 'fixed', or 'percentage'
      - `discount_value` (decimal)
      - `active` (boolean)
      - `sort_order` (integer)
      - `image_url` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access
    - Authenticated full access
*/

-- Create upsells table
CREATE TABLE IF NOT EXISTS upsells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('best_pair', 'upgrade_meal', 'before_you_go')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  trigger_item_ids uuid[] DEFAULT '{}',
  offer_item_ids uuid[] DEFAULT '{}',
  discount_type text NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'fixed', 'percentage')),
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  image_url text,
  skip_label text NOT NULL DEFAULT 'No, thanks',
  accept_label text NOT NULL DEFAULT 'Add to Order',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE upsells ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read upsells"
  ON upsells
  FOR SELECT
  TO public
  USING (true);

-- Authenticated full access
CREATE POLICY "Authenticated users can manage upsells"
  ON upsells
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public insert/update/delete (matching the anon key pattern used in admin)
CREATE POLICY "Anon users can insert upsells"
  ON upsells
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update upsells"
  ON upsells
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete upsells"
  ON upsells
  FOR DELETE
  TO anon
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_upsells_updated_at
  BEFORE UPDATE ON upsells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
