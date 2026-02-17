# Deployment Guide

## Overview
Complete deployment guide for EDMECA Academy across development, staging, and production environments using Netlify + Supabase architecture.

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│   localhost     │    │ staging.edmeca  │    │   edmeca.com    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Local Supabase│    │ • Staging DB    │    │ • Production DB │
│ • Dev OAuth     │    │ • Test Data     │    │ • Live Data     │
│ • Debug Mode    │    │ • QA Testing    │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └─────────── Git Flow ──────────────────────────┘
```

## Deployment Environments

### Environment Configuration
| Environment | Branch | Domain | Supabase Project | Purpose |
|-------------|--------|---------|-----------------|---------|
| **Development** | `development` | localhost:5173 | dev-edmeca | Feature development |
| **Staging** | `staging` | staging.edmeca.com | staging-edmeca | QA and testing |
| **Production** | `main` | edmeca.com | prod-edmeca | Live application |

## Prerequisites

### Required Accounts
- ✅ **Netlify Account** - For hosting and functions
- ✅ **Supabase Account** - For database and auth
- ✅ **GitHub Actions** - For CI/CD pipeline
- ✅ **Domain Provider** - For custom domains
- ✅ **Google/GitHub OAuth** - For authentication

### Local Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install Supabase CLI  
npm install -g supabase

# Login to services
netlify login
supabase login
```

## Production Deployment

### 1. Supabase Production Setup

#### Create Production Project
```bash
# Create new Supabase project
supabase projects create edmeca-production --region us-east-1

# Link local project
supabase link --project-ref your-production-ref

# Apply database migrations
supabase db push

# Set up authentication
supabase gen types typescript --project-id your-production-ref > shared/supabase.ts
```

#### Configure Production Database
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);
```

#### Set Up Authentication
In Supabase Dashboard → Authentication → Settings:
```bash
# Site URL
https://edmeca.com

# Redirect URLs  
https://edmeca.com/**
https://edmeca.com/auth/callback

# JWT Settings
JWT_EXPIRY: 3600
REFRESH_TOKEN_ROTATION: true
```

### 2. Netlify Production Setup

#### Create Site
```bash
# Create new Netlify site
netlify sites:create --name edmeca-production

# Link repository
git remote add origin https://github.com/your-username/edmeca-website.git
```

#### Build Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "client/dist"
  functions = "server"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--legacy-peer-deps"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  command = "npm run build:prod"
  
[context.staging]
  command = "npm run build:staging"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### Environment Variables
Set in Netlify Dashboard → Site Settings → Environment Variables:
```bash
# Supabase Production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key

# OAuth Production  
VITE_GOOGLE_CLIENT_ID=your-prod-google-client-id
GOOGLE_CLIENT_SECRET=your-prod-google-secret
VITE_GITHUB_CLIENT_ID=your-prod-github-client-id  
GITHUB_CLIENT_SECRET=your-prod-github-secret

# App Configuration
VITE_APP_URL=https://edmeca.com
VITE_APP_NAME="EDMECA Digital Academy"
VITE_CONTACT_EMAIL=info@edmeca.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_MAINTENANCE_MODE=false

# Security
JWT_SECRET=your-super-secure-jwt-secret-256-bit
```

### 3. Domain Configuration

#### Custom Domain Setup
```bash
# Add custom domain in Netlify
netlify domains:add edmeca.com

# Configure DNS records
# A record: @ → Netlify IP (104.198.14.52)
# CNAME: www → edmeca.netlify.app
```

#### SSL Certificate
```bash
# Enable SSL in Netlify Dashboard
# Automatic Let's Encrypt certificate
# Force HTTPS redirect enabled
```

### 4. OAuth Provider Setup

#### Google OAuth Production
1. **Google Cloud Console** → **Credentials**
2. **Create OAuth 2.0 Client ID**
3. **Authorized domains**: `edmeca.com`
4. **Authorized redirect URIs**: 
   - `https://edmeca.com/auth/callback`
   - `https://your-prod-project.supabase.co/auth/v1/callback`

#### GitHub OAuth Production  
1. **GitHub Settings** → **Developer settings** → **OAuth Apps**
2. **Create New OAuth App**
3. **Homepage URL**: `https://edmeca.com`
4. **Authorization callback**: `https://your-prod-project.supabase.co/auth/v1/callback`

## Staging Deployment

### 1. Create Staging Environment
```bash
# Create staging site
netlify sites:create --name edmeca-staging

# Configure staging branch deployment
netlify deploy --prod --dir=client/dist
```

### 2. Staging Configuration
Environment variables for staging:
```bash
# Supabase Staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# App Configuration  
VITE_APP_URL=https://staging.edmeca.com
VITE_ENABLE_ANALYTICS=false
VITE_MAINTENANCE_MODE=false

# OAuth Staging Apps (separate from production)
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id
VITE_GITHUB_CLIENT_ID=your-staging-github-client-id
```

## CI/CD Pipeline

### GitHub Actions Setup
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Netlify

