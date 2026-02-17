# Domain Migration Checklist: edmeca.co.za
**Migration Date:** February 17, 2026  
**Domain:** edmeca.co.za → Replit to Netlify  
**Status:** 🟡 Not Started

---

## Pre-Migration Setup

### Netlify Deployment
- [ ] Created Netlify account (https://app.netlify.com)
- [ ] Connected GitHub repository to Netlify
- [ ] Configured build settings:
  - Build command: `npm run build`
  - Publish directory: `client/dist`
  - Node version: 18
- [ ] Added environment variables in Netlify dashboard:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Initial deployment successful
- [ ] Site accessible at Netlify URL: `https://____________.netlify.app`
- [ ] Tested all pages on Netlify preview
- [ ] All functionality working on preview

**Netlify Site URL:** `https://____________.netlify.app`  
**Deployment Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete

---

## DNS Preparation

### Document Current Settings
- [ ] Logged into domain registrar
- [ ] Documented current Replit DNS settings:
  - Current A record IP: `________________`
  - Current CNAME (if any): `________________`
- [ ] Verified Google Workspace MX records exist:
  - [ ] ASPMX.L.GOOGLE.COM (Priority 1)
  - [ ] ALT1.ASPMX.L.GOOGLE.COM (Priority 5)
  - [ ] ALT2.ASPMX.L.GOOGLE.COM (Priority 5)
  - [ ] ALT3.ASPMX.L.GOOGLE.COM (Priority 10)
  - [ ] ALT4.ASPMX.L.GOOGLE.COM (Priority 10)
- [ ] Verified Google SPF record exists (TXT: v=spf1 include:_spf.google.com ~all)
- [ ] Verified Google DKIM record exists (TXT: google._domainkey)
- [ ] Verified DMARC record exists (TXT: _dmarc)

**Registrar:** `________________`  
**Login URL:** `________________`

---

## Netlify Custom Domain Setup

### Add Domain to Netlify
- [ ] Opened Netlify Site Settings → Domain Management
- [ ] Clicked "Add custom domain"
- [ ] Entered domain: `edmeca.co.za`
- [ ] Clicked "Verify"
- [ ] Noted Netlify DNS requirements:

**Netlify DNS Values (COPY THESE):**
- A Record IP: `________________`
- CNAME target: `________________.netlify.app`
- Verification TXT (if required): `________________`

**Domain Configuration Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete

---

## DNS Updates at Registrar

### Backup Current DNS (IMPORTANT)
- [ ] Took screenshot of current DNS records
- [ ] Saved current DNS configuration to file
- [ ] Verified all Google Mail records documented

**Backup Location:** `________________`

### Update DNS Records

#### Delete Old Records
- [ ] Deleted old Replit A record(s)
- [ ] Deleted old Replit CNAME record(s)

#### Add Netlify Records
- [ ] Added A record:
  - Type: A
  - Host: @
  - Value: `________________` (from Netlify)
  - TTL: 3600
- [ ] Added CNAME record for www:
  - Type: CNAME
  - Host: www
  - Value: `________________.netlify.app`
  - TTL: 3600
- [ ] Added TXT verification record (if required by Netlify)

#### Verify Google Mail Records UNCHANGED
- [ ] MX records still point to Google (NOT Netlify)
- [ ] SPF record unchanged
- [ ] DKIM record unchanged
- [ ] DMARC record unchanged

**DNS Update Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete  
**DNS Update Time:** `________________`

---

## DNS Propagation & Verification

### Check Propagation
- [ ] Ran verification script: `node scripts/verify-dns.js`
- [ ] Checked global propagation: https://dnschecker.org
  - [ ] North America: DNS updated
  - [ ] Europe: DNS updated
  - [ ] Asia: DNS updated
  - [ ] Australia: DNS updated
- [ ] A record points to Netlify (confirmed)
- [ ] CNAME points to Netlify (confirmed)
- [ ] MX records still point to Google (confirmed)

**Propagation Start Time:** `________________`  
**Propagation Complete Time:** `________________`  
**Propagation Duration:** `________________`

---

## SSL/HTTPS Configuration

### Netlify SSL Certificate
- [ ] Returned to Netlify → Domain Settings → HTTPS
- [ ] Verified "Certificate status" shows "Active" or "Provisioning"
- [ ] Enabled "Force HTTPS" (redirects HTTP to HTTPS)
- [ ] Waited for SSL certificate provisioning (can take 1-24 hours)
- [ ] Certificate status: **Active** ✅

**SSL Certificate Status:** ⚪ Not Started | 🟡 Provisioning | 🟢 Active  
**Certificate Issue Time:** `________________`

---

## Testing & Validation

### Website Testing
- [ ] Website loads at: https://edmeca.co.za
  - **Status:** ⚪ Not Loading | 🟡 Loading without HTTPS | 🟢 Loading with HTTPS
- [ ] WWW subdomain works: https://www.edmeca.co.za
  - **Status:** ⚪ Not Loading | 🟡 Loading | 🟢 Redirects to primary
- [ ] HTTPS shows green padlock (valid certificate)
- [ ] All pages accessible:
  - [ ] Home page
  - [ ] About page
  - [ ] Solutions page
  - [ ] Contact page
  - [ ] Portal/Dashboard pages
- [ ] Forms work correctly:
  - [ ] Contact form submits
  - [ ] No console errors
- [ ] Navigation works (React Router)
- [ ] Images load correctly
- [ ] Supabase connection working

**Website Test Status:** ⚪ Not Started | 🟡 Partial | 🟢 All Tests Pass

### Email Testing (CRITICAL)
- [ ] **Sending Email Test:**
  - Sent test email FROM: `________________@edmeca.co.za`
  - Recipient received email: ⚪ No | 🟢 Yes
  - Email not marked as spam: ⚪ No | 🟢 Yes
- [ ] **Receiving Email Test:**
  - Sent test email TO: `________________@edmeca.co.za`
  - Email received successfully: ⚪ No | 🟢 Yes
  - No delivery delays: ⚪ No | 🟢 Yes
- [ ] Checked Google Workspace Admin console for delivery logs
- [ ] No email bounces or errors

**Email Test Status:** ⚪ Not Started | 🟡 Partial | 🟢 All Tests Pass  
**Email Test Time:** `________________`

### Performance Testing
- [ ] PageSpeed Insights test: https://pagespeed.web.dev
  - Performance score: `____/100`
  - Accessibility score: `____/100`
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

---

## Monitoring Period (48-72 Hours)

### Day 1 (First 24 Hours)
- [ ] **Hour 1:** All systems operational
- [ ] **Hour 6:** No issues reported
- [ ] **Hour 12:** Website stable
- [ ] **Hour 24:** Email functioning normally

### Day 2
- [ ] Morning check: All good
- [ ] Afternoon check: All good
- [ ] Evening check: All good
- [ ] Email sending/receiving normal

### Day 3
- [ ] Final full system check
- [ ] No errors in Netlify logs
- [ ] No email delivery issues
- [ ] All functionality verified

**Monitoring Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete  
**Issues Encountered:** `________________`

---

## Post-Migration Cleanup

### After 72 Hours of Stable Operation
- [ ] All tests passing for 72 hours
- [ ] No bugs or issues reported
- [ ] Email delivery 100% successful
- [ ] HTTPS working perfectly

### Disable Old Hosting
- [ ] Archived Replit project
- [ ] Disabled Replit deployment (keep backup for 30 days)
- [ ] Documented Replit archive location: `________________`

### Update Documentation
- [ ] Updated README.md with Netlify deployment info
- [ ] Documented migration process (lessons learned)
- [ ] Updated team wiki/docs with new deployment process
- [ ] Removed old Replit deployment instructions

### Team Communication
- [ ] Notified team of successful migration
- [ ] Shared new deployment process
- [ ] Updated emergency contacts list
- [ ] Scheduled migration retrospective

**Cleanup Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete

---

## Issues & Resolutions

### Issues Encountered

1. **Issue:** `________________`
   - **Time:** `________________`
   - **Resolution:** `________________`
   - **Time to Resolve:** `________________`

2. **Issue:** `________________`
   - **Time:** `________________`
   - **Resolution:** `________________`
   - **Time to Resolve:** `________________`

3. **Issue:** `________________`
   - **Time:** `________________`
   - **Resolution:** `________________`
   - **Time to Resolve:** `________________`

---

## Final Status

### Migration Summary
- **Start Date/Time:** `________________`
- **Completion Date/Time:** `________________`
- **Total Migration Time:** `________________`
- **Downtime:** `________________` (should be 0 minutes)
- **DNS Propagation Time:** `________________`
- **SSL Certificate Time:** `________________`
- **Issues Encountered:** `____` (number)
- **Critical Issues:** `____` (number)

### Success Criteria
- [x] Website accessible at https://edmeca.co.za
- [x] HTTPS working with valid certificate
- [x] All pages functional
- [x] Email sending works
- [x] Email receiving works
- [x] No downtime experienced
- [x] No data loss
- [x] All integrations working (Supabase, etc.)

**Overall Status:** ⚪ Not Started | 🟡 In Progress | 🔴 Issues | 🟢 Complete Success

---

## Sign-off

**Migration Performed By:** `________________`  
**Verified By:** `________________`  
**Final Sign-off Date:** `________________`

**Notes:**
```
[Add any final notes, observations, or recommendations here]
```

---

**Last Updated:** February 17, 2026  
**Next Review:** After successful migration
