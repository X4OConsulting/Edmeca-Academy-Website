---
name: add-netlify-function
description: 'Scaffold a new Netlify serverless function for the EdMeCa Academy backend with input validation, error handling, Supabase auth verification, and security boilerplate.'
argument-hint: 'Function name and purpose (e.g. send-contact-email — sends enquiry via Resend)'
---

Scaffold a new Netlify Function named **${input:functionName}** that **${input:purpose}**.

## Steps

### 1. Create the function file
Create `netlify/functions/${input:functionName}.mjs` using ESM format:

```js
// netlify/functions/${input:functionName}.mjs
// Required env vars: LIST_THEM_HERE

export const handler = async (event) => {
  // 1. Method guard
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. CORS preflight (only if cross-origin calls are needed)
  // if (event.httpMethod === 'OPTIONS') {
  //   return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': 'https://edmeca.co.za', ... } };
  // }

  // 3. Parse and validate body
  let data;
  try {
    data = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // 4. Validate required fields (replace with actual fields)
  const { fieldName } = data;
  if (!fieldName || typeof fieldName !== 'string' || !fieldName.trim()) {
    return { statusCode: 422, body: JSON.stringify({ error: 'fieldName is required' }) };
  }

  // 5. Read env vars at runtime (never hardcode)
  const apiKey = process.env.YOUR_API_KEY;
  if (!apiKey) {
    console.error('YOUR_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  // 6. Business logic here
  try {
    // ... call Resend, Supabase admin SDK, etc.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('${input:functionName} error:', err.message);
    // Do NOT leak err.message to client — it may contain sensitive info
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

Apply the boilerplate above, then fill in the business logic for: **${input:purpose}**.

### 2. Add a Netlify redirect (optional)
If a cleaner URL is preferred over `/.netlify/functions/${input:functionName}`, add to `netlify.toml`:
```toml
[[redirects]]
  from = "/api/${input:functionName}"
  to = "/.netlify/functions/${input:functionName}"
  status = 200
  force = true
```

### 3. Register required env vars
- List every env var the function needs in a comment at the top of the file
- Add them to **Netlify dashboard** under the correct context (Site settings → Environment variables)
  - Production (`main`): real values
  - Staging/Development: test values or same real values
- Never put real secrets in `netlify.toml`

### 4. Call from the React client
Use `apiRequest` from `client/src/lib/queryClient.ts` to POST to the function:
```ts
import { apiRequest } from "@/lib/queryClient";
const res = await apiRequest("POST", "/.netlify/functions/${input:functionName}", { fieldName: value });
```

### 5. Test locally
```sh
netlify dev   # Requires: npm i -g netlify-cli
# Then POST to http://localhost:8888/.netlify/functions/${input:functionName}
```

### 6. Type-check
```sh
npm run check
```

## Security Checklist
- [ ] HTTP method validated before processing body
- [ ] `event.body` always parsed inside try/catch
- [ ] All required fields validated (type + presence + length limits)
- [ ] Env vars read at runtime, not hardcoded
- [ ] Error responses never expose stack traces or internal error messages
- [ ] No secrets logged via `console.log`
- [ ] If using Supabase admin SDK: verify JWT from `Authorization` header before trusting user claims
- [ ] CORS `Access-Control-Allow-Origin` locked to `https://edmeca.co.za` and `https://staging--edmecaacademy.netlify.app` — not `*`
