/**
 * 4.2.3 — SWOT & PESTLE Tool unit tests
 *
 * vi.mock() calls are hoisted above imports by Vitest.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import SWOTPestleTool from '@/pages/portal/SWOTPestleTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/analysis', vi.fn()],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  },
}));

vi.mock('@/lib/services', () => ({
  profileService: { getUserProfile: vi.fn().mockResolvedValue({ business_name: 'Test Co' }) },
  artifactsService: {
    getLatestArtifactByType: vi.fn().mockResolvedValue(null),
    saveArtifact: vi.fn().mockResolvedValue('artifact-id-swot'),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@edmeca.co.za' }, isLoading: false }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderSWOT() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SWOTPestleTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('SWOTPestleTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the SWOT view by default with 4 quadrant headings', async () => {
    renderSWOT();
    expect(await screen.findByText(/Strengths/i)).toBeInTheDocument();
    expect(screen.getByText(/Weaknesses/i)).toBeInTheDocument();
    expect(screen.getByText(/Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/Threats/i)).toBeInTheDocument();
  });

  it('renders a tab button to switch to PESTLE view', async () => {
    renderSWOT();
    const pestleTab = await screen.findByTestId('button-tab-pestle');
    expect(pestleTab).toBeInTheDocument();
  });

  it('switching to PESTLE shows the 6 PESTLE categories', async () => {
    renderSWOT();
    const pestleTab = await screen.findByTestId('button-tab-pestle');
    await userEvent.click(pestleTab);
    expect(await screen.findByText('Political')).toBeInTheDocument();
    expect(screen.getByText('Economic')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Technological')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Environmental')).toBeInTheDocument();
  });

  it('can add an item to the Strengths quadrant', async () => {
    renderSWOT();
    await screen.findByText(/Strengths/i);
    // The first add-item input belongs to Strengths
    const inputs = screen.getAllByPlaceholderText(/^Add /i);
    await userEvent.type(inputs[0], 'Strong team');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Strong team')).toBeInTheDocument();
  });

  it('shows the Save Draft button', async () => {
    renderSWOT();
    expect(await screen.findByTestId('button-save-draft')).toBeInTheDocument();
  });

  it('company name input is present in the header', async () => {
    renderSWOT();
    expect(await screen.findByTestId('input-company-name')).toBeInTheDocument();
  });

  it('switching back to SWOT from PESTLE restores SWOT headings', async () => {
    renderSWOT();
    const pestleTab = await screen.findByTestId('button-tab-pestle');
    await userEvent.click(pestleTab);
    await screen.findByText('Political');
    const swotTab = screen.getByTestId('button-tab-swot');
    await userEvent.click(swotTab);
    expect(await screen.findByText(/Strengths/i)).toBeInTheDocument();
  });

  it('summary view shows SWOT Summary and PESTLE Summary headings', async () => {
    renderSWOT();
    const summaryTab = await screen.findByTestId('button-tab-summary');
    await userEvent.click(summaryTab);
    expect(await screen.findByText(/SWOT Summary/i)).toBeInTheDocument();
    expect(screen.getByText('PESTLE Summary')).toBeInTheDocument();
  });

  it('clicking a quick-add item in SWOT adds it to the list', async () => {
    renderSWOT();
    await screen.findByText(/Strengths/i);
    // Quick-add items render as "+ Text" clickable badges
    const quickBtn = await screen.findByText(/Experienced founding team/i);
    await userEvent.click(quickBtn);
    await waitFor(() =>
      expect(screen.getByText('Experienced founding team')).toBeInTheDocument()
    );
  });
});
