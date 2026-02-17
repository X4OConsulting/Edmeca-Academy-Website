# DNS UPDATE REQUEST FOR IT-GURU ONLINE

**Domain:** edmeca.co.za  
**Date:** February 17, 2026  
**Registrar:** IT-Guru Online  

---

## PART 1: DELETE THESE RECORDS

Please **remove** any existing records for the root domain and www subdomain that point to the old hosting (Replit):

```
DELETE: A record for @ (root) pointing to old IP
DELETE: A record for edmeca.co.za pointing to old IP
DELETE: CNAME for @ pointing to any Replit domain
DELETE: CNAME for www pointing to any Replit domain
```

---

## PART 2: ADD THESE NEW RECORDS

Please **add** the following DNS records for Netlify hosting:

### Record 1: Root Domain (A Record)
```
Type:        A
Host:        @ (or edmeca.co.za or leave blank - root domain)
Value:       75.2.60.5
TTL:         3600 (or Auto)
Priority:    N/A
```

### Record 2: WWW Subdomain (CNAME)
```
Type:        CNAME
Host:        www
Value:       edmecaacademy.netlify.app
TTL:         3600 (or Auto)
Priority:    N/A
```

---

## PART 3: CRITICAL - DO NOT MODIFY THESE RECORDS

⚠️ **IMPORTANT: Keep all existing email records unchanged**

Please **preserve** all of the following records (for Google Workspace email):

### MX Records (5 records - DO NOT DELETE)
```
Priority 1:  ASPMX.L.GOOGLE.COM
Priority 5:  ALT1.ASPMX.L.GOOGLE.COM
Priority 5:  ALT2.ASPMX.L.GOOGLE.COM
Priority 10: ALT3.ASPMX.L.GOOGLE.COM
Priority 10: ALT4.ASPMX.L.GOOGLE.COM
```

### TXT Records (DO NOT DELETE any containing):
```
- "v=spf1 include:_spf.google.com"
- Any records containing "google-site-verification"
- Any records containing "dkim" or "dmarc"
```

---

## SUMMARY OF CHANGES

**Actions Required:**

1. ❌ **DELETE:** Old website A/CNAME records pointing to Replit
2. ✅ **ADD:** New A record: `@ → 75.2.60.5`
3. ✅ **ADD:** New CNAME: `www → edmecaacademy.netlify.app`
4. ⚠️ **PRESERVE:** All MX and email-related TXT records (Google Workspace)

---

## EXPECTED RESULT

After these DNS changes:

- ✅ Website will load from Netlify at https://edmeca.co.za
- ✅ www.edmeca.co.za will redirect to edmeca.co.za
- ✅ Email will continue working via Google Workspace (no interruption)
- ⏱️ DNS propagation time: 15 minutes to 24 hours

---

## VERIFICATION

After changes are made, I will verify using:

```bash
# Check A record (should show 75.2.60.5)
nslookup edmeca.co.za

# Check WWW CNAME (should show edmecaacademy.netlify.app)
nslookup www.edmeca.co.za

# Check MX records (should show Google servers)
nslookup -type=MX edmeca.co.za

# Global DNS checker
https://dnschecker.org/#A/edmeca.co.za
```

---

## CONTACT

Please confirm when changes are complete so I can verify DNS propagation.

**Urgency:** Normal  
**Requested by:** [Your Name]  
**Contact:** [Your Email/Phone]

---

*This DNS update migrates edmeca.co.za from Replit to Netlify while preserving Google Workspace email functionality.*
