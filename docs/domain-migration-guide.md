# Domain Migration Guide: edmeca.co.za
## Replit → Netlify Migration

**Date:** February 17, 2026  
**Domain:** edmeca.co.za  
**Current Hosting:** Replit  
**New Hosting:** Netlify  
**Email Provider:** Google Workspace (Preserve existing configuration)

---

## Phase 1: Deploy to Netlify

### 1.1 Create Netlify Account & Connect Repository

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize Netlify
4. Choose repository: `edmeca-website`
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
   - **Node version:** 18

### 1.2 Set Environment Variables in Netlify

Go to **Site settings** → **Environment variables** and add:

```bash
VITE_SUPABASE_URL=[Get from .env.local - do NOT commit this]
VITE_SUPABASE_ANON_KEY=[Get from .env.local - do NOT commit this]
SUPABASE_SERVICE_ROLE_KEY=[Get from .env.local - do NOT commit this]
```

### 1.3 Deploy Site

1. Click **"Deploy site"**
2. Wait for initial build to complete (2-5 minutes)
3. Note your Netlify URL: `https://[random-name].netlify.app`
4. Test the site to ensure it works correctly

---

## Phase 2: Configure Custom Domain in Netlify

### 2.1 Add Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `edmeca.co.za`
4. Click **"Verify"**
5. Netlify will show DNS configuration needed

### 2.2 Note Netlify DNS Information

Netlify will provide one of these configurations:

**Option A: A Record** (if available)
- Type: A
- Host: @
- Value: [Netlify Load Balancer IP]

**Option B: CNAME** (most common)
- Primary domain requires DNS provider support for ALIAS/ANAME records
- www subdomain uses CNAME

You'll see something like:
- **A Record:** `75.2.60.5` (example - use your actual value)
- **CNAME for www:** `[your-site].netlify.app`

### 2.3 Enable Netlify DNS Features

