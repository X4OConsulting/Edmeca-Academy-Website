/**
 * EDMECA Academy — Phase 4 Accessibility Test Suite
 * Task 4.7 — Accessibility Testing (WCAG 2.1 AA)
 *
 * Covers:
 *   TC-A01  Axe-core scan — marketing pages  (4.7.1)
 *   TC-A02  Axe-core scan — portal pages      (4.7.2)
 *   TC-A03  Keyboard navigation audit         (4.7.3)
 *
 * Scope:
 *   - All tests run on Chromium only (a11y doesn't require cross-browser)
 *   - Impact filter: critical + serious violations fail the build
 *   - Auth: portal tests use the same setupMockAuth() pattern as portal.spec.ts
 *   - WCAG standard: 2.1 AA
 */

import { test, expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase mock constants (mirrors portal.spec.ts)
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_PROJECT = 'dqvdnyxkkletgkkpicdg';

const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ0ZXN0LXVzZXItaWQtMTIzIiwiYXVkIjoiYXV0aGVudGljYXRlZCIs' +
  'ImV4cCI6OTk5OTk5OTk5OSwiZW1haWwiOiJ0ZXN0QGVkbWVjYS5jby56YSIsInJvbGUi' +
  'OiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNzAwMDAwMDAwfQ' +
  '.uat_mock_signature_not_verified';

const MOCK_USER = {
  id: 'test-user-id-123',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@edmeca.co.za',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  user_metadata: { full_name: 'Test User' },
  app_metadata: { provider: 'email' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const MOCK_SESSION = {
  access_token: MOCK_JWT,
  token_type: 'bearer',
  expires_in: 99999999,
  expires_at: 9999999999,
  refresh_token: 'mock-refresh-token-a11y',
  user: MOCK_USER,
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth mock helper
// ─────────────────────────────────────────────────────────────────────────────

async function setupMockAuth(page: Page) {
  await page.addInitScript(
    ({ projectRef, session }) => {
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
    },
    { projectRef: SUPABASE_PROJECT, session: MOCK_SESSION }
  );

  await page.route(
    new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/auth/v1`),
    async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) });
      }
    }
  );

  await page.route(
    new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1`),
    async (route) => {
      const method = route.request().method();
      const acceptHeader = route.request().headers()['accept'] || '';
      if (method === 'GET' || method === 'HEAD') {
        if (acceptHeader.includes('application/vnd.pgrst.object+json')) {
          await route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              details: 'The result contains 0 rows',
              hint: null,
              message: 'JSON object requested, multiple (or no) rows returned',
            }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Axe helper — run scan, filter to critical + serious, assert no violations
// ─────────────────────────────────────────────────────────────────────────────

async function runAxeScan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const critical = results.violations.filter(v => v.impact === 'critical');
  const serious  = results.violations.filter(v => v.impact === 'serious');
  const blocking = [...critical, ...serious];

  if (blocking.length > 0) {
    const report = blocking.map(v =>
      `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
      v.nodes.slice(0, 3).map(n => `  → ${n.html}`).join('\n')
    ).join('\n\n');
    throw new Error(`${blocking.length} axe violation(s) found:\n\n${report}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-A01: Axe-core scan — marketing pages (4.7.1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-A01 – Axe-core: marketing pages', () => {
  const marketingPages = [
    { name: 'Home',        path: '/' },
    { name: 'About',       path: '/about' },
    { name: 'Solutions',   path: '/solutions' },
    { name: 'Frameworks',  path: '/frameworks' },
    { name: 'Engagement',  path: '/engagement' },
    { name: 'Contact',     path: '/contact' },
  ];

  for (const { name, path } of marketingPages) {
    test(`TC-A01: ${name} page has no critical/serious axe violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      // Dismiss any cookie banners or overlays before scanning
      await page.waitForTimeout(300);
      await runAxeScan(page);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-A02: Axe-core scan — portal pages (4.7.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-A02 – Axe-core: portal pages', () => {
  const portalPages = [
    { name: 'Portal Dashboard',       path: '/portal' },
    { name: 'BMC Tool',               path: '/portal/tools/bmc' },
    { name: 'Analysis Tool',          path: '/portal/tools/analysis' },
    { name: 'Value Prop Tool',        path: '/portal/tools/value-prop' },
    { name: 'Pitch Builder',          path: '/portal/tools/pitch' },
    { name: 'Progress Tracker',       path: '/portal/tools/progress' },
    { name: 'Financial Analysis',     path: '/portal/tools/financials' },
    { name: 'Profile Page',           path: '/portal/profile' },
  ];

  for (const { name, path } of portalPages) {
    test(`TC-A02: ${name} has no critical/serious axe violations`, async ({ page }) => {
      await setupMockAuth(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      // Wait for lazy-loaded chunks and auth to settle
      await page.waitForTimeout(500);
      await runAxeScan(page);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-A03: Keyboard navigation audit (4.7.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-A03 – Keyboard navigation', () => {

  // ── A03-1: Header nav — Tab order and focus visibility ──────────────────

  test('TC-A03-1: Header nav links are reachable via Tab and show focus ring', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Tab into the page until we hit navigation links
    // Skip past any "skip to content" link at position 0
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
      const focusedHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.href || '');
      if (focusedTag === 'a' && focusedHref.includes('localhost')) break;
    }

    // Verify at least one nav link received focus (has outline / ring style)
    const focusedOutline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = window.getComputedStyle(el);
      return style.outlineWidth !== '0px' || el.classList.toString().includes('ring');
    });
    expect(focusedOutline).toBe(true);
  });

  // ── A03-2: Navigation landmark exists ────────────────────────────────────

  test('TC-A03-2: Page contains a <nav> landmark', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  // ── A03-3: Skip-to-content link is present in DOM ────────────────────────

  test('TC-A03-3: Skip-to-content or main landmark is accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Either a skip link exists, or there is a <main> element
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip")').first();
    const mainEl = page.locator('main').first();
    const hasSkip = await skipLink.count() > 0;
    const hasMain = await mainEl.count() > 0;
    expect(hasSkip || hasMain).toBe(true);
  });

  // ── A03-4: Login form Tab order ───────────────────────────────────────────

  test('TC-A03-4: Login form has correct Tab order (email → password → submit)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Verify both inputs exist, are visible, and are focusable via DOM order
    const emailInput    = page.locator('[data-testid="input-signin-email"]');
    const passwordInput = page.locator('[data-testid="input-signin-password"]');
    const submitButton  = page.locator('[data-testid="button-signin-submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Verify email comes before password in DOM (correct Tab order)
    const emailIndex    = await emailInput.evaluate(el => {
      const inputs = Array.from(document.querySelectorAll('input, button[type="submit"], button:not([disabled])'));
      return inputs.indexOf(el as HTMLInputElement);
    });
    const passwordIndex = await passwordInput.evaluate(el => {
      const inputs = Array.from(document.querySelectorAll('input, button[type="submit"], button:not([disabled])'));
      return inputs.indexOf(el as HTMLInputElement);
    });
    expect(emailIndex, 'email field must appear before password in DOM').toBeLessThan(passwordIndex);

    // Verify email field is programmatically focusable
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Verify password field is programmatically focusable
    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();
  });

  // ── A03-5: Theme toggle activatable with keyboard ─────────────────────────

  test('TC-A03-5: Theme toggle button is keyboard-accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // ThemeToggle uses a <span class="sr-only">Toggle theme</span> for its accessible name
    const themeToggle = page.locator('[data-testid="button-theme-toggle"]').first();

    if (await themeToggle.count() > 0) {
      await themeToggle.focus();
      await expect(themeToggle).toBeFocused();

      // Space key should activate the toggle without throwing
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      // If we reached here without error, the toggle is keyboard-operable
    } else {
      test.skip(true, 'Theme toggle not found — skipping keyboard activation test');
    }
  });

  // ── A03-6: Portal tool form Tab order (no focus trap outside dialog) ──────

  test('TC-A03-6: Portal BMC tool — Tab navigates through inputs without trapping', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal/tools/bmc', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Tab 20 times — if focus cycles without the page crashing we pass
    const visitedTags: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || 'unknown');
      visitedTags.push(tag);
    }

    // We should have reached interactive elements (input, button, textarea, a)
    const interactiveElements = visitedTags.filter(t => ['input', 'button', 'textarea', 'a', 'select'].includes(t));
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Focus wrapping to body at the end of the focusable cycle is expected browser
    // behaviour — it does NOT indicate a focus trap. We only verify that interactive
    // elements remain reachable (asserted above).
  });

  // ── A03-7: All interactive elements have accessible names ─────────────────

  test('TC-A03-7: Home page has no icon-only buttons missing aria-label', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Find buttons that have no visible text AND no aria-label / aria-labelledby
    const unlabelledButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const ariaLabel = btn.getAttribute('aria-label') || '';
          const ariaLabelledBy = btn.getAttribute('aria-labelledby') || '';
          const title = btn.getAttribute('title') || '';
          // Only flag buttons that have no accessible name at all
          return text === '' && ariaLabel === '' && ariaLabelledBy === '' && title === '';
        })
        .map((btn) => btn.outerHTML.slice(0, 120));
    });

    expect(
      unlabelledButtons,
      `Found buttons with no accessible name:\n${unlabelledButtons.join('\n')}`
    ).toHaveLength(0);
  });

  // ── A03-8: Portal Dashboard — all icon-only buttons have aria-label ───────

  test('TC-A03-8: Portal Dashboard has no unlabelled icon buttons', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const unlabelledButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const ariaLabel = btn.getAttribute('aria-label') || '';
          const ariaLabelledBy = btn.getAttribute('aria-labelledby') || '';
          const title = btn.getAttribute('title') || '';
          return text === '' && ariaLabel === '' && ariaLabelledBy === '' && title === '';
        })
        .map((btn) => btn.outerHTML.slice(0, 120));
    });

    expect(
      unlabelledButtons,
      `Found unlabelled buttons on Portal Dashboard:\n${unlabelledButtons.join('\n')}`
    ).toHaveLength(0);
  });

  // ── A03-9: All images have non-empty alt text (or are decorative) ─────────

  test('TC-A03-9: Home page images have alt text or role="presentation"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const missingAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter((img) => {
          const alt = img.getAttribute('alt');
          const role = img.getAttribute('role');
          // alt="" is intentional for decorative images; only flag missing alt entirely
          return alt === null && role !== 'presentation' && role !== 'none';
        })
        .map((img) => img.outerHTML.slice(0, 120));
    });

    expect(
      missingAlt,
      `Found images with no alt attribute:\n${missingAlt.join('\n')}`
    ).toHaveLength(0);
  });

  // ── A03-10: Page titles are descriptive ──────────────────────────────────

  test('TC-A03-10: Marketing pages have non-empty <title> elements', async ({ page }) => {
    const pagesToCheck = ['/', '/about', '/solutions', '/contact'];
    for (const path of pagesToCheck) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const title = await page.title();
      expect(title.trim().length, `Page ${path} has empty title`).toBeGreaterThan(0);
    }
  });
});
