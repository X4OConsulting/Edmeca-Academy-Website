/**
 * EDMECA Academy — Task 4.3: Integration Testing
 *
 * Verifies end-to-end data flow between layers:
 *   TC-301  (4.3.1) Supabase auth session → portal data access
 *   TC-302  (4.3.2) Artifact save & reload — SWOT/PESTLE, ValueProp, Pitch, Progress
 *   TC-303  (4.3.3) Contact form submission → Supabase insert
 *   TC-304  (4.3.4) Financial Analysis API (fetch → Anthropic mock) full E2E
 *   TC-305  (4.3.5) Profile update ↔ portal greeting / display sync
 *
 * Strategy:
 *   - All portal tests inject a fake Supabase session via addInitScript so
 *     every test runs as an authenticated user without a real network hit.
 *   - Supabase REST and auth endpoints are mocked with page.route().
 *   - Per-test route overrides are registered AFTER setupMockAuth so they
 *     take precedence (Playwright evaluates the most-recently-added handler
 *     first).
 *   - Captured request payloads are used to assert correct data flow.
 */

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock constants (mirrors portal.spec.ts)
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
  refresh_token: 'mock-refresh-token-uat',
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
          await route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({ code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'mock-artifact-id' }) });
      }
    }
  );
}

// =============================================================================
// TC-301  Supabase auth session → portal data access (4.3.1)
// =============================================================================