on:
  push:
    branches: 
      - main
      - staging
  pull_request:
    branches: 
      - main
      - staging

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=client/dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Deployment Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:staging": "NODE_ENV=staging npm run build",
    "build:prod": "NODE_ENV=production npm run build",
    "deploy:staging": "netlify deploy --dir=client/dist --site=staging-site-id",
    "deploy:prod": "netlify deploy --prod --dir=client/dist --site=prod-site-id",
    "deploy:preview": "netlify deploy --dir=client/dist"
  }
}
```

## Database Migrations

### Production Migration Process
```bash
# 1. Create migration locally
supabase migration new add_new_feature

# 2. Test migration on staging
supabase db push --project-ref staging-project-ref

# 3. Verify staging works correctly
npm run test:staging

# 4. Apply to production (during maintenance window)
supabase db push --project-ref production-project-ref

# 5. Verify production deployment
npm run test:prod
```

### Migration Best Practices
- ✅ **Test all migrations on staging first**
- ✅ **Use migration scripts, not manual changes**
- ✅ **Backup database before major migrations**
- ✅ **Plan rollback strategy**
- ✅ **Schedule during low-traffic windows**

## Deployment Workflow

### Feature Development
```bash
# 1. Create feature branch
git checkout development
git pull origin development
git checkout -b feature/new-feature

# 2. Develop and test locally
npm run dev
# Make changes, test functionality

# 3. Submit PR to staging
git push origin feature/new-feature
# Create PR: feature/new-feature → staging

# 4. Deploy to staging for QA
git checkout staging
git merge feature/new-feature
git push origin staging

# 5. Production deployment
git checkout main
git merge staging
git push origin main
```

### Hotfix Deployment
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Apply fix and test
# Make minimal changes to fix issue
npm run test

# 3. Deploy to staging for verification
git checkout staging
git merge hotfix/critical-issue
git push origin staging

# 4. Deploy to production
git checkout main  
git merge hotfix/critical-issue
git push origin main

# 5. Merge back to development
git checkout development
git merge hotfix/critical-issue
git push origin development
```

## Monitoring & Observability

### Performance Monitoring
```bash
# Netlify Analytics
VITE_NETLIFY_ANALYTICS=true

# Google Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Core Web Vitals monitoring
VITE_ENABLE_WEB_VITALS=true
```

### Error Monitoring
```bash
# Sentry Integration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token

# Supabase Logs  
# Available in Supabase Dashboard → Logs
```

### Health Checks
Create monitoring endpoints:
```typescript
// server/health.ts - Netlify function
export const handler = async (event, context) => {
  try {
    // Check database connectivity  
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) throw error;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
```

## Security Configuration

### Content Security Policy
Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co;
    '''
```

### Environment Security
- ✅ **Secrets in environment variables only**
- ✅ **Different keys per environment**
- ✅ **Service account minimum permissions** 
- ✅ **Regular credential rotation**
- ✅ **Access logging enabled**

## Rollback Procedures

### Quick Rollback (Netlify)
```bash
# Via Netlify CLI
netlify rollback

# Via Dashboard
# Netlify Dashboard → Deploys → Previous deploy → Restore
```

### Database Rollback
```bash
# Restore from backup
supabase db restore --project-ref your-project-ref backup-file.sql

# Or apply reverse migration
supabase migration new reverse_feature
# Edit migration file with reverse changes
supabase db push
```

### Rollback Checklist
- [ ] Identify rollback trigger (errors, performance, etc.)
- [ ] Notify team of rollback decision
- [ ] Execute rollback procedure  
- [ ] Verify application functionality
- [ ] Update monitoring/alerts
- [ ] Document rollback reason and resolution

## Troubleshooting

### Common Deployment Issues

**Build Failures**
```bash
# Check environment variables
netlify env:list

# Review build logs
netlify logs:function your-function-name

# Test build locally
npm run build
```

**Function Errors**
```bash
# View function logs
netlify functions:invoke your-function --logs

# Test function locally
netlify dev
```

**Database Connection Issues**
- Verify Supabase URL and keys
- Check RLS policies  
- Ensure project isn't paused
- Review connection limits

**OAuth Issues**
- Verify redirect URLs match exactly
- Check OAuth app configuration
- Ensure client IDs are correct per environment

### Performance Issues
```bash
# Audit bundle size
npm run build
npm run analyze

# Check Core Web Vitals
# Use Lighthouse in Chrome DevTools
# Review Netlify Analytics

# Database performance
# Check slow query logs in Supabase
```

## Maintenance

### Regular Tasks
- [ ] **Weekly**: Review error logs and performance metrics
- [ ] **Monthly**: Update dependencies and security patches  
- [ ] **Quarterly**: Rotate authentication keys and secrets
- [ ] **Annually**: Review and update deployment procedures

### Scheduled Maintenance
- **Dependency Updates**: First Saturday of each month
- **Security Patches**: As needed (high priority)
- **Environment Refresh**: Quarterly staging environment reset
- **Performance Review**: Monthly optimization analysis

---

**Next Steps**: After successful deployment, see monitoring setup in [MONITORING.md](MONITORING.md) and maintenance procedures in [MAINTENANCE.md](MAINTENANCE.md).