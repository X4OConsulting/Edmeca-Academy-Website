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

// CORS origins that are permitted to call this function
const ALLOWED_ORIGINS = [
  'https://edmeca.co.za',
  'https://edmecaacademy.netlify.app',
  'https://staging--edmecaacademy.netlify.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
  };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const origin = event.headers['origin'] ?? event.headers['Origin'];

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        ...corsHeaders(origin),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(origin),
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
        headers: corsHeaders(origin),
        body: JSON.stringify({ 
          message: 'Missing required fields: name, email, audienceType, message' 
        }),
      };
    }

    // Input length limits to prevent abuse
    if (name.length > 100 || email.length > 200 || (company && company.length > 200) || message.length > 5000) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ message: 'Input exceeds maximum allowed length' }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ message: 'Invalid email format' }),
      };
    }

    // Validate audienceType against allowed values
    const allowedAudienceTypes = ['entrepreneur', 'student', 'corporate', 'investor', 'other'];
    if (!allowedAudienceTypes.includes(audienceType)) {
      return {
        statusCode: 400,
        headers: corsHeaders(origin),
        body: JSON.stringify({ message: 'Invalid audience type' }),
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
      console.error('Supabase error saving contact submission');
      return {
        statusCode: 500,
        headers: corsHeaders(origin),
        body: JSON.stringify({ message: 'Failed to save contact submission' }),
      };
    }

    // Log minimal audit info — never log message content (PII)
    console.log('Contact form submission received', { id: data.id, audienceType });

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ 
        message: 'Contact form submitted successfully',
        id: data.id 
      }),
    };
  } catch (error) {
    console.error('Contact form error');
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

export { handler };