import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FormSubmission {
  name: string;
  email: string;
  phone?: string;
  website_description: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Check for required environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');

  if (!supabaseUrl || supabaseUrl.trim() === '') {
    console.error('Missing SUPABASE_URL environment variable');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error: SUPABASE_URL is missing or empty' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '') {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing or empty' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!resendApiKey || resendApiKey.trim() === '') {
    console.error('Missing RESEND_API_KEY environment variable');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error: RESEND_API_KEY is missing or empty' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!notificationEmail || notificationEmail.trim() === '') {
    console.error('Missing NOTIFICATION_EMAIL environment variable');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error: NOTIFICATION_EMAIL is missing or empty' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const submission: FormSubmission = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      website_description: formData.get('website_description') as string,
    };

    // Validate required fields
    if (!submission.name || !submission.email || !submission.website_description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submission.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Log environment variables for debugging (remove in production)
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Set' : 'Missing');

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Insert form submission into database
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([{
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        website_description: submission.website_description,
        status: 'new'
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save submission',
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email notification
    try {
      const emailSubject = `New Website Request from ${submission.name}`;
      const emailHtml = `
        <h2>New Website Request Submission</h2>
        <p><strong>Name:</strong> ${submission.name}</p>
        <p><strong>Email:</strong> ${submission.email}</p>
        <p><strong>Phone:</strong> ${submission.phone || 'Not provided'}</p>
        <p><strong>Website Description:</strong></p>
        <p>${submission.website_description}</p>
        <hr>
        <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        <p><small>Submission ID: ${data.id}</small></p>
      `;

      await resend.emails.send({
        from: 'noreply@yourdomain.com', // Replace with your verified domain
        to: notificationEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the entire request if email fails - the form submission was successful
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submitted successfully!',
        id: data.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});