---
name: frontend-design
description: 'Frontend design system and visual language skill for the EdMeCa Academy platform. Use when: designing or styling new portal tool components or marketing sections, applying design tokens correctly, implementing responsive layouts, choosing typography, creating section archetypes (hero, card grid, feature split, CTA band), ensuring dark mode compatibility, or maintaining visual consistency across pages. Triggers on: "design", "style", "layout", "typography", "color", "token", "hero", "section", "card", "spacing", "visual", "responsive", "dark mode", "light mode", "gradient", "background", "icon", "grid", "consistent", "aesthetic", "portal UI".'
argument-hint: 'Describe the section or component to design (e.g. pricing card grid, portal tool empty state, hero with image overlay)'
---

# Frontend Design System — EdMeCa Academy

## Brand Identity

EdMeCa Academy is a **practical, accessible business education platform** for South African entrepreneurs. The visual language is professional, clean, educational, and trustworthy — with warm accents that convey approachability.

---

## Design Tokens

### Colors (via shadcn/ui CSS variables)

| Token | CSS Variable | Use |
|---|---|---|
| Primary (navy) | `hsl(var(--primary))` → `#1f3a6e` | CTAs, headings, brand identity |
| Primary foreground | `hsl(var(--primary-foreground))` → white | Text on primary bg |
| Background | `hsl(var(--background))` | Page background (light: white, dark: near-black) |
| Foreground | `hsl(var(--foreground))` | Primary text |
| Card | `hsl(var(--card))` | Card backgrounds |
| Muted | `hsl(var(--muted))` | Subtle backgrounds, disabled states |
| Muted foreground | `hsl(var(--muted-foreground))` | Secondary text, placeholders |
| Border | `hsl(var(--border))` | Dividers, card borders |
| Destructive | `hsl(var(--destructive))` | Error states, destructive actions |

**Tailwind utility equivalents:**
- `bg-primary`, `text-primary`, `border-primary`
- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-muted`, `text-muted-foreground`

**Dark mode:** All tokens switch via `.dark` class on `<html>`. Always provide `dark:` variants for non-token hardcoded styles.

### Typography

| Role | Tailwind Class | Notes |
|---|---|---|
| Page H1 | `text-3xl lg:text-4xl font-bold` | Marketing pages |
| Section H2 | `text-2xl lg:text-3xl font-bold` | Section headings |
| Card H3 | `text-xl font-semibold` | Tool cards, feature cards |
| Body | `text-base leading-relaxed` | Normal copy |
| Small / label | `text-sm text-muted-foreground` | Metadata, captions |
| Overline | `text-xs font-semibold uppercase tracking-wider` | Section labels |

---

## Layout System

```tsx
// Standard page wrapper (marketing)
<div className="max-w-7xl mx-auto px-6">

// Standard portal page wrapper
<div className="max-w-4xl mx-auto p-6 space-y-6">

// Section padding (marketing pages)
<section className="py-16 lg:py-24 bg-background">

// Section padding (lighter variant)
<section className="py-12 bg-muted/30">
```

### Common Grid Patterns
```tsx
// 2-col feature split (text + image / text + tool)
<div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

// 3-col card grid (tools, features)
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

// 4-col stats / quick-info
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
```

---

## Portal UI Archetypes

### 1. Tool Header
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">Tool Name</h1>
    <p className="text-sm text-muted-foreground mt-1">Brief description of what the tool does.</p>
  </div>
  <Button onClick={handleSave} disabled={mutation.isPending}>
    {mutation.isPending ? "Saving..." : "Save"}
  </Button>
</div>
```

### 2. Tool Card / Section Block
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      Block Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### 3. Empty State
```tsx
<div className="text-center py-16 text-muted-foreground">
  <Icon className="h-12 w-12 mx-auto mb-4 opacity-30" />
  <p className="font-medium">Nothing here yet</p>
  <p className="text-sm mt-1">Start by filling in the fields above.</p>
</div>
```

### 4. Progress Indicator (Learning Path style)
```tsx
<div className="flex items-center gap-3">
  {/* Done */}
  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
  {/* Next */}
  <div className="h-5 w-5 rounded-full border-2 border-primary shrink-0" />
  {/* Pending */}
  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
</div>
```

