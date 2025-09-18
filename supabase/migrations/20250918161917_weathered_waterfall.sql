```sql
CREATE TABLE public.flash_sale_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_start_time timestamp with time zone NOT NULL,
    original_price numeric NOT NULL DEFAULT 999.00,
    price_stage_1_discount numeric NOT NULL DEFAULT 0.75, -- 75% off
    price_stage_2_discount numeric NOT NULL DEFAULT 0.50,  -- 50% off
    price_stage_3_discount numeric NOT NULL DEFAULT 0.25,  -- 25% off
    stage_1_duration_hours integer NOT NULL DEFAULT 12,
    stage_2_duration_hours integer NOT NULL DEFAULT 8,
    stage_3_duration_hours integer NOT NULL DEFAULT 4,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.flash_sale_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all users" ON public.flash_sale_config
FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage flash sale config" ON public.flash_sale_config
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.flash_sale_config (sale_start_time, original_price, price_stage_1_discount, price_stage_2_discount, price_stage_3_discount, stage_1_duration_hours, stage_2_duration_hours, stage_3_duration_hours)
VALUES (now(), 999.00, 0.75, 0.50, 0.25, 12, 8, 4);
```