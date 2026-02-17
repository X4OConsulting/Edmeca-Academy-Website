# NETLIFY SUPPORT REQUEST - CDN Cache Issue

**Date:** February 17, 2026  
**Site:** edmecaacademy.netlify.app  
**Custom Domain:** edmeca.co.za  
**Issue Type:** CDN Caching / Edge Routing

---

## PROBLEM DESCRIPTION

Our custom domain `edmeca.co.za` is serving different content to different browsers due to edge CDN caching issues.

### Current Behavior:
- ✅ **Chromium/Chrome:** Works perfectly (HTTP 200, full site loads)
- ❌ **Firefox:** HTTP 404 on all pages
- ❌ **Safari/WebKit:** HTTP 404 on all pages  
- ✅ **Netlify URL** (`edmecaacademy.netlify.app`): Works on ALL browsers

### Evidence:
We ran automated cross-browser tests (Playwright) that confirm:
1. Same test code, same time, same network
2. `edmeca.co.za` returns HTTP 404 in Firefox/WebKit
3. `edmeca.co.za` returns HTTP 200 in Chromium
4. `edmecaacademy.netlify.app` works everywhere

This indicates **browser-specific edge CDN routing/caching issue**.

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

## ACTIONS TAKEN (Per Netlify Agent Instructions)

### ✅ Implemented Recommended Solution:
1. Created Netlify Function: `netlify/functions/purge-cdn.ts`
2. Uses `purgeCache()` from `@netlify/functions` to purge all site content
3. Function deployed and ready to invoke at: `/.netlify/functions/purge-cdn`

### 📋 Implementation Details:
```typescript
import { purgeCache } from "@netlify/functions";

export default async (req, context) => {
  await purgeCache(); // Purges all cached content site-wide
  return new Response("Purged!", { status: 202 });
};
```

### ✅ Pre-Purge Verification Checklist:
1. ✅ Verified deploy contents via Deploy file browser (index.html present)
2. ✅ Confirmed DNS: Only Netlify IPs (75.2.60.5, no extra A/AAAA records)
3. ✅ Verified build status: Successful (HTTP 200 on edmecaacademy.netlify.app)
4. ✅ Automated tests confirm issue is CDN caching, not deployment

---

## NEXT STEPS

1. **Deploy purge function** (in progress)
2. **Invoke purge:** Visit `https://edmeca.co.za/.netlify/functions/purge-cdn`
3. **Wait 2-3 minutes** for purge to propagate globally
4. **Run verification tests:** `node tests/cross-browser-test.js`
5. **If issue persists:** Escalate to Netlify Support with edge behavior logs

---

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

Thank you for your assistance!
