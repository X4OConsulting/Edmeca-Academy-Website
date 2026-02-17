# Netlify Forms Setup Guide

## ✅ What Was Fixed

### 1. Netlify Forms Detection
For Netlify to detect forms in a React/SPA application, we need a **static HTML form** in `index.html`:

```html
<!-- Hidden form for Netlify Forms detection -->
<form name="contact" netlify netlify-honeypot="bot-field" hidden>
  <input type="text" name="name" />
  <input type="email" name="email" />
  <input type="text" name="company" />
  <select name="audienceType">
    <option value="entrepreneur">An Entrepreneur</option>
    <option value="programme">A Programme / Incubator</option>
    <option value="other">Other</option>
  </select>
  <textarea name="message"></textarea>
</form>
```

**Why this is needed:**
- Netlify's build bot scans HTML files at build time
- React forms are rendered client-side (invisible to build bot)
- Hidden HTML form tells Netlify what fields to expect

### 2. React Form Submission
Updated `Contact.tsx` to submit using Netlify Forms format:

```typescript
const formData = new FormData();
formData.append('form-name', 'contact'); // CRITICAL: Must match hidden form name
formData.append('name', data.name);
formData.append('email', data.email);
// ... other fields

fetch('/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(formData as any).toString(),
});
```

**Key requirements:**
- `form-name` field must match the `name` attribute in hidden form
- Content-Type must be `application/x-www-form-urlencoded`
- Submit to `/` (root path)

### 3. Favicon Updates
Added comprehensive favicon support for all browsers:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
<link rel="shortcut icon" href="/favicon.png" />
<meta name="theme-color" content="#1a365d" />
```

## 🔍 How to Verify Forms Are Working

### After Deploy:

1. **Check Netlify Dashboard:**
   - Go to: Netlify Dashboard → Your Site → Forms
   - You should see "contact" form listed
   - If not listed, check build logs for "Form detection" messages

2. **Test Submission:**
   - Go to https://edmeca.co.za/contact
   - Fill out and submit the form
   - Check Netlify Dashboard → Forms → contact
   - Verified submissions should appear there

3. **Email Notifications (Optional):**
   - Netlify Dashboard → Site Settings → Forms → Form notifications
   - Add email notification: `Info@edmeca.co.za`
   - Get notified when forms are submitted

## 🐛 Common Issues

### Form not detected
**Symptom:** Form doesn't appear in Netlify Dashboard after deploy

**Solutions:**
1. Verify hidden form exists in `dist/index.html` after build:
   ```bash
   cat dist/index.html | grep 'name="contact"'
   ```

2. Check build logs for "Form detection" message

3. Ensure form has both `name` and `netlify` attributes

### Form submission fails
**Symptom:** 404 or form doesn't submit

**Solutions:**
1. Verify `form-name` field matches hidden form name exactly
2. Check Content-Type is `application/x-www-form-urlencoded`
3. Ensure submitting to `/` not `/.netlify/functions/contact`

### No email notifications
**Symptom:** Form submits but no emails received

**Solutions:**
1. Configure email notifications in Netlify Dashboard
2. Check spam folder
3. Consider using Netlify webhooks to trigger custom email logic

## 📧 Form Submission Flow

```
User fills form
    ↓
React validates (client-side)
    ↓
Submit to Netlify Forms (POST /)
    ↓
Netlify processes submission
    ↓
Stores in Netlify Dashboard
    ↓
Sends notifications (if configured)
```

## 🔐 Spam Protection

Netlify Forms includes:
- ✅ **Honeypot field** (`netlify-honeypot="bot-field"`)
- ✅ **reCAPTCHA** (can enable in Netlify Dashboard)
- ✅ **Rate limiting** (built-in)

## 💾 Form Data Storage

All submissions are stored in:
- **Netlify Dashboard → Forms → contact**
- Exportable as CSV
- Retained for 1 month (free plan), 12 months (pro plan)

## 🚀 Next Steps

1. ✅ Deploy changes (build complete)
2. ⏳ Push to Git: `git add . && git commit -m "feat: Enable Netlify Forms detection" && git push`
3. ⏳ Wait for Netlify deploy (~2 minutes)
4. ✅ Verify form appears in Netlify Dashboard
5. ✅ Test form submission
6. ✅ Configure email notifications (optional)

## 📚 Resources

- [Netlify Forms Docs](https://docs.netlify.com/forms/setup/)
- [React + Netlify Forms](https://www.netlify.com/blog/2017/07/20/how-to-integrate-netlifys-form-handling-in-a-react-app/)
- [Form Spam Filters](https://docs.netlify.com/forms/spam-filters/)
