/*
  # Create serving preferences table

  1. New table
    - `serving_preferences`
      - `id` (uuid, primary key)
      - `menu_item_id` (uuid, foreign key)
      - `name` (text)
      - `value` (text)
      - `price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Public read access
    - Authenticated write access

  3. Cleanup
    - Remove deprecated `serving_preference` column from `variations`
*/

CREATE TABLE IF NOT EXISTS serving_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE serving_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read serving preferences"
  ON serving_preferences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage serving preferences"
  ON serving_preferences
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE variations
DROP CONSTRAINT IF EXISTS variations_serving_preference_check;

ALTER TABLE variations
DROP COLUMN IF EXISTS serving_preference;
