# NETLIFY SUPPORT REQUEST - CDN Cache Issue

**Date:** February 17, 2026  
**Site:** edmecaacademy.netlify.app  
**Custom Domain:** edmeca.co.za  
**Status:** ✅ **RESOLVED**

---

## RESOLUTION SUMMARY

**Issue:** Custom domain returning 404 errors after migration from Replit to Netlify  
**Root Cause:** Old Replit domain verification TXT records blocking Netlify SSL provisioning  
**Solution:** Removed Replit TXT records from DNS, reset domain in Netlify, triggered fresh deploy  
**Result:** ✅ Site fully operational on https://edmeca.co.za across all browsers

---

## PROBLEM DESCRIPTION (HISTORICAL)

**UPDATE:** Root cause identified - old Replit TXT records blocking SSL verification.

### Current Behavior:
- ✅ **Netlify URL** (`edmecaacademy.netlify.app`): Works perfectly on ALL browsers
- ❌ **Custom domain** (`edmeca.co.za`): Returns HTTP 404 on ALL browsers
- ❌ **All pages:** 404 (/, /about, /contact, etc.)

### Root Cause Found:
Deploy logs show: **"0 new file(s) to upload"** despite successful build. This indicates:
1. Files are deployed to Netlify's storage
2. Netlify URL correctly serves these files
3. Custom domain routing not updated to point to current deploy
4. Custom domain still points to non-existent or old deploy (404)

This is a **Netlify internal routing issue**, not CDN caching or DNS.

---

## WHAT WE'VE TRIED

1. ✅ Cleared browser caches completely
2. ✅ Tested in incognito/private mode
3. ✅ Rebuilt site multiple times
4. ✅ Cleared build cache
5. ✅ Unlinked and relinked GitHub repository
6. ✅ Verified DNS configuration (correct: A record → 75.2.60.5)
7. ✅ Confirmed primary domain set correctly
8. ✅ Automated tests confirm issue is persistent

---

## DEPLOYMENT DETAILS

- **Repository:** X4OConsulting/Edmeca-Academy-Website
- **Branch:** clean-deploy
- **Latest Deploy:** [Check Netlify dashboard for deploy ID]
- **Build Status:** ✅ Successful (HTTP 200 on Netlify URL)
- **DNS:** Verified pointing to Netlify (75.2.60.5)
- **Custom Domain:** edmeca.co.za (Primary domain)

---

## ACTIONS TAKEN

### ✅ Completed Troubleshooting:
1. ✅ Created CDN purge function (`netlify/functions/purge-cdn.ts`)
2. ✅ Triggered purge - no effect (confirmed not a cache issue)
3. ✅ Verified DNS configuration (correct: A → 75.2.60.5, CNAME → netlify.app)
4. ✅ Verified production branch setting (correct: `clean-deploy`)
5. ✅ Verified domain added and set as primary
6. ✅ Triggered fresh production deploy
7. ✅ Analyzed deploy logs - found root cause

### 🔍 Deploy Log Analysis (Latest Deploy):
```
Starting to deploy site from 'client/dist'
Calculating files to upload
0 new file(s) to upload        ← ISSUE: Files not re-associated with domain
0 new function(s) to upload
Site deploy was successfully initiated
Site is live ✨                ← Live on Netlify URL only
```

### ✅ Forms Successfully Configured:
```
Post processing - Forms
Processing form - contact       ← Netlify Forms now working!
DetRECOMMENDED SOLUTION

**Self-Service Fix (Try First):**
1. Domain management → Remove `edmeca.co.za`
2. Wait 2 minutes for state to clear
3. Add custom domain → `edmeca.co.za`
4. Set as primary domain
5. Wait for SSL provisioning (1-2 minutes)
6. Test site

**If self-service fails, Netlify Support needed to:**
- Manually reset domain-to-deploy association
- Investigate why "0 new files" doesn't trigger domain update
- Force re-deployment of files to custom domain path

---

## URGENCY

**High** - Site is live on Netlify URL but completely inaccessible on custom domain (100% of users affected on edmeca.co.za)

**Impact:** 
- ✅ Netlify Forms now working
- ❌ Custom domain completely broken (404)
- ✅ Build/deploy successful
- ❌ Domain routing not connected to deploy
## URGENCY

**High** - Site is live but inaccessible to 40%+ of users (Firefox, Safari browsers)

**Update:** Implementing Netlify agent's recommended purge solution before escalating to manual support intervention.

---

## CONTACT

- **Name:** [Your Name]
- **Email:** [Your Email]
- **Best Time to Contact:** [Your timezone/hours]

---

## VERIFICATION

After CDN purge, we will run automated cross-browser tests (provided below) to confirm all browsers return HTTP 200.

**Test command:**
```bash
node tests/cross-browser-test.js
```

Expected result: All 3 browsers (Chromium, Firefox, WebKit) should pass.

---

## ✅ RESOLUTION STEPS TAKEN (February 17, 2026)

### Step 1: Identified Root Cause
- Discovered old Replit verification TXT records in DNS:
  - `replit-verify=56b5e930-6fb4-44a4-be6e-b5513a7c035d`
  - `replit-verify=ce24d31a-9e26-467e-adf5-5d075d82371e`
- These records prevented Netlify from verifying domain ownership for SSL

### Step 2: DNS Cleanup
- Removed both Replit TXT records from IT-Guru Online DNS
- Kept essential records: Google verification, SPF, MX
- Waited 90 seconds for DNS propagation
- Verified propagation across all major DNS servers (Google, Cloudflare, Quad9, OpenDNS)

### Step 3: Domain Reset in Netlify
- Removed `edmeca.co.za` and `www.edmeca.co.za` from Netlify
- Waited 2 minutes for state to clear
- Re-added `edmeca.co.za` as custom domain
- Set as primary domain
- SSL certificate provisioned successfully

### Step 4: Fresh Deployment
- Triggered deploy to associate domain with site files
- Deploy completed successfully (commit: dfa64d6)

### Step 5: Verification
- Cross-browser tests: ✅ ALL PASSED (Chromium, Firefox, WebKit)
- All pages loading: ✅ 6/6 pages (Home, About, Solutions, Frameworks, Engagement, Contact)
- SSL certificate: ✅ HTTPS secured
- Forms: ✅ Detected by Netlify
- Performance: ✅ All browsers HTTP 200

### Final Status
✅ Migration complete - site fully operational at https://edmeca.co.za

---

**Lessons Learned:**
- Always remove old domain verification records when migrating hosting providers
- DNS propagation can take 5-15 minutes even with low TTLs
- Netlify requires clean domain ownership verification for SSL provisioning
- Testing across multiple DNS servers helps confirm propagation status

---

Thank you for your assistance!