### 5. Status Badge
```tsx
// Uses Badge from shadcn/ui
<Badge variant="default">Complete</Badge>          // primary color
<Badge variant="secondary">In Progress</Badge>     // muted
<Badge variant="outline">Draft</Badge>             // outlined
<Badge variant="destructive">Error</Badge>         // red
```

---

## Marketing Section Archetypes

### 1. Hero (marketing homepage)
```tsx
<section className="relative min-h-[80vh] flex items-center bg-primary text-primary-foreground overflow-hidden">
  <div className="absolute inset-0 bg-black/20" />
  <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 mb-4 block">
        Overline
      </span>
      <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
        Headline with <span className="text-yellow-300">Accent</span>
      </h1>
      <p className="text-lg text-primary-foreground/80 mb-8">Supporting copy.</p>
      <Button size="lg" variant="secondary">Primary CTA</Button>
    </div>
  </div>
</section>
```

### 2. Feature Card Grid
```tsx
<section className="py-16 lg:py-24 bg-background">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">Section Heading</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">Supporting copy.</p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Card Title</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">Description.</p>
      </Card>
    </div>
  </div>
</section>
```

### 3. CTA Band
```tsx
<section className="py-16 bg-primary text-primary-foreground">
  <div className="max-w-3xl mx-auto px-6 text-center">
    <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
    <p className="text-primary-foreground/80 mb-8">Build your business model in minutes.</p>
    <Button size="lg" variant="secondary">Get Started</Button>
  </div>
</section>
```

---

## Icon Usage

- Source: **lucide-react** — always named import, never barrel (`import { X } from "lucide-react"`)
- Standard size in cards: `h-6 w-6` inside `w-12 h-12 bg-primary/10 rounded-xl`
- Inline with text: `h-4 w-4` with `className="inline mr-1.5 align-text-bottom"`
- Error / warning: `h-7 w-7 text-destructive`
- Success: `h-5 w-5 text-green-500`

---

## Dark Mode Checklist

For every component visible in portal (dark mode enabled):
- [ ] Background uses token (`bg-background`, `bg-card`, `bg-muted`) — not hardcoded white
- [ ] Text uses token (`text-foreground`, `text-muted-foreground`) — not hardcoded gray
- [ ] Border uses `border-border` — not hardcoded gray
- [ ] Accent/highlight has a `dark:` variant if hardcoded (e.g. `text-green-500 dark:text-green-400`)
- [ ] Check contrast ≥ 4.5:1 in dark theme (use browser DevTools)

---

## Responsive Design

Mobile-first. Define mobile layout, override with `lg:` for desktop:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
```

| Breakpoint | Prefix | Approx. width |
|---|---|---|
| Mobile | (none) | < 640px |
| Small | `sm:` | ≥ 640px |
| Medium | `md:` | ≥ 768px |
| Large | `lg:` | ≥ 1024px |

Portal tools must be fully usable at 375px (iPhone SE). Key rules:
- No horizontal overflow (`overflow-x-hidden` on problematic containers)
- Touch targets ≥ 44×44px
- BMC 9-block canvas: scroll horizontally on mobile, never clamp content

---

## Section Alternation (Marketing)

Never place two identical backgrounds in sequence:
`bg-background → bg-muted/30 → bg-background → bg-primary`

---

## Procedure: Design a New Portal Tool Component

1. **Choose the structure**: single-column form, split canvas + sidebar, multi-tab?
2. **Use Card** as the main container with `CardHeader` + `CardContent`.
3. **Apply loading/error first** — `PageLoader` and `PageError` before any render logic.
4. **Use shadcn form components** for all inputs: `<FormField>`, `<FormLabel>`, `<FormMessage>`.
5. **Add empty state** — if data is empty, show the empty state archetype, not a blank page.
6. **Dark mode**: verify all tokens — no hardcoded colors.
7. **Mobile**: test at 375px width.
8. **Run `npm run check`**: TypeScript must pass.

---

## References
- [client/src/index.css — CSS variables light + dark](../../client/src/index.css)
- [tailwind.config.ts — Tailwind theme](../../tailwind.config.ts)
- [components/portal/PageStates.tsx — PageLoader + PageError](../../client/src/components/portal/PageStates.tsx)
- [pages/portal/Dashboard.tsx — reference portal layout](../../client/src/pages/portal/Dashboard.tsx)
- [components/ui/ — shadcn primitives](../../client/src/components/ui/)
