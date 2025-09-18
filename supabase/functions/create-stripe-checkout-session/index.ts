```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: config, error: configError } = await supabase
      .from('flash_sale_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !config) {
      console.error('Error fetching sale config:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve sale configuration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const saleStartTime = new Date(config.sale_start_time);
    const currentTime = new Date();
    const originalPrice = parseFloat(config.original_price);

    const elapsedMilliseconds = currentTime.getTime() - saleStartTime.getTime();
    const elapsedHours = elapsedMilliseconds / (1000 * 60 * 60);

    let currentPrice = originalPrice;
    let priceDescription = "Original Price";
    const totalSaleDurationHours = config.stage_1_duration_hours + config.stage_2_duration_hours + config.stage_3_duration_hours;

    if (elapsedHours < config.stage_1_duration_hours) {
      currentPrice = originalPrice * (1 - config.price_stage_1_discount);
      priceDescription = `Flash Sale (75% off)`;
    } else if (elapsedHours < (config.stage_1_duration_hours + config.stage_2_duration_hours)) {
      currentPrice = originalPrice * (1 - config.price_stage_2_discount);
      priceDescription = `Flash Sale (50% off)`;
    } else if (elapsedHours < totalSaleDurationHours) {
      currentPrice = originalPrice * (1 - config.price_stage_3_discount);
      priceDescription = `Flash Sale (25% off)`;
    } else {
      currentPrice = originalPrice;
      priceDescription = "Sale Ended - Original Price";
    }

    const priceInCents = Math.round(currentPrice * 100);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Professional One-Page Website',
              description: priceDescription,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('referer')}?success=true`,
      cancel_url: `${req.headers.get('referer')}?canceled=true`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```