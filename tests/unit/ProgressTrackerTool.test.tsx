/**
 * 4.2.6 — Progress Tracker Tool unit tests
 *
 * vi.mock() calls are hoisted above imports by Vitest.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ProgressTrackerTool from '@/pages/portal/ProgressTrackerTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/progress', vi.fn()],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  },
}));

const { mockProgressService } = vi.hoisted(() => ({
  mockProgressService: {
    getProgressEntries: vi.fn().mockResolvedValue([]),
    createProgressEntry: vi.fn().mockResolvedValue({ id: 'entry-1', milestone: 'Test milestone' }),
    deleteProgressEntry: vi.fn().mockResolvedValue(undefined),
    toggleComplete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/services', () => ({
  profileService: { getUserProfile: vi.fn().mockResolvedValue({ business_name: 'EdMeCa' }) },
  artifactsService: {
    getArtifacts: vi.fn().mockResolvedValue([]),
    getLatestArtifactByType: vi.fn().mockResolvedValue(null),
    saveArtifact: vi.fn().mockResolvedValue('artifact-id-1'),
  },
  progressService: mockProgressService,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@edmeca.co.za' }, isLoading: false }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function renderProgress() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ProgressTrackerTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('ProgressTrackerTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressService.getProgressEntries.mockResolvedValue([]);
    mockProgressService.createProgressEntry.mockResolvedValue({ id: 'entry-1', milestone: 'Test' });
  });

  it('renders the Tool Overview tab by default', async () => {
    renderProgress();
    expect(await screen.findByTestId('button-tab-overview')).toBeInTheDocument();
  });

  it('shows the milestones tab button', async () => {
    renderProgress();
    expect(await screen.findByTestId('button-tab-milestones')).toBeInTheDocument();
  });

  it('shows overall programme progress bar', async () => {
    renderProgress();
    expect(await screen.findByText(/Overall Programme Progress/i)).toBeInTheDocument();
  });

  it('overview contains at least 4 tool status cards with action buttons', async () => {
    renderProgress();
    await screen.findByTestId('button-tab-overview');
    await waitFor(() => {
      const actionBtns = screen.getAllByRole('button', { name: /start|continue|view/i });
      expect(actionBtns.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('switching to Milestones shows the milestone input', async () => {
    renderProgress();
    const milestonesBtn = await screen.findByTestId('button-tab-milestones');
    await userEvent.click(milestonesBtn);
    expect(await screen.findByTestId('input-milestone')).toBeInTheDocument();
  });

  it('can type a milestone description in the input', async () => {
    renderProgress();
    const milestonesBtn = await screen.findByTestId('button-tab-milestones');
    await userEvent.click(milestonesBtn);
    const input = await screen.findByTestId('input-milestone');
    await userEvent.type(input, 'Finished my BMC');
    expect(input).toHaveValue('Finished my BMC');
  });

  it('submitting the milestone form calls createProgressEntry', async () => {
    renderProgress();
    const milestonesBtn = await screen.findByTestId('button-tab-milestones');
    await userEvent.click(milestonesBtn);
    const input = await screen.findByTestId('input-milestone');
    await userEvent.type(input, 'Pitch deck complete');
    const logBtn = screen.getByRole('button', { name: /log milestone/i });
    await userEvent.click(logBtn);
    await waitFor(() => expect(mockProgressService.createProgressEntry).toHaveBeenCalledTimes(1));
  });
});
