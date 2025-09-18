import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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
    let discountPercentage = 0;
    const totalSaleDurationHours = config.stage_1_duration_hours + config.stage_2_duration_hours + config.stage_3_duration_hours;
    let remainingSaleTimeHours = totalSaleDurationHours - elapsedHours;

    if (elapsedHours < config.stage_1_duration_hours) {
      currentPrice = originalPrice * (1 - config.price_stage_1_discount);
      discountPercentage = config.price_stage_1_discount * 100;
    } else if (elapsedHours < (config.stage_1_duration_hours + config.stage_2_duration_hours)) {
      currentPrice = originalPrice * (1 - config.price_stage_2_discount);
      discountPercentage = config.price_stage_2_discount * 100;
    } else if (elapsedHours < totalSaleDurationHours) {
      currentPrice = originalPrice * (1 - config.price_stage_3_discount);
      discountPercentage = config.price_stage_3_discount * 100;
    } else {
      currentPrice = originalPrice;
      remainingSaleTimeHours = 0;
    }

    return new Response(
      JSON.stringify({
        originalPrice: originalPrice.toFixed(2),
        currentPrice: currentPrice.toFixed(2),
        discountPercentage: discountPercentage,
        saleEnded: remainingSaleTimeHours <= 0,
        remainingSaleTimeHours: Math.max(0, remainingSaleTimeHours),
        saleStartTime: saleStartTime.toISOString(),
        elapsedHours: elapsedHours,
        config: {
          stage1Duration: config.stage_1_duration_hours,
          stage2Duration: config.stage_2_duration_hours,
          stage3Duration: config.stage_3_duration_hours,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-current-sale-price:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});