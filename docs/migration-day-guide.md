# MIGRATION DAY: Simple Step-by-Step Guide
**Domain:** edmeca.co.za  
**Time Required:** 2-4 hours + DNS propagation  
**Difficulty:** ⭐⭐ Moderate

---

## ⚡ Quick Start (5 Steps)

### Step 1: Deploy to Netlify (30 minutes)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import existing project"**
3. Connect GitHub → Select your repository
4. Set build configuration:
   ```
   Build command: npm run build
   Publish directory: client/dist
   ```
5. Add environment variables (copy from .env.local):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **"Deploy site"**
7. ✅ **Wait for green "Published" status**
8. **Save your Netlify URL:** `https://[random-name].netlify.app`

**✅ Checkpoint:** Visit your Netlify URL and verify site works

---

### Step 2: Add Custom Domain in Netlify (5 minutes)

1. In Netlify, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Type: `edmeca.co.za`
4. Click **"Verify"** → **"Add domain"**
5. Netlify will show you DNS settings you need

**📝 WRITE DOWN THESE VALUES:**
```
A Record IP:     ___________________
CNAME Target:    ___________________.netlify.app
```

**✅ Checkpoint:** You have the Netlify DNS values written down

---

### Step 3: Update DNS at Registrar (15 minutes)

**⚠️ CRITICAL: Do NOT touch Google Mail records!**

#### Log into your registrar

Find your DNS management page (examples):
- **Namecheap:** Advanced DNS tab
- **GoDaddy:** DNS Management
- **Google Domains:** DNS settings

#### Take a screenshot FIRST (backup!)

#### Make these changes:

1. **DELETE:**
   - Any A record pointing to Replit
   - Any CNAME pointing to Replit

2. **ADD:**
   - **New A Record:**
     - Type: `A`
     - Host: `@`
     - Value: `[Netlify IP from Step 2]`
     - TTL: `3600`
   
   - **New CNAME Record:**
     - Type: `CNAME`
     - Host: `www`
     - Value: `[Your Netlify URL from Step 2]`
     - TTL: `3600`

3. **VERIFY Google Mail Records Still Exist:**
   - MX records (5 records) → Should still point to `google.com`
   - TXT SPF record → Should still say `v=spf1 include:_spf.google.com`
   - ✅ Do NOT delete or modify these!

4. **Save DNS changes**

**✅ Checkpoint:** DNS updated, Google Mail records untouched

---

### Step 4: Wait for DNS Propagation (15 min - 24 hours)

#### Check DNS propagation:

1. Run verification script:
   ```bash
   npm run dns:verify
   ```

2. Check global propagation:
   - Go to: https://dnschecker.org
   - Enter: `edmeca.co.za`
   - Look for: Netlify IP address (not Replit)

3. Test with command:
   ```bash
   nslookup edmeca.co.za
   ```
   Should show Netlify IP

**Usually takes:** 15 minutes to 2 hours  
**Maximum:** 24 hours

**✅ Checkpoint:** DNS checker shows Netlify IP worldwide

---

### Step 5: Verify Everything Works (30 minutes)

#### Test Website:
- [ ] Visit https://edmeca.co.za → Loads your site
- [ ] Check for green padlock (HTTPS)
- [ ] Test all pages
- [ ] Test forms
- [ ] Check browser console for errors

#### Test Email (CRITICAL):
- [ ] Send email **TO** `your@edmeca.co.za` → Receives successfully
- [ ] Send email **FROM** `your@edmeca.co.za` → Sends successfully
- [ ] Check spam folder

#### Monitor for 48 hours:
- [ ] Day 1: Check site and email
- [ ] Day 2: Check site and email
- [ ] Day 3: Final verification

**✅ Checkpoint:** All tests passing, no issues

---

## 🆘 Troubleshooting

### "Site not loading after DNS update"
**Wait longer.** DNS can take up to 24 hours. Try:
- Clearing browser cache (Ctrl+Shift+Delete)
- Using incognito/private mode
- Trying different browser
- Checking https://dnschecker.org

### "No HTTPS / Certificate error"
**SSL takes time after DNS.** 
1. Wait 2-4 hours after DNS propagates
2. Check Netlify → Domain settings → HTTPS → "Renew certificate"

### "Email stopped working"
**URGENT - Check MX records!**
```bash
nslookup -type=MX edmeca.co.za
```
Should show `google.com` servers. If not:
1. Log back into registrar
2. Re-add Google MX records (see full guide)
3. Contact Google Workspace support

### "Deploy failed on Netlify"
1. Check build logs in Netlify dashboard
2. Verify environment variables are set
3. Test locally: `npm run build`
4. Check Node version: Should be 18

---

## 📋 Migration Checklist (Print This)

```
BEFORE MIGRATION:
☐ Netlify account created
☐ Repository connected to Netlify
☐ Environment variables added
☐ Test deployment successful
☐ Netlify URL works

DNS UPDATE:
☐ Netlify DNS values noted
☐ Screenshot of current DNS taken
☐ Deleted old Replit records
☐ Added Netlify A record
☐ Added Netlify CNAME
☐ Verified Google MX records unchanged

VERIFICATION:
☐ DNS propagation complete (dnschecker.org)
☐ Website loads at edmeca.co.za
☐ HTTPS working (green padlock)
☐ Email sending works
☐ Email receiving works
☐ All pages functional
☐ Forms working

POST-MIGRATION:
☐ Monitored for 48 hours
☐ No issues reported
☐ Replit archived
☐ Team notified
```

---

## ⏰ Timeline

| Task | Time |
|------|------|
| Netlify deployment | 30 min |
| Add custom domain | 5 min |
| Update DNS | 15 min |
| **WAIT for DNS** | **15 min - 24 hrs** |
| SSL certificate | Auto (1-4 hrs after DNS) |
| Testing | 30 min |
| Monitoring | 48 hrs |

**Total active time:** ~2 hours  
**Total waiting time:** ~2-24 hours

---

## 🚨 Emergency Rollback

If something goes terribly wrong:

1. **Log back into registrar**
2. **Change A record back to old Replit IP**
3. **Wait 15-30 minutes**
4. **Site should be back on Replit**
5. **Email should NOT be affected** (MX unchanged)

---

## 📞 Need Help?

- **Netlify:** https://answers.netlify.com
- **Google Mail:** https://support.google.com/a
- **DNS Issues:** Your registrar support

---

## ✅ Success Indicators

You'll know it worked when:
- ✅ `edmeca.co.za` loads your new site
- ✅ Green padlock in browser (HTTPS)
- ✅ Email still works perfectly
- ✅ No errors in console
- ✅ All functionality working

---

**Ready? Let's go!** 🚀

Start with Step 1 above and work your way down.
