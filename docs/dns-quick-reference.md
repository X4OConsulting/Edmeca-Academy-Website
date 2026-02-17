# DNS Configuration for edmeca.co.za
## Quick Reference Guide

---

## STEP 1: Deploy to Netlify First

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import existing project" → Connect GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `client/dist`
4. Add environment variables (see main guide)
5. Deploy and note your Netlify URL

---

## STEP 2: Add Custom Domain in Netlify

1. Site settings → Domain management → Add custom domain
2. Enter: `edmeca.co.za`
3. **COPY THE DNS VALUES NETLIFY PROVIDES** (you'll need these for your registrar)

---

## STEP 3: Update DNS at Your Registrar

### ⚠️ CRITICAL: PRESERVE GOOGLE MAIL RECORDS

**DO NOT DELETE THESE RECORDS:**

```dns
# Google Workspace MX Records (Email - MUST KEEP)
MX    @    ASPMX.L.GOOGLE.COM                [Priority 1]
MX    @    ALT1.ASPMX.L.GOOGLE.COM           [Priority 5]
MX    @    ALT2.ASPMX.L.GOOGLE.COM           [Priority 5]
MX    @    ALT3.ASPMX.L.GOOGLE.COM           [Priority 10]
MX    @    ALT4.ASPMX.L.GOOGLE.COM           [Priority 10]

# Google Email Authentication (MUST KEEP)
TXT   @                 v=spf1 include:_spf.google.com ~all
TXT   google._domainkey [Your DKIM key - check Google Admin]
TXT   _dmarc            v=DMARC1; p=none; rua=mailto:postmaster@edmeca.co.za
```

---

### UPDATE THESE RECORDS (Website Hosting)

**DELETE:**
- Old Replit A records
- Old Replit CNAME records

**ADD:**

```dns
# Netlify Website Hosting
A      @      [IP FROM NETLIFY DASHBOARD]
CNAME  www    [your-site-name].netlify.app
```

---

## STEP 4: Verify Configuration

### Check DNS Propagation
Visit: https://dnschecker.org  
Search: `edmeca.co.za`  
Verify: A record shows Netlify IP (worldwide)

### Test Website
- https://edmeca.co.za → Should load your site
- https://www.edmeca.co.za → Should redirect/load
- Check for HTTPS green padlock

### Test Email (CRITICAL)
- Send email TO: your@edmeca.co.za
- Send email FROM: your@edmeca.co.za
- Both should work normally

---

## Full DNS Table Template

Copy this and fill in the bracketed values from Netlify:

| Record Type | Host/Name         | Value/Points To                  | Priority | TTL  |
|-------------|-------------------|----------------------------------|----------|------|
| A           | @                 | **[NETLIFY IP]**                | -        | 3600 |
| CNAME       | www               | **[your-site].netlify.app**     | -        | 3600 |
| MX          | @                 | ASPMX.L.GOOGLE.COM              | 1        | 3600 |
| MX          | @                 | ALT1.ASPMX.L.GOOGLE.COM         | 5        | 3600 |
| MX          | @                 | ALT2.ASPMX.L.GOOGLE.COM         | 5        | 3600 |
| MX          | @                 | ALT3.ASPMX.L.GOOGLE.COM         | 10       | 3600 |
| MX          | @                 | ALT4.ASPMX.L.GOOGLE.COM         | 10       | 3600 |
| TXT         | @                 | v=spf1 include:_spf.google.com ~all | -     | 3600 |
| TXT         | google._domainkey | **[YOUR GOOGLE DKIM KEY]**      | -        | 3600 |
| TXT         | _dmarc            | v=DMARC1; p=none; rua=mailto:postmaster@edmeca.co.za | - | 3600 |

---

## Common Registrar DNS Management URLs

- **Namecheap:** https://ap.www.namecheap.com/domains/list/
- **GoDaddy:** https://dcc.godaddy.com/domains
- **Google Domains:** https://domains.google.com/registrar
- **Cloudflare:** https://dash.cloudflare.com
- **Register.co.za:** https://www.register.co.za/login

---

## Timeline

- **Netlify Deployment:** 5-10 minutes
- **DNS Update:** 2 minutes (at registrar)
- **DNS Propagation:** 15 minutes - 24 hours (usually 1-2 hours)
- **SSL Certificate:** Automatic after DNS propagation
- **Total Migration Time:** 2-4 hours typically

---

## Emergency Contacts

| Service          | Issue                    | Contact                              |
|------------------|--------------------------|--------------------------------------|
| Netlify          | Deployment/hosting       | https://answers.netlify.com          |
| Google Workspace | Email problems           | https://support.google.com/a         |
| Your Registrar   | DNS/domain issues        | Check registrar's support page       |
| Supabase         | Database connectivity    | https://supabase.com/support         |

---

## Quick Verification Commands

```bash
# Check DNS A record
nslookup edmeca.co.za

# Check MX records (email)
nslookup -type=MX edmeca.co.za

# Check TXT records (SPF, DKIM)
nslookup -type=TXT edmeca.co.za

# Test HTTPS certificate
curl -I https://edmeca.co.za
```

---

## Rollback (Emergency Only)

If something goes wrong:

1. **Revert DNS A record** back to old Replit IP
2. **Email should NOT be affected** (MX records unchanged)
3. **Wait 15-30 minutes** for DNS cache to clear
4. **Debug Netlify issues** before re-attempting

---

**Status:** Ready to migrate  
**Estimated Downtime:** 0 minutes (DNS switches over)  
**Risk Level:** Low (email records preserved separately)  
**Rollback Time:** 15-30 minutes if needed