1. Enable **"HTTPS"** (auto SSL certificate via Let's Encrypt)
2. Enable **"Automatic TLS certificates"**
3. Set **"Primary domain"** preference (www vs non-www)

---

## Phase 3: Update DNS Records at Registrar

### 3.1 Current Google Mail Records (DO NOT DELETE)

Your registrar should have these existing records for Google Workspace:

#### MX Records (Email routing - CRITICAL)
```
Priority  Host  Value
1         @     ASPMX.L.GOOGLE.COM
5         @     ALT1.ASPMX.L.GOOGLE.COM
5         @     ALT2.ASPMX.L.GOOGLE.COM
10        @     ALT3.ASPMX.L.GOOGLE.COM
10        @     ALT4.ASPMX.L.GOOGLE.COM
```

#### SPF Record (Email authentication)
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com ~all
```

#### DKIM Record (Email signing)
```
Type: TXT
Host: google._domainkey
Value: [Your Google DKIM key - check Google Admin console]
```

#### DMARC Record (Email policy)
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@edmeca.co.za
```

**⚠️ IMPORTANT: Keep ALL these records unchanged!**

---

### 3.2 DNS Records to UPDATE/ADD for Netlify

Log into your domain registrar's DNS management panel and make these changes:

#### Delete Old Replit Records
Find and delete:
- Any A records pointing to Replit IP addresses
- Any CNAME records pointing to Replit

#### Add Netlify Records

**Primary Domain (edmeca.co.za):**

```
Type: A
Host: @
Value: [Netlify IP - from Netlify dashboard]
TTL: 3600
```

**WWW Subdomain:**

```
Type: CNAME
Host: www
Value: [your-site].netlify.app
TTL: 3600
```

**Optional: Netlify DNS Verification (if required):**

```
Type: TXT
Host: @
Value: [Netlify verification token]
TTL: 3600
```

---

### 3.3 Complete DNS Configuration Example

Your final DNS configuration should look like this:

| Type  | Host              | Value                           | Priority | TTL  |
|-------|-------------------|---------------------------------|----------|------|
| A     | @                 | [Netlify IP]                   | -        | 3600 |
| CNAME | www               | [your-site].netlify.app        | -        | 3600 |
| MX    | @                 | ASPMX.L.GOOGLE.COM             | 1        | 3600 |
| MX    | @                 | ALT1.ASPMX.L.GOOGLE.COM        | 5        | 3600 |
| MX    | @                 | ALT2.ASPMX.L.GOOGLE.COM        | 5        | 3600 |
| MX    | @                 | ALT3.ASPMX.L.GOOGLE.COM        | 10       | 3600 |
| MX    | @                 | ALT4.ASPMX.L.GOOGLE.COM        | 10       | 3600 |
| TXT   | @                 | v=spf1 include:_spf.google.com ~all | -    | 3600 |
| TXT   | google._domainkey | [Your DKIM key]                 | -        | 3600 |
| TXT   | _dmarc            | v=DMARC1; p=none; rua=mailto:postmaster@edmeca.co.za | - | 3600 |

---

## Phase 4: Verification & Testing

### 4.1 DNS Propagation

1. **Wait for DNS propagation:** 1-24 hours (usually 1-2 hours)
2. **Check DNS propagation:**
   - Visit: https://dnschecker.org
   - Enter: `edmeca.co.za`
   - Verify A record points to Netlify IP

### 4.2 Test Website

1. Visit `https://edmeca.co.za` (may take time for DNS)
2. Visit `https://www.edmeca.co.za`
3. Verify HTTPS certificate is active (green padlock)
4. Test all pages and functionality

### 4.3 Verify Email Still Works

**CRITICAL: Test email BEFORE disabling Replit**

1. Send test email TO: `[youremail]@edmeca.co.za`
2. Send test email FROM: `[youremail]@edmeca.co.za`
3. Check Google Admin console for email delivery logs

### 4.4 Monitor for Issues

- Check Netlify deployment logs for errors
- Monitor website with Netlify Analytics
- Check email delivery for 48 hours

---

## Phase 5: Cleanup

### 5.1 After Successful Migration (Wait 48-72 hours)

1. **Verify all functionality:**
   - Website loads correctly
   - All pages accessible
   - Forms work
   - Email sending/receiving works
   - SSL certificate active

2. **Disable Replit:**
   - Archive Replit project
   - Keep backup for 30 days

3. **Update documentation:**
   - Update README.md with Netlify deployment info
   - Document any issues encountered
   - Update team on new deployment process

---

## Rollback Plan (If Issues Occur)

### Emergency Rollback to Replit

1. **Immediately revert DNS:**
   - Log into registrar
   - Point A record back to Replit IP
   - Wait 15-30 minutes for DNS cache

2. **Email should NOT be affected:**
   - MX records remain unchanged
   - Email continues working

3. **Debug Netlify issues:**
   - Check build logs
   - Verify environment variables
   - Test locally first
   - Re-attempt migration when fixed

---

## Common Issues & Solutions

### Issue: "Domain already registered on Netlify"
**Solution:** Domain may be claimed by another account. Contact Netlify support.

### Issue: SSL certificate not provisioning
**Solution:**
1. Verify DNS points to Netlify (wait 2-4 hours)
2. Go to Domain settings → HTTPS → Renew certificate
3. Ensure CNAME verification record exists

### Issue: Email stops working
**Solution:**
1. **Immediately verify MX records** in DNS
2. MX records should point to Google, NOT Netlify
3. Check TTL hasn't been changed
4. Contact registrar if MX records are missing

### Issue: Site shows "Deploy failed"
**Solution:**
1. Check Netlify build logs
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check Node version matches (18)

---

## Support Contacts

- **Netlify Support:** https://answers.netlify.com
- **Google Workspace Support:** https://support.google.com/a
- **Domain Registrar:** [Your registrar support URL]
- **Supabase Support:** https://supabase.com/support

---

## Checklist

### Pre-Migration
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Test site working on Netlify URL

### DNS Migration
- [ ] Netlify custom domain added
- [ ] Netlify DNS values noted (A record, CNAME)
- [ ] Current Google Mail records documented
- [ ] DNS records updated at registrar
- [ ] Verification TXT record added (if required)

### Post-Migration
- [ ] DNS propagation complete (dnschecker.org)
- [ ] Website accessible at edmeca.co.za
- [ ] HTTPS working (green padlock)
- [ ] All pages loading correctly
- [ ] Email sending works
- [ ] Email receiving works
- [ ] Forms submitting correctly

### Cleanup
- [ ] Monitored for 48-72 hours
- [ ] No issues reported
- [ ] Replit project archived
- [ ] Documentation updated
- [ ] Team notified of new deployment URL

---

**Last Updated:** February 17, 2026  
**Migration Status:** Ready to begin  
**Estimated Time:** 2-4 hours (+ DNS propagation time)
