/*
  # Create form_submissions table

  1. New Tables
    - `form_submissions`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `phone` (text, optional)
      - `website_description` (text, required)
      - `status` (text, default 'new')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `form_submissions` table
    - Add policy for service role to insert and read form submissions
*/

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  website_description text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role to insert form submissions"
  ON public.form_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to read form submissions"
  ON public.form_submissions
  FOR SELECT
  TO service_role
  USING (true);