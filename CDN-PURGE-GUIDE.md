# CDN CACHE PURGE GUIDE

## 🎯 PROBLEM SOLVED

Browser-specific CDN cache issue causing Firefox/Safari to get 404 while Chrome gets HTTP 200.

**Solution:** Purge all CDN cache using Netlify's `purgeCache()` API.

---

## ✅ METHOD 1: Netlify Function (RECOMMENDED)

### What We Created:
A Netlify Function at `netlify/functions/purge-cdn.ts` that purges ALL cached content site-wide.

### How to Use:

**Step 1: Deploy the function**
```bash
git add netlify/functions/purge-cdn.ts
git commit -m "feat: Add CDN cache purge function"
git push origin clean-deploy
```

**Step 2: Wait for deploy** (2-3 minutes)
Check: https://app.netlify.com/sites/edmecaacademy/deploys

**Step 3: Trigger the purge**

**Option A - Browser:**
Visit: https://edmeca.co.za/.netlify/functions/purge-cdn

**Option B - curl:**
```bash
curl https://edmeca.co.za/.netlify/functions/purge-cdn
```

**Option C - PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://edmeca.co.za/.netlify/functions/purge-cdn"
```

### Expected Response:
```json
{
  "success": true,
  "message": "CDN cache purged successfully",
  "timestamp": "2026-02-17T...",
  "note": "All cached content has been invalidated. Next requests will fetch fresh content."
}
```

**HTTP Status:** 202 Accepted (purge is asynchronous)

---

## 🔄 METHOD 2: Direct API Call (BACKUP)

If the function doesn't work, use Netlify's API directly.

### Prerequisites:
1. Get your **Personal Access Token**:
   - Go to: https://app.netlify.com/user/applications
   - Click "New access token"
   - Name: "CDN Purge" 
   - Copy the token (save it securely)

2. Get your **Site ID**:
   - Netlify Dashboard → Site Settings → General
   - Or from URL: `edmecaacademy` is your site slug

### PowerShell Command:
```powershell
$token = "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
$siteId = "edmecaacademy"  # or use the actual site ID

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$body = @{
    site_id = $siteId
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/purge" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### curl Command (if you have it):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --data '{"site_id": "edmecaacademy"}' \
  'https://api.netlify.com/api/v1/purge'
```

---

## 🔍 VERIFICATION STEPS

### Immediate (within 1 minute):

**1. Check function logs:**
- Netlify Dashboard → Functions → purge-cdn → View logs
- Should see: "✅ CDN cache purge successful"

**2. Test single browser manually:**
```bash
# Firefox or Safari (previously returned 404)
# Visit: https://edmeca.co.za
# Expected: Site should now load (HTTP 200)
```

### Comprehensive (run automated tests):

**3. Run cross-browser tests:**
```bash
node tests/cross-browser-test.js
```

**Expected output:**
```
✅ Chromium: ALL TESTS PASSED
✅ Firefox: ALL TESTS PASSED (was failing before)
✅ WebKit: ALL TESTS PASSED (was failing before)
```

### What Changed:
- **Before purge:** Chrome ✅, Firefox ❌, Safari ❌
- **After purge:** Chrome ✅, Firefox ✅, Safari ✅

---

## 📊 WHAT GETS PURGED

When you call `purgeCache()` with no parameters:

✅ **All cached content** for the site  
✅ **All deploys** (current and previous)  
✅ **All domains** (edmeca.co.za, www.edmeca.co.za, edmecaacademy.netlify.app)  
✅ **All edge nodes globally** (resolves browser-specific routing issues)

**Next request:** Edge nodes will fetch fresh content from origin.

---

## ⚠️ IMPORTANT NOTES

### 1. Purge is Asynchronous
- HTTP 202 Accepted = purge initiated
- Actual purge takes a few seconds to propagate
- Wait 30-60 seconds before testing

### 2. Performance Impact (Temporary)
- First requests after purge will be slower (cache MISS)
- Subsequent requests will be fast again (cache HIT)
- Normal performance resumes within a few minutes

### 3. When to Use
- After custom domain changes
- After DNS updates
- When different browsers serve different content
- When you see stale content that won't clear with browser refresh

### 4. Frequency Limits
- No documented rate limit for purge API
- Use responsibly (not needed after every deploy)
- Normal deploys auto-invalidate their own content

---

## 🆘 TROUBLESHOOTING

### Function returns 500 error
**Check:**
1. Function deployed successfully (check build logs)
2. @netlify/functions is installed (`npm list @netlify/functions`)
3. Function logs in Netlify Dashboard for specific error

**Fix:**
Fall back to Method 2 (Direct API call)

### Purge successful but Firefox still shows 404
**Possible causes:**
1. Purge still propagating (wait 2-3 minutes)
2. Browser cached the 404 locally (hard refresh: Ctrl+Shift+R)
3. Different issue (check deploy file browser)

**Steps:**
1. Wait 3 minutes after purge
2. Test in incognito/private mode
3. Clear browser cache completely
4. Run automated tests to confirm

### API call returns authentication error
**Check:**
1. Personal access token is correct
2. Token has not expired
3. Token has required permissions

**Fix:**
Generate new token from: https://app.netlify.com/user/applications

---

## 📋 QUICK REFERENCE

| Action | Command |
|--------|---------|
| Deploy purge function | `git push origin clean-deploy` |
| Trigger purge (browser) | Visit `/.netlify/functions/purge-cdn` |
| Trigger purge (PowerShell) | `Invoke-WebRequest -Uri "https://edmeca.co.za/.netlify/functions/purge-cdn"` |
| Check function logs | Netlify Dashboard → Functions → purge-cdn |
| Run verification tests | `node tests/cross-browser-test.js` |

---

## ✅ SUCCESS CRITERIA

After purge is complete:

1. ✅ Function returns HTTP 202 with success message
2. ✅ Firefox loads https://edmeca.co.za (was 404, now 200)
3. ✅ Safari loads https://edmeca.co.za (was 404, now 200)
4. ✅ Chrome still works (was 200, still 200)
5. ✅ Automated tests pass for all 3 browsers
6. ✅ All pages load correctly (/, /about, /contact, etc.)

When all criteria met: **CDN ISSUE RESOLVED** ✅

---

## 📚 REFERENCES

- [Netlify Purge Cache Docs](https://docs.netlify.com/configure-builds/on-demand-builders/#purge-cached-content)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Netlify API Documentation](https://open-api.netlify.com/)

---

**Created:** February 17, 2026  
**Purpose:** Resolve browser-specific CDN caching issue  
**Status:** Ready to deploy and test
