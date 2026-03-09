---
name: design-token-audit
description: 'Search all TSX/CSS files for hardcoded hex or rgb colors and replace them with the correct EdMeCa design tokens or Tailwind semantic tokens.'
---

Audit the entire codebase for hardcoded colors and replace them with the correct design tokens.

## Step 1 — Find hardcoded colors

Search for all occurrences of:
- Hex colors: `#[0-9a-fA-F]{3,8}` in `.tsx`, `.ts`, `.css` files
- RGB/RGBA: `rgba?\(` in the same files
- Inline style hex values: `style={{ color: "#...` or `style={{ background: "#...`

**Known safe exceptions — do NOT flag these:**
- Color values inside `tailwind.config.ts` — those ARE the token definitions
- Color values inside `client/src/index.css` inside `:root {}` or `.dark {}` — those ARE the CSS variable definitions
- `#1f3a6e` used in Supabase email templates (outside codebase)
- Hex values inside SVG content strings in `style={{ backgroundImage: ... }}` where Tailwind utilities cannot be used (add a comment explaining why)

## Step 2 — Map to the correct token

| Hardcoded value | Correct Tailwind / CSS var replacement |
|---|---|
| `#1f3a6e` | `text-primary` / `bg-primary` / `border-primary` (EdMeCa navy) |
| `#ffffff` / `#fff` | `text-white` / `bg-white` |
| `#000000` / `#000` | `text-black` / `bg-black` |
| `#f3f4f6` gray-100 | `bg-gray-100` |
| Any gray shade | Use Tailwind gray scale: `gray-50` through `gray-950` |
| Any slate/neutral | Use Tailwind `slate-*` or `neutral-*` equivalents |
| Opacity variants | Use Tailwind slash syntax: `rgba(31, 58, 110, 0.8)` → `bg-primary/80` |

For dark mode variants, ensure both light and dark CSS variables are set in `client/src/index.css`:
- Light: `:root { --primary: ... }`
- Dark: `.dark { --primary: ... }`

## Step 3 — Apply fixes

For each violation found:
1. Replace inline hex/RGB in `className` strings with the correct Tailwind / shadcn token
2. For `style` prop colors that CAN be replaced (solid fills, text colors), move them to `className` with the token
3. For `style` prop gradient/backgroundImage strings that cannot use Tailwind utilities, keep the hex but add a comment: `{/* EdMeCa navy: cannot use Tailwind token in backgroundImage string */}`

## Step 4 — Verify dark mode
For every changed element, confirm:
- The Tailwind token resolves correctly in both light and dark mode
- Contrast ≥ 4.5:1 in both themes (WCAG 1.4.3)

## Step 5 — Verify build
```sh
npm run check   # TypeScript must pass
npm run build   # Build must succeed; spot-check in browser
```

## Quality Checklist
- [ ] No bare hex/RGB in `className` strings
- [ ] No `style={{ color: "#..." }}` unless backgroundImage or other non-tokenizable property
- [ ] All exceptions are commented explaining why the hex is intentional
- [ ] Dark mode contrast verified visually
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds
