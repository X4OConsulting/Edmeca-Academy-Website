# Domain Migration Documentation
## edmeca.co.za: Replit → Netlify

This folder contains all documentation for migrating edmeca.co.za from Replit to Netlify hosting.

---

## 📚 Documents Overview

### 🚀 [Migration Day Guide](./migration-day-guide.md) - START HERE
**Simple 5-step guide for migration day**
- Quick start instructions
- 2-4 hour process
- Easy to follow
- Includes troubleshooting

**Use this:** When you're ready to do the actual migration

---

### ✅ [Migration Checklist](./migration-checklist.md)
**Comprehensive tracking checklist**
- Pre-migration setup
- DNS configuration
- Testing & validation
- Post-migration cleanup
- Status tracking

**Use this:** To track your progress and ensure nothing is missed

---

### 📖 [Domain Migration Guide](./domain-migration-guide.md)
**Detailed technical guide**
- Full migration process
- Step-by-step instructions
- Rollback procedures
- Common issues & solutions
- Emergency contacts

**Use this:** For detailed reference and technical details

---

### ⚡ [DNS Quick Reference](./dns-quick-reference.md)
**DNS configuration cheat sheet**
- Quick DNS record reference
- Google Mail records (MUST PRESERVE)
- Netlify records to add
- DNS table template
- Verification commands

**Use this:** When updating DNS at your registrar

---

## 🛠️ Tools & Scripts

### DNS Verification Script
**Location:** `scripts/verify-dns.js`

**Run with:**
```bash
npm run dns:verify
```

**What it does:**
- Checks A records (website)
- Checks CNAME records (www subdomain)
- Verifies MX records (email - CRITICAL)
- Checks SPF/DKIM/DMARC (email authentication)
- Shows migration status

---

## 📋 Quick Migration Overview

1. **Deploy to Netlify** (30 min)
   - Connect GitHub repository
   - Configure build settings
   - Add environment variables
   - Deploy site

2. **Add Custom Domain** (5 min)
   - Add edmeca.co.za in Netlify
   - Note DNS values provided

3. **Update DNS** (15 min)
   - Delete old Replit records
   - Add Netlify A record
   - Add Netlify CNAME
   - **Preserve Google Mail MX records**

4. **Wait for DNS** (15 min - 24 hrs)
   - Check with dnschecker.org
   - Run `npm run dns:verify`

5. **Verify & Test** (30 min)
   - Test website
   - Test HTTPS
   - **Test email (critical)**
   - Monitor for 48 hours

---

## ⚠️ Critical Warnings

### DO NOT Delete These DNS Records:
- ❌ **MX records** (5 records pointing to google.com) - **EMAIL WILL BREAK**
- ❌ **SPF record** (TXT: v=spf1 include:_spf.google.com ~all)
- ❌ **DKIM record** (google._domainkey)
- ❌ **DMARC record** (_dmarc)

### Email Records Must Point to Google Workspace
Your email (you@edmeca.co.za) is hosted by Google Workspace, NOT Netlify.  
Netlify only hosts your website. Keep email DNS separate!

---

## 🚀 Ready to Migrate?

1. Read [migration-day-guide.md](./migration-day-guide.md)
2. Open [migration-checklist.md](./migration-checklist.md) for tracking
3. Keep [dns-quick-reference.md](./dns-quick-reference.md) handy
4. Start with Step 1: Deploy to Netlify

Good luck! 🎉
