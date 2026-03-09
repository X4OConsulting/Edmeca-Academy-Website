/**
 * 4.2.7 — Financial Analysis Tool unit tests
 *
 * vi.mock() calls are hoisted above imports by Vitest.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import FinancialAnalysisTool from '@/pages/portal/FinancialAnalysisTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/financials', vi.fn()],
}));

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
}));

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));

vi.mock('@/lib/services', () => ({
  profileService: { getUserProfile: vi.fn().mockResolvedValue({ businessName: 'EdMeCa Test' }) },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isLoading: false }),
}));

// FileUploadZone uses pdfjs-dist — stub it
vi.mock('@/components/portal/FileUploadZone', () => ({
  FileUploadZone: ({ onUpload }: any) =>
    React.createElement('button', {
      'data-testid': 'file-upload-zone',
      onClick: () =>
        onUpload({ fileName: 'report.pdf', fileType: 'application/pdf', text: 'Revenue: R100k' }),
    }, 'Upload Zone Stub'),
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'markdown' }, children),
}));
vi.mock('remark-gfm', () => ({ default: vi.fn() }));

vi.mock('@/lib/exportReport', () => ({
  exportToWord: vi.fn().mockResolvedValue(undefined),
  exportToPDF: vi.fn(),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderFinancial() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FinancialAnalysisTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('FinancialAnalysisTool', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token-123' } },
      error: null,
    });
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the paste mode textarea by default', async () => {
    renderFinancial();
    expect(
      await screen.findByPlaceholderText(/paste your bank statement/i)
    ).toBeInTheDocument();
  });

  it('Analyse button is disabled when statements are empty', async () => {
    renderFinancial();
    const btn = await screen.findByTestId('button-analyse');
    expect(btn).toBeDisabled();
  });

  it('Analyse button becomes enabled after typing statements', async () => {
    renderFinancial();
    const textarea = await screen.findByPlaceholderText(/paste your bank statement/i);
    await userEvent.type(textarea, 'Revenue 1000');
    expect(screen.getByTestId('button-analyse')).not.toBeDisabled();
  });

  it('can switch to Upload mode and see upload zone', async () => {
    renderFinancial();
    await screen.findByPlaceholderText(/paste your bank statement/i);
    // The "Upload File" button is inside a flex container (not a <Button> component)
    const uploadToggle = screen.getByText(/Upload File/i);
    await userEvent.click(uploadToggle);
    expect(await screen.findByTestId('file-upload-zone')).toBeInTheDocument();
  });

  it('renders Quick Snapshot and Deep Analysis mode selectors', async () => {
    renderFinancial();
    expect(await screen.findByTestId('button-mode-quick')).toBeInTheDocument();
    expect(screen.getByTestId('button-mode-deep')).toBeInTheDocument();
  });

  it('clicking Analyse dispatches fetch with Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        report: '## Report\nAll good.',
        meta: { company: 'EdMeCa', model_categorisation: 'Haiku', model_analysis: 'Sonnet' },
      }),
    });

    renderFinancial();
    const textarea = await screen.findByPlaceholderText(/paste your bank statement/i);
    await userEvent.type(textarea, 'Date, Desc, Amount\n2024-01-01, Client, 10000');
    await userEvent.click(screen.getByTestId('button-analyse'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/api/analyze-financials');
    expect(opts.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('displays error message in UI when API returns an error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Financial data exceeds maximum allowed size (50 000 characters)',
      }),
    });

    renderFinancial();
    const textarea = await screen.findByPlaceholderText(/paste your bank statement/i);
    await userEvent.type(textarea, 'Some data here');
    await userEvent.click(screen.getByTestId('button-analyse'));

    expect(
      await screen.findByText(/financial data exceeds maximum allowed size/i)
    ).toBeInTheDocument();
  });

  it('displays the analysis report markdown after a successful API call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        report: '## Summary\nRevenue looks healthy.',
        meta: { company: 'EdMeCa', model_categorisation: 'Haiku', model_analysis: 'Sonnet' },
      }),
    });

    renderFinancial();
    const textarea = await screen.findByPlaceholderText(/paste your bank statement/i);
    await userEvent.type(textarea, 'Date, Amount\n2024-01-01, 5000');
    await userEvent.click(screen.getByTestId('button-analyse'));

    expect(await screen.findByTestId('markdown')).toBeInTheDocument();
  });
});
