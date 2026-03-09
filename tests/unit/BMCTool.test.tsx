/**
 * 4.2.2 — BMC Tool unit tests
 *
 * vi.mock() calls are hoisted above import statements by Vitest's transform,
 * so mocks are in place before the component module is first evaluated.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import BMCTool from '@/pages/portal/BMCTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/bmc', vi.fn()],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  },
}));

vi.mock('@/lib/services', () => ({
  profileService: {
    getUserProfile: vi.fn().mockResolvedValue({ business_name: '' }),
    upsertUserProfile: vi.fn().mockResolvedValue({}),
  },
  artifactsService: {
    getLatestArtifactByType: vi.fn().mockResolvedValue(null),
    saveArtifact: vi.fn().mockResolvedValue('artifact-id-bmc'),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@edmeca.co.za' }, isLoading: false }),
}));

vi.mock('docx', () => ({
  Document: vi.fn(), Paragraph: vi.fn(), TextRun: vi.fn(),
  HeadingLevel: {}, AlignmentType: {},
  Packer: { toBlob: vi.fn().mockResolvedValue(new Blob()) },
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

// ── Helper ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'business-model-canvas';

function renderBMC() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BMCTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('BMCTool', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the company name input prompt on first load', async () => {
    renderBMC();
    expect(await screen.findByTestId('input-company-name')).toBeInTheDocument();
  });

  it('continue button is disabled when company name input is empty', async () => {
    renderBMC();
    const btn = await screen.findByTestId('button-continue');
    expect(btn).toBeDisabled();
  });

  it('continue button becomes enabled after typing a company name', async () => {
    renderBMC();
    const input = await screen.findByTestId('input-company-name');
    await userEvent.type(input, 'EdMeCa');
    const btn = screen.getByTestId('button-continue');
    expect(btn).not.toBeDisabled();
  });

  it('skipping the company name shows the guided view', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    expect(await screen.findByTestId('text-section-title')).toBeInTheDocument();
  });

  it('submitting a company name shows it in the breadcrumb', async () => {
    renderBMC();
    const input = await screen.findByTestId('input-company-name');
    await userEvent.type(input, 'EdMeCa Academy');
    await userEvent.click(screen.getByTestId('button-continue'));
    expect(await screen.findByText(/EdMeCa Academy/i)).toBeInTheDocument();
  });

  it('guided view shows 0/9 sections completed when canvas is empty', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    expect(await screen.findByText(/0\/9/i)).toBeInTheDocument();
  });

  it('view switcher buttons are rendered once company name screen is passed', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    expect(await screen.findByTestId('button-view-canvas')).toBeInTheDocument();
  });

  it('clicking Canvas view button switches to canvas view', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    const canvasBtn = await screen.findByTestId('button-view-canvas');
    await userEvent.click(canvasBtn);
    // Canvas view no longer shows the guided section title
    await waitFor(() =>
      expect(screen.queryByTestId('text-section-title')).not.toBeInTheDocument()
    );
  });

  it('reset button clears localStorage and brings back the company name screen', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    const resetBtn = await screen.findByTestId('button-reset');
    await userEvent.click(resetBtn);
    expect(await screen.findByTestId('input-company-name')).toBeInTheDocument();
  });

  it('progress percentage increases after adding items to a section', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    // Find the text input for the current section and add an item
    const addInput = await screen.findByPlaceholderText(/add|type/i);
    await userEvent.type(addInput, 'Test item');
    await userEvent.keyboard('{Enter}');
    // After adding, at least 1/9 sections should be non-zero
    await waitFor(() => {
      const progress = screen.queryByText(/1\/9/i);
      const percentText = screen.queryByText(/11%/i);
      expect(progress || percentText).toBeTruthy();
    });
  });

  it('dashboard view renders canvas overview and stats', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    const dashBtn = await screen.findByTestId('button-view-dashboard');
    await userEvent.click(dashBtn);
    expect(await screen.findByTestId('text-dashboard-title')).toBeInTheDocument();
    expect(screen.getByTestId('stat-completion')).toBeInTheDocument();
  });
});
