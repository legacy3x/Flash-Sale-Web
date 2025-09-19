/*
  # Create flash sale configuration table

  1. New Tables
    - `flash_sale_config`
      - `id` (uuid, primary key)
      - `sale_start_time` (timestamptz) - When the sale started
      - `original_price` (numeric) - Original price before discount
      - `price_stage_1_discount` (numeric) - Stage 1 discount percentage (0.75 = 75%)
      - `price_stage_2_discount` (numeric) - Stage 2 discount percentage (0.50 = 50%)
      - `price_stage_3_discount` (numeric) - Stage 3 discount percentage (0.25 = 25%)
      - `stage_1_duration_hours` (integer) - Duration of stage 1 in hours
      - `stage_2_duration_hours` (integer) - Duration of stage 2 in hours
      - `stage_3_duration_hours` (integer) - Duration of stage 3 in hours
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `flash_sale_config` table
    - Add policy for public read access
    - Add policy for service role management

  3. Initial Data
    - Insert default configuration with current timestamp as sale start
*/

CREATE TABLE IF NOT EXISTS flash_sale_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_start_time timestamptz NOT NULL,
  original_price numeric DEFAULT 999.00 NOT NULL,
  price_stage_1_discount numeric DEFAULT 0.75 NOT NULL,
  price_stage_2_discount numeric DEFAULT 0.50 NOT NULL,
  price_stage_3_discount numeric DEFAULT 0.25 NOT NULL,
  stage_1_duration_hours integer DEFAULT 12 NOT NULL,
  stage_2_duration_hours integer DEFAULT 8 NOT NULL,
  stage_3_duration_hours integer DEFAULT 4 NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flash_sale_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to flash sale config"
  ON flash_sale_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage flash sale config"
  ON flash_sale_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert initial configuration data
INSERT INTO flash_sale_config (
  sale_start_time,
  original_price,
  price_stage_1_discount,
  price_stage_2_discount,
  price_stage_3_discount,
  stage_1_duration_hours,
  stage_2_duration_hours,
  stage_3_duration_hours
) VALUES (
  now(),
  999.00,
  0.75,
  0.50,
  0.25,
  12,
  8,
  4
);