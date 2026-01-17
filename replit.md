# EdMeCa Digital Academy - Business Framework Platform

## Overview

EdMeCa is a web application combining a public marketing website with an authenticated client portal. The platform makes MBA-level business frameworks accessible to entrepreneurs through hands-on delivery and AI-enabled tooling. The tagline is "From Framework to Execution to Evidence."

## Branding
- Logo: "EdMeCa" with alternating color styling (Ed=primary, Me=accent, Ca=primary)
- Tagline: "Digital Academy"
- Full brand: "EdMeCa Digital Academy"

## Recent Changes (January 2026)
- Updated branding to match design concept: EdMeCa with "Digital Academy" tagline
- Fixed nested anchor tag warnings by using `asChild` prop on Link components wrapping Buttons
- Improved auth guard in ProtectedRoute to show loading states during redirect
- Fixed BMCTool to handle new users (no existing artifact) gracefully - API returns null instead of 404
- Updated queryClient to use returnNull on 401 for graceful auth handling
- All marketing pages and portal features are fully functional and tested

**Target Audiences:**
- **Entrepreneurs:** Seeking business clarity, faster MVP development, and investor-ready pitches
- **Enterprise Development Programmes/Incubators/Accelerators:** Seeking measurable participant progression and streamlined M&E reporting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript using Vite as the build tool
- **Routing:** Wouter for client-side routing
- **Styling:** Tailwind CSS with shadcn/ui component library (New York style)
- **State Management:** TanStack Query for server state management
- **Path Aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework:** Express.js with TypeScript
- **API Pattern:** RESTful API routes under `/api/*`
- **Build System:** esbuild for server bundling, Vite for client
- **Development:** Hot module replacement via Vite middleware

### Authentication
- **Provider:** Replit Auth using OpenID Connect
- **Session Storage:** PostgreSQL-backed sessions via `connect-pg-simple`
- **Session Duration:** 7 days with secure, HTTP-only cookies
- **Protected Routes:** Middleware-based authentication check via `isAuthenticated`

### Database Layer
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema Location:** `shared/schema.ts`
- **Migrations:** Drizzle Kit with output to `./migrations`
- **Multi-tenant Design:** Organizations and cohorts support multiple user groups

### Data Models
- **Users:** Authentication users with profiles
- **Organizations:** Top-level tenant grouping
- **Cohorts:** Groups within organizations with invite codes
- **Artifacts:** User-generated tool outputs (BMC, SWOT, etc.)
- **Progress Entries:** Milestone tracking for M&E reporting
- **Contact Submissions:** Public form submissions

### Page Structure
- **Public Marketing:** Home, About, Solutions, Frameworks, Engagement, Contact
- **Protected Portal:** Dashboard, BMC Tool (and other framework tools)

## External Dependencies

### Database
- **PostgreSQL:** Primary database via `DATABASE_URL` environment variable
- **Connection:** Node-postgres (`pg`) with connection pooling

### Authentication
- **Replit OpenID Connect:** Uses `ISSUER_URL` and `REPL_ID` for OAuth flow
- **Session Secret:** Requires `SESSION_SECRET` environment variable

### UI Components
- **Radix UI:** Comprehensive primitive components for accessibility
- **shadcn/ui:** Pre-styled component library built on Radix
- **Lucide React:** Icon library

### Form Handling
- **React Hook Form:** Form state management
- **Zod:** Schema validation with `@hookform/resolvers`
- **drizzle-zod:** Database schema to Zod schema conversion

### Development Tools
- **Replit Plugins:** Runtime error overlay, cartographer, dev banner
- **TypeScript:** Strict mode with bundler module resolution