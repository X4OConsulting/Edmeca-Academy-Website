/**
 * EDMECA Academy — Task 4.5: Mobile Responsiveness Testing
 *
 * Runs under two viewport Playwright projects (both testMatch: '** /mobile/**'):
 *   mobile-375  — 375 × 812  (Android mobile / iPhone SE)
 *   tablet-768  — 768 × 1024 (iPad portrait)
 *
 * Subtasks covered:
 *   TC-4.5.1  375px viewport — marketing pages
 *   TC-4.5.2  375px viewport — portal tools (all 6 tools + dashboard)
 *   TC-4.5.3  375px — mobile nav / hamburger drawer
 *   TC-4.5.4  768px tablet viewport audit (marketing + portal)
 *
 * Strategy:
 *   - Tests that differ by viewport use page.viewportSize() for conditional
 *     assertions (e.g., hamburger visible on mobile, hidden on tablet).
 *   - Auth mock mirrors the UAT/cross-browser suites.
 *   - Horizontal overflow is detected by comparing scrollWidth vs clientWidth.
 */

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Auth mock constants (mirrors crossbrowser.spec.ts)
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
  refresh_token: 'mock-refresh-token-mobile',
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
      const accept = route.request().headers()['accept'] ?? '';
      if (method === 'GET' || method === 'HEAD') {
        if (accept.includes('application/vnd.pgrst.object+json')) {
          await route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116' }) });
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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Asserts no horizontal scroll exists (allows 2px for sub-pixel rendering). */
async function assertNoHorizontalOverflow(page: Page, label: string) {
  const isOverflowing = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
  expect(isOverflowing, `Horizontal overflow detected on "${label}"`).toBe(false);
}

// =============================================================================
// TC-4.5.1  375px viewport — marketing pages
// Runs under: mobile-375 only
// =============================================================================

test.describe('TC-4.5.1  375px viewport — marketing pages', () => {
  const marketingPages = [
    { path: '/',            label: 'Home' },
    { path: '/about',       label: 'About' },
    { path: '/solutions',   label: 'Solutions' },
    { path: '/contact',     label: 'Contact' },
    { path: '/frameworks',  label: 'Frameworks' },
    { path: '/engagement',  label: 'Engagement' },
  ];

  for (const { path, label } of marketingPages) {
    test(`${label} page — no horizontal overflow at 375px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'tablet-768', '375px-only test');

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      await assertNoHorizontalOverflow(page, label);
      await expect(page.locator('main, [role="main"], #root').first()).not.toBeEmpty();
    });
  }
});

// =============================================================================
// TC-4.5.2  375px viewport — portal tools (all 6 tools + dashboard)
// Runs under: mobile-375 only
// =============================================================================

test.describe('TC-4.5.2  375px viewport — portal tools', () => {
  const portalPages = [
    { path: '/portal',                    label: 'Dashboard' },
    { path: '/portal/tools/bmc',          label: 'BMC Tool' },
    { path: '/portal/tools/analysis',     label: 'SWOT/PESTLE Tool' },
    { path: '/portal/tools/value-prop',   label: 'Value Proposition Tool' },
    { path: '/portal/tools/pitch',        label: 'Pitch Builder Tool' },
    { path: '/portal/tools/progress',     label: 'Progress Tracker Tool' },
    { path: '/portal/tools/financials',   label: 'Financial Analysis Tool' },
    { path: '/portal/profile',            label: 'Profile Page' },
  ];

  for (const { path, label } of portalPages) {
    test(`${label} — no horizontal overflow at 375px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'tablet-768', '375px-only test');

      await setupMockAuth(page);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      await assertNoHorizontalOverflow(page, label);
      await expect(page.locator('main, [role="main"], #root').first()).not.toBeEmpty();
    });
  }
});

// =============================================================================
// TC-4.5.3  375px — header / mobile nav drawer
// Runs under: mobile-375 and tablet-768 (viewport-conditional assertions)
// =============================================================================

test.describe('TC-4.5.3  Header nav — viewport-appropriate controls visible', () => {
  test('hamburger button is visible at 375px; hidden at 768px', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewport = page.viewportSize();
    const isMobile = (viewport?.width ?? 0) < 768;

    if (isMobile) {
      // md:hidden → visible on mobile
      await expect(page.getByTestId('button-menu')).toBeVisible();
    } else {
      // md:hidden → not visible at tablet (>=768px)
      await expect(page.getByTestId('button-menu')).toBeHidden();
    }
  });

  test('desktop nav is hidden at 375px; visible at 768px', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const viewport = page.viewportSize();
    const isMobile = (viewport?.width ?? 0) < 768;

    // nav.hidden.md:flex — the hidden class makes it invisible below md breakpoint
    const desktopNav = page.locator('nav.hidden');
    if (isMobile) {
      await expect(desktopNav).toBeHidden();
    } else {
      // At 768px the md:flex kicks in so it's rendered (Tailwind md breakpoint = 768px)
      // Note: at exactly 768px the md: prefix applies, so nav should be visible
      await expect(desktopNav).toBeVisible();
    }
  });

  test('mobile nav drawer opens and shows CTA buttons', async ({ page }) => {
    // Skip on any viewport >= 768px (hamburger is md:hidden there)
    const width = page.viewportSize()?.width ?? 9999;
    test.skip(width >= 768, 'Hamburger not accessible at viewport >= 768px');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-menu').click();
    await expect(page.getByTestId('button-get-started-mobile')).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TC-4.5.4  768px tablet viewport audit
// Runs under: tablet-768 only
// =============================================================================

test.describe('TC-4.5.4  768px tablet viewport audit', () => {
  const auditPages = [
    { path: '/',           label: 'Home' },
    { path: '/about',      label: 'About' },
    { path: '/solutions',  label: 'Solutions' },
    { path: '/contact',    label: 'Contact' },
    { path: '/engagement', label: 'Engagement' },
    { path: '/frameworks', label: 'Frameworks' },
  ];

  for (const { path, label } of auditPages) {
    test(`${label} — no horizontal overflow at 768px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile-375', '768px-only test');

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      await assertNoHorizontalOverflow(page, label);
      await expect(page.locator('main, [role="main"], #root').first()).not.toBeEmpty();
    });
  }

  test('Portal dashboard — no overflow at 768px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-375', '768px-only test');

    await setupMockAuth(page);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    await assertNoHorizontalOverflow(page, 'Portal Dashboard 768px');
    await expect(page.getByTestId('text-user-name')).toBeVisible();
  });
});
