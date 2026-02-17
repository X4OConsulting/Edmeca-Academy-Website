# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **VS Code**: Recommended editor

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense  
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/edmeca-website.git
cd edmeca-website
```

### 2. Install Dependencies
```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials (see ENVIRONMENT_SETUP.md)
code .env
```

### 4. Database Setup
```bash
# Generate database types
npm run db:generate

# Apply migrations
npm run db:migrate

# Optional: Open database studio
npm run db:studio
```

## Development Workflow

### Starting Development Server
```bash
# Start the development server
npm run dev

# Server will start at:
# Frontend: http://localhost:5173
# Server functions: http://localhost:8888/.netlify/functions
```

### Project Structure Deep Dive

```
client/src/
├── 📄 App.tsx                 # Main application component
├── 📄 main.tsx               # React entry point
├── 📄 index.css              # Global styles
├── 📁 components/            # Reusable components
│   ├── 📄 ThemeProvider.tsx  # Global theme context
│   ├── 📄 ThemeToggle.tsx    # Dark/light mode toggle
│   ├── 📁 ui/                # shadcn/ui components
│   └── 📁 marketing/         # Marketing site components
├── 📁 hooks/                 # Custom React hooks
│   ├── 📄 use-auth.ts        # Authentication hook
│   ├── 📄 use-mobile.tsx     # Mobile detection
│   └── 📄 use-toast.ts       # Toast notifications
├── 📁 lib/                   # Utilities and configs
│   ├── 📄 utils.ts           # Helper functions
│   ├── 📄 auth-utils.ts      # Auth utilities
│   └── 📄 queryClient.ts     # TanStack Query config
└── 📁 pages/                 # Route components
    ├── 📄 Home.tsx           # Landing page
    ├── 📄 About.tsx          # About page  
    ├── 📄 Solutions.tsx      # Services page
    ├── 📄 Contact.tsx        # Contact form
    ├── 📄 not-found.tsx      # 404 page
    └── 📁 portal/            # Protected pages
        ├── 📄 Dashboard.tsx  # User dashboard
        └── 📄 BMCTool.tsx    # Business Model Canvas
```

## Key Development Commands

### Building and Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Building
npm run build
npm run preview   # Preview production build

# Testing (when tests are added)
npm run test
npm run test:watch
```

### Database Operations
```bash
# Generate migrations from schema changes
npm run db:generate

# Apply pending migrations  
npm run db:migrate

# Push schema changes directly (development only)
npm run db:push

# Open Drizzle Studio for database inspection
npm run db:studio
```

## Development Best Practices

### Code Organization
- **Components**: Keep components small and focused
- **Hooks**: Extract logic into custom hooks
- **Types**: Define TypeScript interfaces in shared/
- **Styles**: Use Tailwind classes, avoid custom CSS

### Git Workflow
```bash
# Create feature branch
git checkout development
git pull origin development
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
# Create PR to staging branch on GitHub
```

### Branch Strategy
- **main**: Production-ready code
- **staging**: Testing and QA
- **development**: Integration branch
- **feature/***: Individual features
- **fix/***: Bug fixes

## Common Development Tasks

### Adding New Page
1. Create component in `client/src/pages/`
2. Add route in `App.tsx`
3. Update navigation if needed
4. Add to TypeScript paths if using custom imports

### Adding New Component
1. Create in appropriate folder (`components/ui/` or `components/marketing/`)
2. Follow shadcn/ui patterns for UI components
3. Export from index file if creating a module
4. Add to Storybook if using component library

### Database Schema Changes
1. Modify schema in `shared/schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`
4. Update TypeScript types if needed

### Environment Variables
1. Add to `.env.example` with placeholder
2. Update `ENVIRONMENT_SETUP.md` documentation  
3. Add to Netlify/Vercel deployment settings
4. Use `import.meta.env.VITE_*` prefix for frontend

## Debugging

### React DevTools
- Install React Developer Tools browser extension
- Use for component inspection and state debugging
- Profile performance with React Profiler

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client/src"
    }
  ]
}
```

### Network Debugging
- Use browser DevTools Network tab
- Check Supabase requests in Network panel
- Monitor WebSocket connections for real-time features

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### Code Splitting
- Use React.lazy() for route-level splitting
- Dynamic imports for large components
- Split vendor bundles with Vite configuration

### Asset Optimization
- Compress images (use WebP format)
- Minimize SVG files
- Use appropriate image sizes for different screens

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**TypeScript Errors**
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"

# Check for type conflicts
npm run type-check
```

**Database Connection Issues**
- Verify Supabase credentials in `.env`
- Check network connectivity
- Ensure database is not paused (free tier)

**Authentication Issues**
- Check Supabase Auth configuration
- Verify OAuth app settings (Google/GitHub)
- Clear browser localStorage/cookies

### Getting Help
1. Check this documentation first
2. Search existing GitHub issues
3. Review Supabase documentation
4. Ask in team Slack/Discord
5. Create detailed GitHub issue

## Development Environment

### Recommended Settings

**.vscode/settings.json**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

**.vscode/extensions.json**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode", 
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens"
  ]
}
```

---

**Next Steps**: Once development setup is complete, see [DEPLOYMENT.md](DEPLOYMENT.md) for staging and production deployment.