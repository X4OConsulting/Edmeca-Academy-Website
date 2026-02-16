# EDMECA Academy - Staging Environment Setup Guide

## 🔧 Configure Branch Deploys in Netlify

### In your Netlify Dashboard:

1. **Navigate to**: Site settings → Build & deploy → Continuous deployment
2. **Find**: "Branch deploys" section
3. **Click**: "Edit settings" 
4. **Add branch**: Enter `staging`
5. **Enable**: "Branch deploy subdirectories" 
6. **Save settings**

### Expected URLs:
- **Production**: https://edmecaacademy.netlify.app (from `main` branch)
- **Staging**: https://staging--edmecaacademy.netlify.app (from `staging` branch)

## 🎯 Environment Variables for Staging

Staging should use the SAME environment variables as production:

```env
VITE_SUPABASE_URL=https://dqvdnyxkkletgkkpicdg.supabase.co  
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdmRueXhra2xldGdra3BpY2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTQ3OTMsImV4cCI6MjA4NjczMDc5M30.d7JGx-h931PNBxHS0emXBzCdY7dqgW0tItFigrnz-24
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🚀 Workflow

### Development Process:
```bash
# 1. Work on features
git checkout development
# ... make changes ...
git push origin development

# 2. Test on staging  
git checkout staging
git merge development
git push origin staging
# → Deploys to https://staging--edmecaacademy.netlify.app

# 3. Deploy to production
git checkout main  
git merge staging
git push origin main
# → Deploys to https://edmecaacademy.netlify.app
```

## ✅ Current Status
- ✅ `staging` branch ready with latest code
- ✅ Pushed to GitHub for Netlify deployment
- ⏳ Configure branch deploys in Netlify dashboard
- ⏳ Add environment variables for staging (if different)

## 🎯 Next Steps
1. Configure branch deploys in Netlify dashboard
2. Test staging deployment 
3. Set up custom domain (optional)