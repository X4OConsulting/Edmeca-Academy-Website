import { Handler, HandlerEvent } from '@netlify/functions';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured.' }) };
  }

  let body: { messages?: any[]; businessContext?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { messages = [], businessContext = '' } = body;
  if (!messages.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No messages provided' }) };
  }

  const systemPrompt = `You are EdMeCa AI, a friendly business advisor built into the EdMeCa Academy portal — a South African entrepreneurship platform.

Your role is to help entrepreneurs understand and improve their business model. You have access to the user's current business data below. Use it to give specific, practical advice.

${businessContext ? `--- USER'S BUSINESS DATA ---\n${businessContext}\n--- END OF BUSINESS DATA ---` : 'The user has not created any business tools yet.'}

Guidelines:
- Be concise and practical — entrepreneurs are busy
- Use South African context where relevant (ZAR, SA market, local regulations when applicable)
- If a section is empty, gently encourage the user to fill it in
- Avoid generic advice — reference their specific data whenever possible
- Keep responses under 200 words unless the user explicitly asks for detail
- Never make up data not present in the user's business context`;

  // Keep only last 10 messages to manage token usage
  const trimmedMessages = messages.slice(-10);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmedMessages,
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI service unavailable. Please try again shortly.' }) };
    }

    const data = await response.json() as any;
    const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
