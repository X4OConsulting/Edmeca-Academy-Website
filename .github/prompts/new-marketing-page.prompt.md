---
name: new-marketing-page
description: 'Scaffold a new marketing page with route, section files, Header/Footer layout, and correct EdMeCa branding.'
argument-hint: 'Page name (e.g. Courses, About, Pricing, Blog)'
---

Create a new marketing page named **${input:pageName}** for the EdMeCa Academy site.

## Steps

### 1. Create the page file
Create `client/src/pages/${input:pageName}.tsx`:
- The `MarketingLayout` (Header + Footer) is applied via the route in `App.tsx` — do NOT wrap the page in it manually
- Default export a React component named `${input:pageName}`
- TypeScript: no `any`, props typed with `type`

```tsx
// client/src/pages/${input:pageName}.tsx
export default function ${input:pageName}() {
  return (
    <main>
      {/* Import and render section components here */}
    </main>
  );
}
```

### 2. Register the route
In `client/src/App.tsx`, add the route inside the marketing section (outside `<ProtectedRoute>`):
```tsx
import ${input:pageName} from "@/pages/${input:pageName}";
// Inside <Switch>:
<Route path="/${input:pageName:toLowerCase}" component={${input:pageName}} />
```

If the page requires auth (e.g. a gated resource page), wrap in `<ProtectedRoute>` and `<ErrorBoundary>`.

### 3. Create section components
For each logical section of the page, create a file under:
`client/src/components/sections/${input:pageName}/`

Name them descriptively: `HeroSection.tsx`, `FeatureGrid.tsx`, `CTABand.tsx`, etc.

### 4. Add to navigation (if public-facing)
Check `client/src/components/marketing/Header.tsx` and add a nav entry if the page should appear in the main nav.

### 5. Type-check
```sh
npm run check
```

## Quality Checklist
- [ ] Route registered in `App.tsx`
- [ ] Marketing layout (Header + Footer) applied via route wrapper — page does not manage it directly
- [ ] All colors use Tailwind utilities or CSS variables (`text-primary`, `bg-background`, etc.) — no hardcoded hex
- [ ] Keyboard accessible (all interactive elements focusable, visible focus indicators)
- [ ] No `any` types
- [ ] `npm run check` passes
