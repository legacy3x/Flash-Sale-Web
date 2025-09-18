/*
  # Create flash sale configuration table

  1. New Tables
    - `flash_sale_config`
      - `id` (uuid, primary key)
      - `sale_start_time` (timestamp with time zone)
      - `original_price` (numeric)
      - `price_stage_1_discount` (numeric) - 75% off
      - `price_stage_2_discount` (numeric) - 50% off
      - `price_stage_3_discount` (numeric) - 25% off
      - `stage_1_duration_hours` (integer) - 12 hours
      - `stage_2_duration_hours` (integer) - 8 hours
      - `stage_3_duration_hours` (integer) - 4 hours
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `flash_sale_config` table
    - Add policy for public read access
    - Add policy for service role management

  3. Initial Data
    - Insert default configuration with current timestamp
*/

CREATE TABLE IF NOT EXISTS flash_sale_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_start_time timestamptz NOT NULL,
  original_price numeric NOT NULL DEFAULT 999.00,
  price_stage_1_discount numeric NOT NULL DEFAULT 0.75,
  price_stage_2_discount numeric NOT NULL DEFAULT 0.50,
  price_stage_3_discount numeric NOT NULL DEFAULT 0.25,
  stage_1_duration_hours integer NOT NULL DEFAULT 12,
  stage_2_duration_hours integer NOT NULL DEFAULT 8,
  stage_3_duration_hours integer NOT NULL DEFAULT 4,
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