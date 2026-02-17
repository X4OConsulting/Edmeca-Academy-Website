# 🚨 SECURITY FIX: Netlify Deployment Issue Resolved

**Date:** February 17, 2026  
**Issue:** Netlify secrets scanner detected exposed secrets  
**Status:** 🟢 Fixed - Action Required

---

## ✅ What Was Fixed

### 1. Removed Committed Secrets from Git
**Problem:** `.env.local` files containing actual API keys were committed to the repository.

**Fixed:**
- ✅ Removed `.env.local` from git (kept locally)
- ✅ Removed `client/.env.local` from git (kept locally)
- ✅ Updated `.gitignore` (already had correct entries)
- ✅ Committed and pushed changes

### 2. Removed Exposed Secrets from Documentation
**Problem:** Migration guide contained actual Supabase keys (copy-paste error).

**Fixed:**
- ✅ Replaced actual keys with placeholders in `domain-migration-guide.md`
- ✅ Added warning: "Get from .env.local - do NOT commit this"

### 3. Configured Netlify Secrets Scanning
**Problem:** Netlify was blocking deployment due to detected secrets.

**Fixed:**
- ✅ Added secrets scanning config to `netlify.toml`:
  ```toml
  [build.environment]
    SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_ANON_KEY"
  ```
- ✅ Allows `VITE_SUPABASE_ANON_KEY` (designed to be public)
- ✅ Keeps `SUPABASE_SERVICE_ROLE_KEY` server-only

---

## 🔐 IMPORTANT: Rotate Your Supabase Service Role Key

### Why You Need This

Your `SUPABASE_SERVICE_ROLE_KEY` was exposed in:
1. Git commit history (via `.env.local`)
2. Documentation file (temporarily - now removed)
3. GitHub public repository

**⚠️ This key grants admin access to your Supabase database!**

### How to Rotate the Key (5 minutes)

