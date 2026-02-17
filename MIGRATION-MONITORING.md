# MIGRATION MONITORING CHECKLIST

**Migration Date:** February 17, 2026  
**Domain:** edmeca.co.za  
**Platform:** Netlify (edmecaacademy.netlify.app)  

---

## 📅 MONITORING SCHEDULE

### **Day 1: February 17, 2026 (TODAY)**

**Morning Check (Completed):**
- [x] Site deployed successfully
- [x] DNS configured
- [x] HTTPS/SSL active
- [x] Replit disconnected

**Afternoon Check (2 PM):**
- [ ] Visit https://edmeca.co.za - loads?
- [ ] Visit https://www.edmeca.co.za - redirects?
- [ ] Check Netlify dashboard - any errors?
- [ ] Test contact form
- [ ] Check browser console (F12) - no errors?

**Evening Check (6 PM):**
- [ ] Site still loading correctly?
- [ ] No errors in Netlify logs?
- [ ] Email working (send test)?

---

### **Day 2: February 18, 2026**

**Morning Check (9 AM):**
- [ ] Site status: ✅ / ⚠️ / ❌
- [ ] Email status: ✅ / ⚠️ / ❌
- [ ] Netlify build status: ✅ / ⚠️ / ❌
- [ ] Any user reports of issues?

**Evening Check (6 PM):**
- [ ] Site status: ✅ / ⚠️ / ❌
- [ ] Email status: ✅ / ⚠️ / ❌
- [ ] Check Netlify function logs (contact form)
- [ ] Any 404 errors or broken links?

---

### **Day 3: February 19, 2026**

**Morning Check (9 AM):**
- [ ] Site status: ✅ / ⚠️ / ❌
- [ ] Email status: ✅ / ⚠️ / ❌
- [ ] Review analytics (if configured)
- [ ] Check for any DNS issues globally

**Final Verification:**
- [ ] All pages loading correctly
- [ ] All forms working
- [ ] Email sending/receiving normally
- [ ] HTTPS certificate valid
- [ ] No console errors
- [ ] Mobile responsive working

**Migration Status:** ✅ SUCCESS / ⚠️ ISSUES / ❌ ROLLBACK NEEDED

---

## 🔍 WHAT TO CHECK

### **Website Health:**
```bash
# Quick site check
curl -I https://edmeca.co.za
# Should return: HTTP/2 200

# DNS check
nslookup edmeca.co.za
# Should show: Netlify IP

# SSL check
https://www.ssllabs.com/ssltest/analyze.html?d=edmeca.co.za
# Should show: A or A+ rating
```

### **Email Health:**
```bash
# MX records check
nslookup -type=MX edmeca.co.za
# Should show: Google SMTP servers

# SPF check
nslookup -type=TXT edmeca.co.za
# Should include: v=spf1 include:_spf.google.com
```

### **Netlify Dashboard:**
- Go to: https://app.netlify.com
- Check: Deploys tab - all green?
- Check: Functions tab - contact form logs
- Check: Analytics (if enabled)

---

## 🆘 ISSUES & RESOLUTIONS

### **If Site Won't Load:**
1. Check DNS with `nslookup edmeca.co.za`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private mode
4. Check Netlify deployment status
5. Check https://downforeveryoneorjustme.com/edmeca.co.za

### **If Email Fails:**
1. Verify MX records: `nslookup -type=MX edmeca.co.za`
2. Check Google Workspace admin console
3. Wait 24-48 hours for DNS propagation
4. Check spam folder
5. Contact registrar if MX records changed

### **If HTTPS Certificate Issues:**
1. Wait 10-15 minutes for Netlify to provision
2. Check Netlify domain settings
3. Try "Renew certificate" in Netlify
4. Contact Netlify support if persists

### **If Contact Form Not Working:**
1. Check Netlify Functions logs
2. Verify environment variables set:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. Test Netlify function directly
4. Check browser console for errors

---

## 📊 SUCCESS CRITERIA

Migration is **SUCCESSFUL** when:
- ✅ Site loads at https://edmeca.co.za for 72 hours
- ✅ HTTPS certificate valid and auto-renewing
- ✅ Email sending/receiving works normally
- ✅ All forms and functionality working
- ✅ No critical errors in logs
- ✅ DNS propagated globally
- ✅ No user complaints or issues

---

## 📞 EMERGENCY CONTACTS

**Netlify Support:**
- Dashboard: https://app.netlify.com
- Support: https://www.netlify.com/support/

**IT-Guru Online (Registrar):**
- DNS issues or domain questions
- [Add contact details]

**Google Workspace Support:**
- Email issues
- https://admin.google.com

**Supabase Support:**
- Database/backend issues
- https://supabase.com/dashboard/support

---

## 📝 NOTES

**Date:** _____________  
**Issue:** _____________________________________________  
**Resolution:** _____________________________________________  
**Time to resolve:** _____________________________________________  

---

**Date:** _____________  
**Issue:** _____________________________________________  
**Resolution:** _____________________________________________  
**Time to resolve:** _____________________________________________  

---

**Date:** _____________  
**Issue:** _____________________________________________  
**Resolution:** _____________________________________________  
**Time to resolve:** _____________________________________________  
