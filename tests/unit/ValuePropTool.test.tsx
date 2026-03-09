/**
 * 4.2.4 — Value Proposition Tool unit tests
 *
 * vi.mock() calls are hoisted above imports by Vitest.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ValuePropTool from '@/pages/portal/ValuePropTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/value-prop', vi.fn()],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  },
}));

vi.mock('@/lib/services', () => ({
  profileService: { getUserProfile: vi.fn().mockResolvedValue({ business_name: 'EdMeCa' }) },
  artifactsService: {
    getLatestArtifactByType: vi.fn().mockResolvedValue(null),
    saveArtifact: vi.fn().mockResolvedValue('artifact-id-vp'),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@edmeca.co.za' }, isLoading: false }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderValueProp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ValuePropTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('ValuePropTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Customer Profile view by default with Jobs, Pains, Gains', async () => {
    renderValueProp();
    expect(await screen.findByText(/Customer Jobs/i)).toBeInTheDocument();
    expect(screen.getByText('Pains')).toBeInTheDocument();
    expect(screen.getByText('Gains')).toBeInTheDocument();
  });

  it('renders a Value Map tab button', async () => {
    renderValueProp();
    const tab = await screen.findByRole('button', { name: /value map/i });
    expect(tab).toBeInTheDocument();
  });

  it('switching to Value Map shows Products, Pain Relievers and Gain Creators', async () => {
    renderValueProp();
    const valueMapTab = await screen.findByRole('button', { name: /value map/i });
    await userEvent.click(valueMapTab);
    expect(await screen.findByText(/Products & Services/i)).toBeInTheDocument();
    expect(screen.getByText('Pain Relievers')).toBeInTheDocument();
    expect(screen.getByText('Gain Creators')).toBeInTheDocument();
  });

  it('can add an item to Customer Jobs', async () => {
    renderValueProp();
    await screen.findByText(/Customer Jobs/i);
    const inputs = screen.getAllByPlaceholderText(/add|enter/i);
    await userEvent.type(inputs[0], 'Learn new skills');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('Learn new skills')).toBeInTheDocument());
  });

  it('can add an item to Customer Pains', async () => {
    renderValueProp();
    await screen.findByText('Pains');
    const inputs = screen.getAllByPlaceholderText(/^Add /i);
    await userEvent.type(inputs[1], 'High course costs');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('High course costs')).toBeInTheDocument());
  });

  it('renders a Fit Analysis tab button', async () => {
    renderValueProp();
    const fitTab = await screen.findByRole('button', { name: /fit/i });
    expect(fitTab).toBeInTheDocument();
  });

  it('Save Draft button is present', async () => {
    renderValueProp();
    expect(await screen.findByRole('button', { name: /save draft/i })).toBeInTheDocument();
  });

  it('switching to Fit view shows the Value Fit analysis section', async () => {
    renderValueProp();
    const fitTab = await screen.findByTestId('button-tab-fit');
    await userEvent.click(fitTab);
    expect(await screen.findByText(/Value Fit is achieved/i)).toBeInTheDocument();
  });

  it('can add an item to Gain Creators in Value Map', async () => {
    renderValueProp();
    const valueMapTab = await screen.findByTestId('button-tab-value');
    await userEvent.click(valueMapTab);
    await screen.findByText('Gain Creators');
    const gcInput = screen.getByPlaceholderText('Add gain creator…');
    await userEvent.type(gcInput, 'Saves 5 hours per week');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('Saves 5 hours per week')).toBeInTheDocument());
  });
});
