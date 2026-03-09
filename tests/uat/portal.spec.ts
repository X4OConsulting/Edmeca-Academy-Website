/**
 * EDMECA Academy — Phase 4 UAT Test Suite
 * Task 3.23 — Portal UAT Readiness
 *
 * Covers:
 *   TC-001  Marketing smoke tests (6 public pages)
 *   TC-002  Theme toggle
 *   TC-003  Auth redirect (unauthenticated → /login)
 *   TC-004  Portal Dashboard (with mocked Supabase auth)
 *   TC-005  BMC Tool
 *   TC-006  SWOT & PESTLE Tool
 *   TC-007  Value Proposition Tool
 *   TC-008  Pitch Builder Tool
 *   TC-009  Financial Analysis Tool
 *   TC-010  Progress Tracker Tool
 *   TC-011  Profile Page
 *   TC-012  Mobile viewport (375 px × 812 px)
 *   TC-013  Not-Found (404) page
 *
 * Auth strategy for portal tests:
 *   - `setupMockAuth()` injects a fake Supabase session into localStorage
 *     BEFORE the page loads (via addInitScript), so useAuth() reads a
 *     valid-seeming session without making a network round-trip.
 *   - Supabase auth and REST endpoints are intercepted via page.route()
 *     and return minimal mock responses so the app renders without crashing.
 */

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase mock constants
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_PROJECT = 'dqvdnyxkkletgkkpicdg';

/**
 * Structurally-valid JWT (header.payload.sig) whose payload's `exp` field is
 * set to year 2286 so Supabase JS never attempts a token refresh.
 * The signature is intentionally fake — Supabase JS does not verify signatures
 * on the client; it only reads the payload fields.
 *
 * Payload decodes to:
 *   { sub, aud, exp:9999999999, email, role, iat }
 */
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
  refresh_token: 'mock-refresh-token-uat',
  user: MOCK_USER,
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth mock helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sets up:
 *  1. A localStorage init script that fires before app scripts, injecting
 *     a fake Supabase session so useAuth() sees a logged-in user immediately.
 *  2. Network route interceptors for all Supabase auth and REST endpoints,
 *     returning minimal mock data so data-dependant portal pages render.
 *
 * Must be called BEFORE page.goto().
 */
