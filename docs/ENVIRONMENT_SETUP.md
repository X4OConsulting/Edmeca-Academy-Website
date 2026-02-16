# Environment Configuration Guide

## Overview
This guide covers all environment variables needed for the EDMECA Academy project across development, staging, and production environments.

## Environment Files

### File Structure
```
.env.example       # Template with all required variables
.env               # Local development (ignored by git)
.env.local         # Local overrides (ignored by git)
```

### Netlify Environment Variables
Production and staging variables are configured in:
- **Netlify Dashboard** → Site Settings → Environment Variables
- **GitHub Repository** → Settings → Secrets (for Actions)

## Required Environment Variables

### Supabase Configuration
```bash
# Supabase Project Settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side (Netlify Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to Get Supabase Credentials:**
1. Login to [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. **Settings** → **API** 
4. Copy **Project URL** and **anon/public key**
5. For service role: Copy **service_role key** (keep secret!)

### Authentication Providers

#### Google OAuth
```bash
# Google OAuth Configuration  
VITE_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. **Create OAuth 2.0 Client ID**
4. **Authorized origins**: `https://your-domain.com`
5. **Authorized redirects**: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret

#### GitHub OAuth
```bash
# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Setup GitHub OAuth:**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. **Homepage URL**: `https://your-domain.com`
4. **Authorization callback**: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and generate Client Secret

### Email Configuration
```bash
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

**Setup Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. **App passwords** → **Generate new**
4. Select **Mail** and **Other** (custom name)
5. Use generated 16-digit password

### Database Configuration (Optional)
```bash
# Direct Database Access (if needed)
DATABASE_URL=postgresql://user:pass@host:port/db
DIRECT_URL=postgresql://user:pass@host:port/db
```

### Application Settings
```bash
# Application Configuration
VITE_APP_NAME="EDMECA Digital Academy"
VITE_APP_URL=https://edmeca.com
VITE_CONTACT_EMAIL=info@edmeca.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=false
VITE_MAINTENANCE_MODE=false
```

### Security & Monitoring
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key

# API Keys
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=1234567

# Error Monitoring (if using Sentry)
VITE_SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/...
```

## Environment-Specific Configuration

### Development (.env)
```bash
# Supabase
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key

# App Settings  
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_ANALYTICS=false
VITE_MAINTENANCE_MODE=false

# Debug Settings
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Staging Environment
```bash
# Supabase (staging project)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# App Settings
VITE_APP_URL=https://staging.edmeca.com
VITE_ENABLE_ANALYTICS=true
VITE_MAINTENANCE_MODE=false

# OAuth (staging apps)
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id
VITE_GITHUB_CLIENT_ID=your-staging-github-client-id
```

### Production Environment  
```bash
# Supabase (production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key

# App Settings
VITE_APP_URL=https://edmeca.com
VITE_ENABLE_ANALYTICS=true
VITE_MAINTENANCE_MODE=false

# OAuth (production apps)
VITE_GOOGLE_CLIENT_ID=your-prod-google-client-id
VITE_GITHUB_CLIENT_ID=your-prod-github-client-id
```

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Supabase
1. Create Supabase project at [supabase.com](https://supabase.com)  
2. Copy project URL and anon key to `.env`
3. Configure authentication providers in Supabase dashboard
4. Set up database schema (see database documentation)

### 3. Set Up OAuth Providers

#### Google OAuth Setup
1. **Google Cloud Console** → **New Project**
2. **APIs & Services** → **Enable Gmail API**
3. **Credentials** → **Create OAuth 2.0 Client**
4. Add authorized origins and redirect URIs
5. Copy credentials to `.env`

#### GitHub OAuth Setup
1. **GitHub Settings** → **Developer settings**  
2. **OAuth Apps** → **New OAuth App**
3. Configure app URLs and callback
4. Copy credentials to `.env`

### 4. Configure Supabase Auth
In your Supabase dashboard:
1. **Authentication** → **Settings**
2. **Site URL**: Your app URL
3. **Redirect URLs**: Add all your domain variants
4. **OAuth Providers**: Enable Google and GitHub
5. Add client IDs and secrets from OAuth setup

### 5. Test Configuration
```bash
# Start development server
npm run dev

# Test authentication flows:
# - Email signup/login
# - Google OAuth  
# - GitHub OAuth
# - Password reset
```

## Netlify Environment Configuration

### Setting Variables in Netlify
1. **Netlify Dashboard** → **Site Settings**
2. **Environment Variables** section
3. **Add Variable** for each required env var
4. **Deploy**: Redeploy to apply changes

### Netlify CLI Configuration
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and link site  
netlify login
netlify link

# Set environment variables via CLI
netlify env:set VITE_SUPABASE_URL "your-url"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key"

# Import from file
netlify env:import .env
```

### Build Environment Variables
```bash
# Build-time variables (set in Netlify)
NODE_VERSION=18
NPM_FLAGS="--legacy-peer-deps"
COMMAND="npm run build"
PUBLISH_DIRECTORY="client/dist"
FUNCTIONS_DIRECTORY="server"
```

## Security Best Practices

### Variable Protection
- ✅ **Never commit secrets** to version control  
- ✅ **Use VITE_ prefix** for frontend variables only
- ✅ **Rotate keys regularly** (quarterly recommended)
- ✅ **Different keys per environment** (dev/staging/prod)
- ✅ **Principle of least privilege** for service accounts

### Access Control
```bash
# Development team access
DEVELOPER_EMAIL=dev@edmeca.com

# Admin access  
ADMIN_EMAIL=admin@edmeca.com
SUPER_ADMIN_EMAIL=superadmin@edmeca.com
```

### Monitoring & Alerts
```bash
# Error monitoring
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token

# Performance monitoring
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=1234567
```

## Troubleshooting

### Common Issues

**Supabase Connection Errors**
- Verify URL format: `https://abc123.supabase.co`
- Check anon key (starts with `eyJ...`)
- Ensure project isn't paused (free tier)

**OAuth Not Working**
- Check redirect URLs match exactly
- Verify client IDs are correct
- Ensure secrets are set server-side only

**Build Failures**  
- All VITE_ variables must be available at build time
- Check Netlify environment variables are set
- Verify no syntax errors in .env files

**Authentication Failures**
- Check Supabase Auth settings
- Verify OAuth provider configuration
- Clear browser storage and try again

### Validation Script
```bash
# Create validation script
cat > scripts/validate-env.js << 'EOF'
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'VITE_GOOGLE_CLIENT_ID'
];

required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
  } else {
    console.log(`✅ ${key} is configured`);
  }
});
EOF

# Run validation
node scripts/validate-env.js
```

## Environment Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] Different keys for each environment  
- [ ] OAuth apps configured per environment
- [ ] Supabase RLS policies enabled
- [ ] CORS configured correctly
- [ ] SSL certificates active
- [ ] Environment variables encrypted at rest
- [ ] Service account permissions minimized
- [ ] Regular key rotation scheduled
- [ ] Monitoring and alerting active

---

**Next Steps**: After environment setup, see [AUTHENTICATION.md](AUTHENTICATION.md) for auth configuration details.