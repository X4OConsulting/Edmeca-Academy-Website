// Gmail integration for sending contact form emails
// Uses Replit's Gmail connector

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface ContactEmailData {
  name: string;
  email: string;
  company?: string;
  audienceType: string;
  message: string;
}

// Sanitize input to prevent header injection attacks
function sanitizeHeaderValue(value: string): string {
  // Remove any CR/LF characters that could be used for header injection
  return value.replace(/[\r\n]/g, ' ').trim();
}

// Validate email format and sanitize
function sanitizeEmail(email: string): string {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeHeaderValue(email);
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const gmail = await getGmailClient();
  
  // Sanitize all user inputs
  const sanitizedName = sanitizeHeaderValue(data.name);
  const sanitizedEmail = sanitizeEmail(data.email);
  const sanitizedCompany = data.company ? sanitizeHeaderValue(data.company) : 'Not provided';
  const sanitizedMessage = data.message.replace(/[\r\n]+/g, '\n'); // Normalize line breaks in body
  
  const audienceLabels: Record<string, string> = {
    entrepreneur: "Entrepreneur",
    programme: "Programme/Incubator",
    other: "Other"
  };

  const emailContent = `
New Contact Form Submission from EdMeCa Website

Name: ${sanitizedName}
Email: ${sanitizedEmail}
Company: ${sanitizedCompany}
Audience Type: ${audienceLabels[data.audienceType] || data.audienceType}

Message:
${sanitizedMessage}

---
This message was sent via the EdMeCa website contact form.
`;

  const recipientEmail = 'Info@edmeca.co.za';
  const subject = `[EdMeCa Contact] New inquiry from ${sanitizedName}`;

  // Create the email in base64url format
  const emailLines = [
    `To: ${recipientEmail}`,
    `Subject: ${sanitizeHeaderValue(subject)}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Reply-To: ${sanitizedEmail}`,
    '',
    emailContent
  ];
  
  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email).toString('base64url');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });
}
