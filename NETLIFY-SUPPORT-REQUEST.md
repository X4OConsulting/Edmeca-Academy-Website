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

## REQUESTED ACTION

Please **manually purge ALL edge CDN cache** for:
1. Custom domain: `edmeca.co.za`
2. Subdomain: `www.edmeca.co.za`
3. All associated edge nodes globally

This appears to be a stale cache issue at specific edge nodes that handle Firefox/Safari traffic, while Chrome edge nodes serve correct content.

---

## URGENCY

**High** - Site is live but inaccessible to 40%+ of users (Firefox, Safari browsers)

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
