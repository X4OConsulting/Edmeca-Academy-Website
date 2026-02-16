# EDMECA Academy Documentation

Welcome to the EDMECA Digital Academy project documentation. This directory contains all project documentation and guides.

## 📚 Documentation Index

### 🚀 **Getting Started**
- [Migration Guide](MIGRATION-GUIDE.md) - Complete migration from Replit to Netlify + Supabase

### 🔧 **Development Workflow** 
- [Git Workflow](WORKFLOW.md) - Branch structure and development process
- [Staging Setup](STAGING-SETUP.md) - Instructions for staging environment deployment

## 🏗️ **Project Architecture**

### **Frontend Stack**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Routing:** Wouter
- **State:** TanStack Query

### **Backend Stack**
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Functions:** Netlify Functions
- **Hosting:** Netlify

### **Development Tools**
- **Package Manager:** npm
- **Version Control:** Git with GitFlow workflow
- **CI/CD:** GitHub Actions + Netlify

## 🌍 **Environments**

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Development** | `development` | http://localhost:5174 | Local development |
| **Staging** | `staging` | https://staging--edmecaacademy.netlify.app | Testing & QA |
| **Production** | `main` | https://edmecaacademy.netlify.app | Live site |

## 📋 **Quick Commands**

```bash
# Development
npm run dev          # Start local development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run db:migrate   # Run Supabase migrations
npm run db:reset     # Reset database
npm run db:status    # Check database status
npm run db:pipeline  # Run database pipeline

# Git Workflow
git checkout development  # Switch to development
git checkout staging     # Switch to staging
git checkout main        # Switch to production
```

## 🔧 **Environment Setup**

1. **Clone Repository**
   ```bash
   git clone https://github.com/X4OConsulting/Edmeca-Academy-Website.git
   cd Edmeca-Academy-Website
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   - Copy `client/.env.example` to `client/.env.local`
   - Update with your Supabase credentials

4. **Start Development**
   ```bash
   npm run dev
   ```

## 📞 **Support**

For questions or issues:
- **Email:** khusselmann@x4o.co.za
- **GitHub:** [X4OConsulting/Edmeca-Academy-Website](https://github.com/X4OConsulting/Edmeca-Academy-Website)

---

**Last Updated:** February 16, 2026  
**Project:** EDMECA Digital Academy  
**Organization:** X4O Consulting