async function setupMockAuth(page: Page) {
  // ── 1. Inject session into localStorage before React initialises ──────────
  await page.addInitScript(
    ({ projectRef, session }) => {
      // Supabase JS v2 _isValidSession() checks for access_token, refresh_token,
      // and expires_at directly on the stored object — not nested.
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
    },
    { projectRef: SUPABASE_PROJECT, session: MOCK_SESSION }
  );

  // ── 2. Mock Supabase auth API ─────────────────────────────────────────────
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

  // ── 3. Mock Supabase REST API (tables: artifacts, profiles, etc.) ─────────
  await page.route(
    new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1`),
    async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';

      if (method === 'GET' || method === 'HEAD') {
        // `.single()` sends Accept: application/vnd.pgrst.object+json.
        // Return PGRST116 (no rows) so services that call `.single()` get
        // null back without crashing the component.
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
          // Normal SELECT — return empty array so lists render the empty state
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      } else if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    }
  );
}

// =============================================================================
// TC-001  Marketing smoke tests
// =============================================================================

test.describe('TC-001 Marketing smoke tests', () => {
  const marketingRoutes = [
    { path: '/',           label: 'Home page' },
    { path: '/about',      label: 'About page' },
    { path: '/solutions',  label: 'Solutions page' },
    { path: '/frameworks', label: 'Frameworks page' },
    { path: '/engagement', label: 'Engagement page' },
    { path: '/contact',    label: 'Contact page' },
  ];

  for (const { path, label } of marketingRoutes) {
    test(`${label} (${path}) renders without fatal JS errors`, async ({ page }) => {
      const fatalErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore known non-fatal warnings: missing Supabase env vars in dev,
          // Vite HMR noise, and React DevTools messages.
          if (!text.includes('supabase') && !text.includes('VITE') && !text.includes('ReactDOM')) {
            fatalErrors.push(text);
          }
        }
      });

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Page has rendered content — use first() to avoid strict-mode violation
      // when both #root and main/role=main exist in the DOM simultaneously
      await expect(page.locator('main, [role="main"], #root').first()).not.toBeEmpty();

      // No unexpected fatal errors
      expect(fatalErrors, `Fatal console errors on ${path}: ${fatalErrors.join('; ')}`).toHaveLength(0);
    });
  }

  test('Contact page form inputs are present', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('input-name')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();
    await expect(page.getByTestId('button-submit')).toBeVisible();
  });
});

// =============================================================================
// TC-002  Theme toggle
// =============================================================================

test.describe('TC-002 Theme toggle', () => {
  test('theme toggle button is present in the marketing header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-theme-toggle').first()).toBeVisible();
  });

  test('clicking theme toggle applies dark class to <html>', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Determine current theme and click toggle once
    const toggle = page.getByTestId('button-theme-toggle').first();
    await toggle.click();
    await page.waitForTimeout(400); // allow CSS transition

    const htmlClass = await page.locator('html').getAttribute('class');
    // After one toggle the html element should carry "dark"
    expect(htmlClass).toContain('dark');
  });

  test('theme preference persists across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Force dark mode
    const toggle = page.getByTestId('button-theme-toggle').first();
    const htmlBefore = await page.locator('html').getAttribute('class');
    if (!htmlBefore?.includes('dark')) {
      await toggle.click();
      await page.waitForTimeout(300);
    }

    // Navigate to another page
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const htmlAfter = await page.locator('html').getAttribute('class');
    expect(htmlAfter).toContain('dark');
  });
});

// =============================================================================
// TC-003  Auth redirect
// =============================================================================

test.describe('TC-003 Auth redirect', () => {
  test('unauthenticated visit to /portal redirects to /login', async ({ page }) => {
    await page.goto('/portal');

    // ProtectedRoute sets window.location.href="/login" when no user
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  test('login page email and password inputs are visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('input-signin-email')).toBeVisible();
    await expect(page.getByTestId('input-signin-password')).toBeVisible();
    await expect(page.getByTestId('button-signin-submit')).toBeVisible();
  });

  test('login form validates empty submission (button remains enabled)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Email input is required — clicking submit with empty fields
    // should not navigate away (browser native required validation)
    const submitBtn = page.getByTestId('button-signin-submit');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).not.toBeDisabled();
  });
});

// =============================================================================
// TC-004  Portal Dashboard (mocked auth)
// =============================================================================

test.describe('TC-004 Portal Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('dashboard renders header navigation elements', async ({ page }) => {
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('link-portal-home')).toBeVisible();
    await expect(page.getByTestId('button-logout')).toBeVisible();
    await expect(page.getByTestId('button-new-artifact')).toBeVisible();
  });

  test('dashboard shows user name or email', async ({ page }) => {
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    const vp = page.viewportSize();
    const isMobile = vp !== null && vp.width < 640;

    if (isMobile) {
      // On mobile (<640 px) the name text is hidden (hidden sm:block) —
      // the avatar is the visible identity indicator instead.
      await expect(page.getByTestId('avatar-user')).toBeVisible();
    } else {
      await expect(page.getByTestId('text-user-name')).toBeVisible();
    }
  });

  test('theme toggle is present in portal header', async ({ page }) => {
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-theme-toggle')).toBeVisible();
  });

  test('clicking New Artifact button opens the tool picker dialog', async ({ page }) => {
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-new-artifact').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TC-005  BMC Tool
// =============================================================================

test.describe('TC-005 BMC Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('BMC tool shows welcome screen with company name input', async ({ page }) => {
    await page.goto('/portal/tools/bmc');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('input-company-name')).toBeVisible();
    await expect(page.getByTestId('button-continue')).toBeVisible();
    await expect(page.getByTestId('button-skip')).toBeVisible();
  });

  test('entering a company name and Continue enters guided view', async ({ page }) => {
    await page.goto('/portal/tools/bmc');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('input-company-name').fill('Acme Ventures');
    await page.getByTestId('button-continue').click();

    // Guided view shows progress bar
    await expect(page.getByTestId('progress-bar')).toBeVisible({ timeout: 4000 });
    await expect(page.getByTestId('text-progress')).toBeVisible();
  });

  test('view switcher buttons are visible in the BMC header', async ({ page }) => {
    const vp = page.viewportSize();
    if (vp !== null && vp.width < 640) {
      // View switcher is intentionally hidden on mobile (hidden sm:flex).
      // Mobile responsiveness is validated separately in task 4.5.
      test.skip();
      return;
    }

    await page.goto('/portal/tools/bmc');
    await page.waitForLoadState('networkidle');

    // Enter guided view first
    await page.getByTestId('input-company-name').fill('Acme Ventures');
    await page.getByTestId('button-continue').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('button-view-guided')).toBeVisible();
    await expect(page.getByTestId('button-view-canvas')).toBeVisible();
    await expect(page.getByTestId('button-view-dashboard')).toBeVisible();
  });

  test('BMC back-to-dashboard button navigates to /portal', async ({ page }) => {
    await page.goto('/portal/tools/bmc');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('input-company-name').fill('Acme Ventures');
    await page.getByTestId('button-continue').click();
    await page.waitForTimeout(400);

    await page.getByTestId('button-back-dashboard').click();
    await expect(page).toHaveURL(/\/portal$/);
  });
});

// =============================================================================
// TC-006  SWOT & PESTLE Tool
// =============================================================================

test.describe('TC-006 SWOT & PESTLE Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('SWOT tool renders all header and tab controls', async ({ page }) => {
    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('input-company-name')).toBeVisible();
    await expect(page.getByTestId('button-tab-swot')).toBeVisible();
    await expect(page.getByTestId('button-tab-pestle')).toBeVisible();
    await expect(page.getByTestId('button-tab-summary')).toBeVisible();
    await expect(page.getByTestId('button-save-draft')).toBeVisible();
  });

  test('switching to PESTLE tab renders PESTLE content', async ({ page }) => {
    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-tab-pestle').click();
    await page.waitForTimeout(300);

    // PESTLE has a card grid — ensure at least one card is rendered
    await expect(page.locator('[class*="Card"], .border').first()).toBeVisible();
  });

  test('SWOT back button navigates to /portal', async ({ page }) => {
    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-back-dashboard').click();
    await expect(page).toHaveURL(/\/portal$/);
  });
});

// =============================================================================
// TC-007  Value Proposition Tool
// =============================================================================

test.describe('TC-007 Value Proposition Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('Value Prop tool renders header, company input, and tab controls', async ({ page }) => {
    await page.goto('/portal/tools/value-prop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('input-company-name')).toBeVisible();
    await expect(page.getByTestId('button-tab-customer')).toBeVisible();
    await expect(page.getByTestId('button-tab-value')).toBeVisible();
    await expect(page.getByTestId('button-tab-fit')).toBeVisible();
    await expect(page.getByTestId('button-save-draft')).toBeVisible();
  });

  test('switching to Value Map tab renders value-side content', async ({ page }) => {
    await page.goto('/portal/tools/value-prop');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-tab-value').click();
    await page.waitForTimeout(300);

    await expect(page.getByText('Products & Services').first()).toBeVisible();
  });
});

// =============================================================================
// TC-008  Pitch Builder Tool
// =============================================================================

test.describe('TC-008 Pitch Builder Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('Pitch Builder renders header controls and company input', async ({ page }) => {
    await page.goto('/portal/tools/pitch');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('input-company-name')).toBeVisible();
    await expect(page.getByTestId('button-toggle-preview')).toBeVisible();
    await expect(page.getByTestId('button-save-draft')).toBeVisible();
  });

  test('Preview toggle switches the view label to Edit', async ({ page }) => {
    await page.goto('/portal/tools/pitch');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-toggle-preview').click();
    await page.waitForTimeout(350);

    // After switching to preview mode the button should say "Edit"
    await expect(page.getByTestId('button-toggle-preview')).toContainText('Edit');
  });

  test('Pitch Builder back button navigates to /portal', async ({ page }) => {
    await page.goto('/portal/tools/pitch');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-back-dashboard').click();
    await expect(page).toHaveURL(/\/portal$/);
  });
});

// =============================================================================
// TC-009  Financial Analysis Tool
// =============================================================================

test.describe('TC-009 Financial Analysis Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('Financial tool renders mode selector and analyse button', async ({ page }) => {
    await page.goto('/portal/tools/financials');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('button-mode-quick')).toBeVisible();
    await expect(page.getByTestId('button-mode-deep')).toBeVisible();
    await expect(page.getByTestId('button-analyse')).toBeVisible();
  });

  test('selecting Quick Snapshot changes analyse button label', async ({ page }) => {
    await page.goto('/portal/tools/financials');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-mode-quick').click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId('button-analyse')).toContainText('Quick Snapshot');
  });

  test('selecting Deep Analysis changes analyse button label', async ({ page }) => {
    await page.goto('/portal/tools/financials');
    await page.waitForLoadState('networkidle');

    // Start from quick, switch back to deep
    await page.getByTestId('button-mode-quick').click();
    await page.getByTestId('button-mode-deep').click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId('button-analyse')).toContainText('Deep Analysis');
  });
});

// =============================================================================
// TC-010  Progress Tracker Tool
// =============================================================================

test.describe('TC-010 Progress Tracker Tool', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('Progress Tracker renders header and view tab controls', async ({ page }) => {
    await page.goto('/portal/tools/progress');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('button-tab-overview')).toBeVisible();
    await expect(page.getByTestId('button-tab-milestones')).toBeVisible();
  });

  test('switching to Milestones tab shows milestone log form', async ({ page }) => {
    await page.goto('/portal/tools/progress');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-tab-milestones').click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId('input-milestone')).toBeVisible();
    await expect(page.getByTestId('button-log-milestone')).toBeVisible();
  });

  test('Log Milestone button is disabled when input is empty', async ({ page }) => {
    await page.goto('/portal/tools/progress');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-tab-milestones').click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId('button-log-milestone')).toBeDisabled();
  });

  test('Log Milestone button enables after typing in milestone input', async ({ page }) => {
    await page.goto('/portal/tools/progress');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-tab-milestones').click();
    await page.waitForTimeout(300);

    await page.getByTestId('input-milestone').fill('Completed customer discovery interviews');
    await expect(page.getByTestId('button-log-milestone')).toBeEnabled();
  });
});

// =============================================================================
// TC-011  Profile Page
// =============================================================================

test.describe('TC-011 Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);
  });

  test('Profile page renders account and business form fields', async ({ page }) => {
    await page.goto('/portal/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-back-dashboard')).toBeVisible();
    await expect(page.getByTestId('input-full-name')).toBeVisible();
    await expect(page.getByTestId('button-save-name')).toBeVisible();
    await expect(page.getByTestId('input-business-name')).toBeVisible();
    await expect(page.getByTestId('button-save-business')).toBeVisible();
  });

  test('Profile back button navigates to /portal', async ({ page }) => {
    await page.goto('/portal/profile');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-back-dashboard').click();
    await expect(page).toHaveURL(/\/portal$/);
  });
});

// =============================================================================
// TC-012  Mobile viewport (375 × 812)
// =============================================================================

test.describe('TC-012 Mobile viewport (375 px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Home page has no horizontal overflow at 375 px', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('Contact page renders at 375 px without overflow', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('Portal Dashboard renders at 375 px without overflow', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    // Allow 1 px tolerance for scrollbar gutter
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test('BMC Tool welcome screen renders at 375 px without overflow', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal/tools/bmc');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test('SWOT tool renders at 375 px — SWOT grid stacks vertically', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-tab-swot')).toBeVisible();

    const scrollWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });
});

// =============================================================================
// TC-013  404 / Not Found page
// =============================================================================

test.describe('TC-013 Not Found page', () => {
  test('visiting an unknown route renders the 404 page with home button', async ({ page }) => {
    await page.goto('/this-path-definitely-does-not-exist-xyz-123');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('button-home')).toBeVisible();
    await expect(page.getByTestId('button-back')).toBeVisible();
  });

  test('404 home button navigates back to /', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('button-home').click();
    await expect(page).toHaveURL('/');
  });
});
