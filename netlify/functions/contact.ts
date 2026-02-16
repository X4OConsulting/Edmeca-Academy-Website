import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../client/src/lib/types';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Server-side key

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { name, email, company, audienceType, message } = body;

    // Validate required fields
    if (!name || !email || !audienceType || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Missing required fields: name, email, audienceType, message' 
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email format' }),
      };
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        company: company || null,
        audience_type: audienceType,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to save contact submission' }),
      };
    }

    // TODO: Add email notification here
    // You can integrate with SendGrid, Mailgun, or Gmail SMTP
    // For now, we'll just log it
    console.log('Contact form submission:', { name, email, company, audienceType, message });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Configure this properly for production
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        message: 'Contact form submitted successfully',
        id: data.id 
      }),
    };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

export { handler };