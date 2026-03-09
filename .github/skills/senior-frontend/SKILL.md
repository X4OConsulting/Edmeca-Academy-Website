---
name: senior-frontend
description: 'Senior frontend engineering skill for the EdMeCa Academy platform. Use when: building portal tool components, marketing page sections, reviewing component architecture, auditing performance, enforcing accessibility, writing idiomatic TypeScript, applying design system patterns (shadcn/ui, Radix UI), implementing TanStack Query data fetching, managing error/loading states, or conducting frontend code reviews. Triggers on: "component", "frontend", "React", "TypeScript", "Tailwind", "accessibility", "a11y", "performance", "design system", "code review", "refactor", "portal tool", "dashboard", "query", "mutation".'
argument-hint: 'Describe the frontend task, component, or code area to review/build'
---

# Senior Frontend Engineering — EdMeCa Academy

## Scope
**React 18 · TypeScript 5.6 · Tailwind CSS 3 · shadcn/ui · Radix UI · Wouter · TanStack Query · React Hook Form + Zod · Vite 7 · Supabase client**

---

## Component Architecture

### Decision Tree
```
New UI need?
├── Already in shadcn/ui or Radix? → Compose from existing primitive
├── Variant of existing component? → Extend with CVA variants, don't duplicate
├── Shared across portal pages? → Put in client/src/components/portal/
├── Marketing section? → Put in client/src/components/sections/<PageName>/
├── Shared layout? → client/src/components/marketing/ (Header, Footer)
└── Primitive? → client/src/components/ui/ (shadcn managed — wrap, don't edit)
```

### Principles
- **Single responsibility**: one component, one concern. Split when a component exceeds ~150 lines.
- **Co-locate state**: keep state close to where it's used; lift only when two+ siblings share it.
- **Avoid prop drilling >2 levels**: introduce context or restructure.
- **Always wire error + loading states**: every `useQuery` must have `isLoading` → `<PageLoader>` and `isError` → `<PageError onRetry>`.

---

## TypeScript Standards

- **Prefer `type` over `interface`** for component props; use `interface` for extensible contracts (e.g. API shapes in `shared/schema.ts`).
- **No `any`**: if the type is unknown, use `unknown` and narrow it.
- **Explicit return types on hooks and utility functions** — component JSX return types are inferred.
- **Props destructured in signature**: `function BMCTool({ artifact, onSave }: BMCToolProps)`.

---

## Tailwind CSS Patterns

- Use `cn()` (from `@/lib/utils`) to merge classes conditionally — never string concatenation.
- **Mobile-first**: use `sm:`, `md:`, `lg:` breakpoints in that order.
- **Semantic tokens**: prefer `text-foreground`, `bg-background`, `text-primary`, `border-border` over hardcoded colors.
- **Dark mode**: use `dark:` variants for any component that appears in both themes.

```tsx
// Good
import { cn } from "@/lib/utils";
<div className={cn("rounded-lg border bg-card", isActive && "border-primary", className)} />
```

---

## TanStack Query Patterns

### Standard query setup
```tsx
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: queryKeys.artifacts.byType("bmc"),
  queryFn: () => artifactsService.getArtifactByType("bmc"),
  enabled: !!user,
  networkMode: "always",   // Required: fire even when navigator is offline
});

if (isLoading) return <PageLoader message="Loading..." />;
if (isError) return <PageError message="Could not load your work." onRetry={refetch} />;
```

### Standard mutation setup
```tsx
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data: unknown) => artifactsService.saveArtifact({ toolType: "bmc", content: data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.artifacts.all });
  },
  onError: (err) => {
    console.error("Save failed:", err);
    // Surface error to user — do not silently fail
  },
});
```

### Query key rules
- **ALWAYS** use the `queryKeys` factory from `client/src/lib/queryKeys.ts`.
- **NEVER** use raw string arrays outside of `queryKeys.ts`.

---

## Auth Patterns

```tsx
// Check auth in components
const { user, isLoading } = useAuth();
if (!user) return null; // or redirect — ProtectedRoute handles this at route level

// Portal routes are wrapped in ProtectedRoute in App.tsx — trust that
// Don't re-implement auth checks inside portal page components
```

---

## Error & Loading State Components

```tsx
// Always import from this path:
import { PageLoader, PageError } from "@/components/portal/PageStates";

// PageLoader — full-screen spinner
<PageLoader message="Loading your dashboard..." />

// PageError — full-screen error with retry
<PageError
  message="Could not load your work. Please check your connection."
  onRetry={refetch}
/>
// Note: PageError has a built-in 1.5s minimum spinner duration on retry
// to prevent flash when network fails instantly (offline scenario)
```

---

## shadcn/ui & Radix UI

- Use shadcn primitives for: `Button`, `Card`, `Dialog`, `Tabs`, `Accordion`, `Badge`, `Progress`, `Avatar`, `Toast`, `Tooltip`.
- Never modify files under `client/src/components/ui/` that are managed by shadcn — extend in a wrapper.
- Forward `ref` when wrapping Radix primitives.
- Do not override Radix keyboard navigation or ARIA attributes.

---

## Accessibility Checklist (every interactive component)

- [ ] Keyboard operable (Tab, Enter, Escape, arrow keys)
- [ ] Visible focus indicator (never `outline-none` without a replacement)
- [ ] ARIA roles/labels for non-semantic interactive elements
- [ ] Color contrast ≥ 4.5:1 (WCAG AA) for normal text
- [ ] `alt` text on all images — empty `alt=""` for decorative
- [ ] Dark mode: contrast holds in `.dark` theme too

---

## Forms (React Hook Form + Zod)

```tsx
const schema = z.object({ title: z.string().min(1, "Title is required") });
type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({ resolver: zodResolver(schema) });
```

- All schemas use **Zod** via `@hookform/resolvers/zod`.
- Use `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormMessage>` from shadcn for consistent layout.
- Errors must be surfaced as text — not color-only.

---

## Routing (Wouter)

- Use `<Link href="/path">` from wouter (not `<a>`).
- Programmatic nav: `const [, navigate] = useLocation()` → `navigate("/path")`.
- Active-link styling: `useRoute("/path")` returns `[isActive, params]`.

---

## Portal Tool Page Checklist

Before marking a portal tool feature ready:
- [ ] Route registered in `App.tsx` behind `<ProtectedRoute>` and `<ErrorBoundary>`
- [ ] `isLoading` → `<PageLoader>` and `isError` → `<PageError onRetry>` present
- [ ] `networkMode: "always"` on the query
- [ ] `queryKeys` factory used — no raw string arrays
- [ ] Mutation has `onError` handler surfaced to user
- [ ] No `console.log` debug statements
- [ ] No `any` types
- [ ] `npm run check` passes

---

## References
- [App.tsx — routes + auth guards](../../client/src/App.tsx)
- [queryKeys.ts — query key factory](../../client/src/lib/queryKeys.ts)
- [services.ts — Supabase data layer](../../client/src/lib/services.ts)
- [PageStates.tsx — PageLoader + PageError](../../client/src/components/portal/PageStates.tsx)
- [ErrorBoundary.tsx](../../client/src/components/portal/ErrorBoundary.tsx)
- [use-auth.ts](../../client/src/hooks/use-auth.ts)
- [utils.ts — cn()](../../client/src/lib/utils.ts)
