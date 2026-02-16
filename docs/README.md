# EDMECA Digital Academy - Setup Overview

## Project Overview
Modern web application for EDMECA Digital Academy built with React 18, TypeScript, and Vite. Migrated from Replit Express.js to a modern Netlify + Supabase architecture.

## 🏗️ Architecture Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query + React Context
- **UI Components**: shadcn/ui component library

### Backend & Services 
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT + OAuth)
- **Functions**: Netlify Functions (serverless)
- **Storage**: Supabase Storage
- **Email**: Gmail integration

### Deployment & CI/CD
- **Hosting**: Netlify
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain with SSL
- **Environment**: Production + Staging branches

## 📁 Project Structure
```
edmeca-website/
├── 📁 client/                 # Frontend React application
│   ├── 📄 index.html         # Main HTML template
│   ├── 📁 public/            # Static assets
│   └── 📁 src/
│       ├── 📄 App.tsx        # Main app component
│       ├── 📄 main.tsx       # React entry point
│       ├── 📁 components/    # Reusable UI components
│       │   ├── 📁 ui/        # shadcn/ui components
│       │   └── 📁 marketing/ # Marketing layout components
│       ├── 📁 pages/         # Route components
│       │   └── 📁 portal/    # Protected portal pages
│       ├── 📁 hooks/         # Custom React hooks
│       └── 📁 lib/          # Utilities and configurations
├── 📁 server/                # Netlify Functions (serverless)
├── 📁 shared/               # Shared types and schemas
├── 📁 smartsheet/          # Project management tracking
└── 📁 docs/               # Documentation (this folder)
```

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/edmeca-website.git
cd edmeca-website
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Add your Supabase credentials
# See docs/ENVIRONMENT_SETUP.md for details
```

### 3. Start Development
```bash
npm run dev
# Opens at http://localhost:5173
```

## 🌍 Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Development** | `development` | Local | Feature development |
| **Staging** | `staging` | staging.edmeca.com | Testing & QA |
| **Production** | `main` | edmeca.com | Live application |

## 🔐 Authentication System

### Supported Methods
- ✅ **Email/Password** - Standard login/signup
- ✅ **Google OAuth** - Social authentication  
- ✅ **GitHub OAuth** - Developer-friendly login
- ✅ **Password Reset** - Email-based recovery
- ✅ **Email Verification** - Account confirmation

### Protected Routes
- `/portal/*` - Requires authentication
- `/dashboard` - User dashboard
- `/tools/*` - BMC and other tools

### Public Routes  
- `/` - Marketing homepage
- `/about` - Company information
- `/solutions` - Service offerings
- `/contact` - Contact form

## 📋 Key Features

### Marketing Website
- 🎨 Modern responsive design
- 🌙 Dark/light theme toggle  
- 📱 Mobile-first approach
- ⚡ Optimized performance
- 🔍 SEO-friendly structure

### User Portal
- 🔒 Secure authentication
- 👤 User dashboard
- 🛠️ Business Model Canvas tool
- 📊 Analytics and insights
- 📧 Email integrations

### Admin Features
- 👥 User management
- 📈 Usage analytics
- 🛡️ Security monitoring
- 📝 Content management

## 🚀 Deployment Status

### Current Deployments
- ✅ **Production**: Live at edmeca.com
- ✅ **Staging**: Available for testing
- ✅ **CI/CD**: Automated deployments
- ✅ **SSL**: Secure HTTPS enabled
- ✅ **CDN**: Global content delivery

### Performance Metrics
- 🚀 **Lighthouse Score**: 90+ overall
- ⚡ **Load Time**: < 2 seconds
- 📱 **Mobile Score**: 95+
- 🔍 **SEO Score**: 90+

## 📚 Documentation Links

| Topic | Link | Description |
|-------|------|-------------|
| **Development Setup** | [DEVELOPMENT.md](DEVELOPMENT.md) | Local development guide |
| **Environment Config** | [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) | Environment variables |
| **Deployment Guide** | [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |
| **Authentication Setup** | [AUTHENTICATION.md](AUTHENTICATION.md) | Supabase Auth config |
| **API Documentation** | [API.md](API.md) | Backend endpoints |
| **Contributing Guide** | [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow |

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # TypeScript checks

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open database studio

# Deployment
npm run deploy:staging   # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## 🔧 Technology Versions

```json
{
  "node": ">=18.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "supabase": "^2.0.0",
  "netlify": "latest"
}
```

## 🆘 Support & Troubleshooting

### Common Issues
- **Build Errors**: Check TypeScript and import paths
- **Auth Issues**: Verify Supabase configuration
- **Deployment**: Check environment variables
- **Performance**: Review bundle size and imports

### Getting Help
1. Check documentation in `/docs/` folder
2. Review GitHub Issues
3. Contact development team
4. Supabase documentation: [supabase.com/docs](https://supabase.com/docs)

## 🗺️ Project Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] Supabase integration
- [x] Authentication system
- [x] Deployment pipeline

### Phase 2: Core Features ⏳
- [ ] User dashboard enhancements
- [ ] Business Model Canvas tool
- [ ] Advanced analytics
- [ ] Email marketing integration

### Phase 3: Growth 📋
- [ ] Multi-tenancy support
- [ ] Advanced user roles
- [ ] API integrations
- [ ] Mobile app companion

---

**Last Updated**: February 16, 2026  
**Version**: 2.0.0  
**Status**: Production Ready ✅