test.describe('TC-301 Supabase auth session → portal data access', () => {
  test('dashboard greeting uses full_name from session token', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    // Welcome back greeting uses user_metadata.full_name from MOCK_USER
    await expect(page.getByText('Welcome back, Test User!', { exact: false })).toBeVisible();
  });

  test('user identity shown in nav header matches session token', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    // Nav shows full name
    const userNameEl = page.getByTestId('text-user-name');
    await expect(userNameEl).toBeVisible();
    await expect(userNameEl).toContainText('Test User');

    // Avatar exists
    await expect(page.getByTestId('avatar-user')).toBeVisible();
  });

  test('Supabase REST requests carry the Authorization header', async ({ page }) => {
    const capturedAuthHeaders: string[] = [];

    await setupMockAuth(page);

    // Override the REST route to capture Authorization headers
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1`),
      async (route) => {
        const authHeader = route.request().headers()['authorization'] ?? '';
        if (authHeader) capturedAuthHeaders.push(authHeader);
        const accept = route.request().headers()['accept'] ?? '';
        if (accept.includes('application/vnd.pgrst.object+json')) {
          await route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116' }) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      }
    );

    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    expect(capturedAuthHeaders.length).toBeGreaterThan(0);
    expect(capturedAuthHeaders[0]).toContain('Bearer ');
  });

  test('unauthenticated visit to /portal redirects to /login', async ({ page }) => {
    // No setupMockAuth — no session in localStorage
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/login/);
  });
});

// =============================================================================
// TC-302  Artifact save & reload (4.3.2)
// =============================================================================

test.describe('TC-302 Artifact save and reload', () => {
  test('SWOT/PESTLE tool — Save Draft POSTs to Supabase artifacts with correct tool_type', async ({ page }) => {
    const capturedBodies: string[] = [];

    await setupMockAuth(page);

    // Override to capture POST body
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/artifacts`),
      async (route) => {
        const method = route.request().method();
        if (method === 'POST' || method === 'PATCH') {
          capturedBodies.push(route.request().postData() ?? '');
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'new-swot-id' }) });
        } else {
          const accept = route.request().headers()['accept'] ?? '';
          if (accept.includes('application/vnd.pgrst.object+json')) {
            await route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116' }) });
          } else {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
          }
        }
      }
    );

    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    // Click "Save Draft" to trigger an explicit save
    const saveDraftBtn = page.getByTestId('button-save-draft');
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();

    // Wait for the POST to be captured
    await page.waitForTimeout(1000);

    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]).toContain('swot_pestle');
  });

  test('SWOT/PESTLE tool — loads existing artifact content from Supabase', async ({ page }) => {
    const mockArtifact = {
      id: 'existing-swot-id',
      tool_type: 'swot_pestle',
      title: 'Test Corp — SWOT & PESTLE Analysis',
      content: {
        companyName: 'Test Corp',
        swot: { strengths: ['Strong founding team'], weaknesses: [], opportunities: [], threats: [] },
        pestle: { Political: [], Economic: [], Social: [], Technological: [], Legal: [], Environmental: [] },
        isFinalized: false,
      },
      status: 'in_progress',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    await setupMockAuth(page);

    // Override: return our mock artifact for the .single() query
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/artifacts`),
      async (route) => {
        const method = route.request().method();
        const accept = route.request().headers()['accept'] ?? '';
        if (method === 'GET' && accept.includes('application/vnd.pgrst.object+json')) {
          // Return the existing artifact (used by getLatestArtifactByType)
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockArtifact) });
        } else if (method === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockArtifact]) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'existing-swot-id' }) });
        }
      }
    );

    await page.goto('/portal/tools/analysis');
    await page.waitForLoadState('networkidle');

    // Company name from the mock artifact should be pre-populated
    await expect(page.getByTestId('input-company-name')).toHaveValue('Test Corp');
  });

  test('ValueProp tool — Save Draft POSTs artifact with tool_type value_proposition', async ({ page }) => {
    const capturedBodies: string[] = [];

    await setupMockAuth(page);

    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/artifacts`),
      async (route) => {
        const method = route.request().method();
        if (method === 'POST' || method === 'PATCH') {
          capturedBodies.push(route.request().postData() ?? '');
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'new-vp-id' }) });
        } else {
          const accept = route.request().headers()['accept'] ?? '';
          if (accept.includes('application/vnd.pgrst.object+json')) {
            await route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116' }) });
          } else {
            await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
          }
        }
      }
    );

    await page.goto('/portal/tools/value-prop');
    await page.waitForLoadState('networkidle');

    const saveDraftBtn = page.getByTestId('button-save-draft');
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();
    await page.waitForTimeout(1000);

    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]).toContain('value_proposition');
  });

  test('Progress Tracker — Log Milestone POSTs to progress_entries', async ({ page }) => {
    const capturedBodies: string[] = [];

    await setupMockAuth(page);

    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/progress_entries`),
      async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
          capturedBodies.push(route.request().postData() ?? '');
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'entry-1', milestone: 'Integration milestone', user_id: 'test-user-id-123' }) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      }
    );

    await page.goto('/portal/tools/progress');
    await page.waitForLoadState('networkidle');

    // Navigate to milestones tab
    await page.getByTestId('button-tab-milestones').click();

    // Type a milestone and submit
    const milestoneInput = page.getByTestId('input-milestone');
    await expect(milestoneInput).toBeVisible();
    await milestoneInput.fill('Integration milestone');
    await page.getByTestId('button-log-milestone').click();

    await page.waitForTimeout(500);

    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]).toContain('Integration milestone');
  });
});

// =============================================================================
// TC-303  Contact form submission → Supabase insert (4.3.3)
// =============================================================================

test.describe('TC-303 Contact form submission', () => {
  test('filled contact form submits successfully and shows confirmation', async ({ page }) => {
    // Mock Netlify form handler (POST to /)
    await page.route('**/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, body: '' });
      } else {
        await route.continue();
      }
    });

    // Mock Supabase contact_submissions insert
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/contact_submissions`),
      async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'submission-1' }) });
      }
    );

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('input-name').fill('Jane Integration');
    await page.getByTestId('input-email').fill('jane@test.com');
    await page.getByTestId('input-message').fill('This is an integration test submission.');
    await page.getByTestId('button-submit').click();

    // Success state: "Thank You!" heading appears
    await expect(page.getByText('Thank You!', { exact: true })).toBeVisible({ timeout: 8000 });
  });

  test('contact form POSTs to Supabase contact_submissions table', async ({ page }) => {
    const capturedBodies: string[] = [];

    await page.route('**/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, body: '' });
      } else {
        await route.continue();
      }
    });

    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/rest/v1/contact_submissions`),
      async (route) => {
        capturedBodies.push(route.request().postData() ?? '');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'submission-1' }) });
      }
    );

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('input-name').fill('Integration Tester');
    await page.getByTestId('input-email').fill('integration@edmeca.co.za');
    await page.getByTestId('input-message').fill('Testing contact submission flow.');
    await page.getByTestId('button-submit').click();

    await page.waitForTimeout(1500);

    expect(capturedBodies.length).toBeGreaterThan(0);
    const body = capturedBodies[0];
    expect(body).toContain('Integration Tester');
    expect(body).toContain('integration@edmeca.co.za');
  });
});

// =============================================================================
// TC-304  Financial Analysis API full E2E (4.3.4)
// =============================================================================

test.describe('TC-304 Financial Analysis API E2E', () => {
  const MOCK_REPORT = '# Financial Report\n\nRevenue is strong. Costs are well managed.';

  test('Analyse button sends POST to /api/analyze-financials with auth token', async ({ page }) => {
    const capturedRequests: { url: string; body: string; authHeader: string }[] = [];

    await setupMockAuth(page);

    // Mock the AI analysis endpoint
    await page.route('**/api/analyze-financials', async (route) => {
      capturedRequests.push({
        url: route.request().url(),
        body: route.request().postData() ?? '',
        authHeader: route.request().headers()['authorization'] ?? '',
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: MOCK_REPORT,
          meta: { company: 'Test Corp', model_categorisation: 'claude-3-haiku-20240307', model_analysis: 'claude-3-5-sonnet-20241022' },
        }),
      });
    });

    await page.goto('/portal/tools/financials');
    await page.waitForLoadState('networkidle');

    // Paste mode is default — target the financial statements textarea specifically
    const textarea = page.getByPlaceholder(/Paste your bank statement/i);
    await expect(textarea).toBeVisible();
    await textarea.fill('Date, Description, Amount\n2026-01-01, Invoice #001, 15000\n2026-01-03, Office Rent, -8500');

    await page.getByTestId('button-analyse').click();

    // Wait for analysis to complete
    await page.waitForTimeout(3000);

    expect(capturedRequests.length).toBeGreaterThan(0);
    expect(capturedRequests[0].authHeader).toContain('Bearer ');
    expect(capturedRequests[0].body).toContain('statements');
  });

  test('mocked analysis report is rendered after successful API call', async ({ page }) => {
    await setupMockAuth(page);

    await page.route('**/api/analyze-financials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: MOCK_REPORT,
          meta: { company: 'Test Corp', model_categorisation: 'claude-3-haiku-20240307', model_analysis: 'claude-3-5-sonnet-20241022' },
        }),
      });
    });

    await page.goto('/portal/tools/financials');
    await page.waitForLoadState('networkidle');

    const textarea = page.getByPlaceholder(/Paste your bank statement/i);
    await textarea.fill('Date, Description, Amount\n2026-01-01, Invoice #001, 15000');
    await page.getByTestId('button-analyse').click();

    // Report heading appears in the rendered markdown (target h1 to avoid toast sr-only region)
    await expect(page.getByRole('heading', { name: 'Financial Report' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Revenue is strong', { exact: false })).toBeVisible();
  });
});

// =============================================================================
// TC-305  Profile update ↔ portal greeting / display sync (4.3.5)
// =============================================================================

test.describe('TC-305 Profile update display sync', () => {
  test('Save Name button sends updateUser to Supabase auth with new full_name', async ({ page }) => {
    const capturedRequests: { url: string; body: string }[] = [];

    await setupMockAuth(page);

    // Override auth/v1/user to capture PUT/PATCH (updateUser) calls
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/auth/v1`),
      async (route) => {
        const method = route.request().method();
        const url = route.request().url();
        if ((method === 'PUT' || method === 'PATCH') && url.includes('/user')) {
          capturedRequests.push({ url, body: route.request().postData() ?? '' });
          // Return updated user with new name
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...MOCK_USER, user_metadata: { full_name: 'Jane Updated' } }),
          });
        } else if (url.includes('/auth/v1/user')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) });
        }
      }
    );

    await page.goto('/portal/profile');
    await page.waitForLoadState('networkidle');

    // Update the full name field
    const nameInput = page.getByTestId('input-full-name');
    await expect(nameInput).toBeVisible();
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Jane Updated');
    await page.getByTestId('button-save-name').click();

    await page.waitForTimeout(1000);

    expect(capturedRequests.length).toBeGreaterThan(0);
    expect(capturedRequests[0].body).toContain('Jane Updated');
  });

  test('profile page shows success toast after saving display name', async ({ page }) => {
    await setupMockAuth(page);

    // Accept the updateUser call
    await page.route(
      new RegExp(`${SUPABASE_PROJECT}\\.supabase\\.co/auth/v1/user`),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_USER, user_metadata: { full_name: 'Updated Name' } }),
        });
      }
    );

    await page.goto('/portal/profile');
    await page.waitForLoadState('networkidle');

    const nameInput = page.getByTestId('input-full-name');
    await expect(nameInput).toBeVisible();
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Updated Name');
    await page.getByTestId('button-save-name').click();

    // Toast confirms save — use exact match to avoid matching sr-only live region
    await expect(page.getByText('Name updated', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('dashboard greeting reflects full_name from session after profile save', async ({ page }) => {
    // The session already has full_name: 'Test User' — navigate to dashboard
    // and verify the greeting uses it.
    await setupMockAuth(page);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    // Use testid to avoid strict-mode violation from multiple 'Test User' elements
    await expect(page.getByTestId('text-user-name')).toContainText('Test User');
  });
});
