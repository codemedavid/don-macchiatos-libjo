/*
  # Create Promotional Banners Table

  1. New Tables
    - `promotional_banners`
      - `id` (uuid, primary key)
      - `title` (text) - Banner headline
      - `description` (text, optional) - Banner subtitle/description
      - `image_url` (text) - Banner image URL
      - `link_url` (text, optional) - Click destination URL
      - `active` (boolean) - Toggle visibility
      - `sort_order` (integer) - Display order
      - `start_date` (timestamptz, optional) - Start showing banner
      - `end_date` (timestamptz, optional) - Stop showing banner
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Add policy for public read access (active banners only)
    - Add policy for authenticated admin write access
*/

-- Create promotional_banners table
CREATE TABLE IF NOT EXISTS promotional_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (only active banners within date range)
CREATE POLICY "Anyone can read active banners"
  ON promotional_banners
  FOR SELECT
  TO public
  USING (
    active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Create policy for authenticated users to manage banners
CREATE POLICY "Authenticated users can manage banners"
  ON promotional_banners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_promotional_banners_updated_at
  BEFORE UPDATE ON promotional_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