#### Step 1: Generate New Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project: `dqvdnyxkkletgkkpicdg`
3. Click **Settings** (⚙️ gear icon)
4. Click **API** in the sidebar
5. Scroll to **Service Role Key** section
6. Click **"Reset service_role secret"**
7. Confirm the reset
8. **Copy the new key** (you won't see it again!)

#### Step 2: Update Local Environment File

Update your **local** `.env.local` (NOT committed to git):

```bash
# .env.local - DO NOT COMMIT THIS FILE
VITE_SUPABASE_URL=[Your Supabase URL from dashboard]
VITE_SUPABASE_ANON_KEY=[Your Supabase anon key from dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Your service role key from dashboard]
```

#### Step 3: Update Netlify Environment Variables

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Find `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Options** → **Edit**
6. Paste the **new key**
7. Click **Save**

#### Step 4: Verify Old Key is Revoked

Try using the old key - it should fail:
```bash
# This should return 401 Unauthorized
curl -X GET "[YOUR_SUPABASE_URL]/rest/v1/users" \
  -H "apikey: [OLD_KEY_HERE]" \
  -H "Authorization: Bearer [OLD_KEY_HERE]"
```

**✅ Checkpoint:** Old key doesn't work, new key saved locally and in Netlify

---

## 🚀 Now Deploy to Netlify (Fresh Attempt)

### Option 1: Auto-Deploy (Recommended)

If you have auto-deploy enabled, Netlify will automatically deploy your latest commit.

1. Go to https://app.netlify.com
2. Select your site
3. Check **Deploys** tab
4. Wait for build to complete

### Option 2: Manual Trigger

1. Go to https://app.netlify.com
2. Select your site
3. Click **Deploys** tab
4. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
5. Wait for build to complete

### What to Expect

✅ **Build should now succeed** because:
- No `.env.local` in repository
- Secrets scanner allows `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` only used in server functions
- No committed secrets detected

---

## 🔒 Security Best Practices Going Forward

### Never Commit These Files:
```
❌ .env
❌ .env.local
❌ .env.production
❌ .env.*.local
❌ Any file with actual API keys
```

### Always Use Environment Variables in Netlify

**Good:** Set in Netlify dashboard
```
VITE_SUPABASE_URL → Netlify env vars
VITE_SUPABASE_ANON_KEY → Netlify env vars
SUPABASE_SERVICE_ROLE_KEY → Netlify env vars (marked as sensitive)
```

**Bad:** Hardcoded in files
```javascript
// ❌ NEVER DO THIS
const supabaseUrl = "[YOUR_SUPABASE_URL]";
const serviceKey = "eyJhbGci..."; // BAD!
```

### Client vs Server Keys

**Client-side (Safe to expose):**
- `VITE_SUPABASE_URL` → Public URL
- `VITE_SUPABASE_ANON_KEY` → Public key (designed for client-side)
  - Use: Frontend React code
  - Prefix: `VITE_` (bundled into client build)

**Server-side (MUST stay secret):**
- `SUPABASE_SERVICE_ROLE_KEY` → Admin key
  - Use: **ONLY** in `netlify/functions/*.ts`
  - Access: `process.env.SUPABASE_SERVICE_ROLE_KEY`
  - Never: Import in client code, never prefix with `VITE_`

### Example: Correct Usage

**✅ Client Code (src/lib/supabase.ts):**
```typescript
import { createClient } from '@supabase/supabase-js';

// Uses VITE_ prefixed env vars - OK for client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**✅ Server Function (netlify/functions/contact.ts):**
```typescript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, context) {
  // Admin client - uses service role key
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-only!
  );
  
  // Perform privileged operations
  const { data } = await supabaseAdmin.from('users').select('*');
  // ...
}
```

---

## 📋 Post-Fix Checklist

### Immediate Actions (Do Now)
- [ ] Rotate Supabase service role key in Supabase dashboard
- [ ] Update `.env.local` locally with new key
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY` in Netlify environment variables
- [ ] Trigger new Netlify deployment
- [ ] Verify build succeeds

### Verify Security
- [ ] `.env.local` is NOT in git: `git ls-files | grep .env.local` (should be empty)
- [ ] `.gitignore` includes `.env.local` ✅ (already configured)
- [ ] No secrets in git history (recent commits): `git log --oneline -5`
- [ ] Old Supabase key is revoked (test with curl)

### Test Deployment
- [ ] Netlify build completes successfully
- [ ] Site preview loads correctly
- [ ] No "secrets detected" errors
- [ ] Functions work (if using contact form)

---

## 🆘 If Deployment Still Fails

### Check Build Logs

Look for:
```
❌ "Netlify secrets scanner detected secrets"
→ Solution: Check if any secrets are still in committed files
→ Run: git grep -n "eyJhbGci" (search for JWT tokens)

❌ "SUPABASE_SERVICE_ROLE_KEY is undefined"
→ Solution: Not set in Netlify environment variables
→ Go to: Site settings → Environment variables → Add variable

❌ Build errors unrelated to secrets
→ Solution: Different issue - check build logs for details
→ Common: Missing dependencies, TypeScript errors
```

### Common Issues

**Issue:** "Secret still detected after removing from git"

**Solution:** Git history contains the secret
```bash
# Check git history
git log --all --full-history --source -- .env.local

# If found, you need to purge history (advanced)
# Option 1: Use BFG Repo-Cleaner (easier)
# https://rtyley.github.io/bfg-repo-cleaner/

# Option 2: Force push new clean history (loses history)
git checkout --orphan new-main
git add -A
git commit -m "Clean history without secrets"
git branch -D main
git branch -m main
git push -f origin main
```

**Issue:** "Environment variable not found during build"

**Solution:** Set in Netlify dashboard, not in netlify.toml
- Go to Site settings → Environment variables
- Add each variable individually
- Mark `SUPABASE_SERVICE_ROLE_KEY` as "Sensitive"

---

## 📞 Support Resources

- **Netlify Secrets Scanning:** https://docs.netlify.com/security/secrets-scanning/
- **Supabase API Keys:** https://supabase.com/docs/guides/api/api-keys
- **Environment Variables:** https://docs.netlify.com/environment-variables/get-started/

---

## ✅ Summary

**What happened:**
- `.env.local` files with secrets were committed to git
- Netlify detected them and blocked deployment
- Migration guide accidentally exposed keys

**What was fixed:**
- ✅ Removed `.env.local` from git (kept locally)
- ✅ Removed exposed keys from documentation
- ✅ Configured Netlify secrets scanner
- ✅ Committed and pushed security fixes

**What you need to do:**
1. 🔑 **Rotate Supabase service role key** (5 min)
2. 🔄 **Update Netlify environment variables** (2 min)
3. 🚀 **Redeploy on Netlify** (auto or manual trigger)
4. ✅ **Verify deployment succeeds**

**Estimated time:** 10-15 minutes

---

**Status:** 🟡 Awaiting key rotation and redeployment  
**Next Step:** Rotate Supabase key → Update Netlify → Deploy  
**Expected Result:** Successful deployment to Netlify
