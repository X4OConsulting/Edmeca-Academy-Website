/**
 * 4.2.5 — Pitch Builder Tool unit tests
 *
 * vi.mock() calls are hoisted above imports by Vitest.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import PitchBuilderTool from '@/pages/portal/PitchBuilderTool';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/pitch', vi.fn()],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  },
}));

vi.mock('@/lib/services', () => ({
  profileService: { getUserProfile: vi.fn().mockResolvedValue({ business_name: 'EdMeCa Test' }) },
  artifactsService: {
    getLatestArtifactByType: vi.fn().mockResolvedValue(null),
    saveArtifact: vi.fn().mockResolvedValue('artifact-id-pitch'),
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
function renderPitch() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PitchBuilderTool />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('PitchBuilderTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor view showing the Problem section first', async () => {
    renderPitch();
    expect(await screen.findByText('Slide 1: The Problem')).toBeInTheDocument();
  });

  it('renders the Next section navigation button', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeInTheDocument();
  });

  it('clicking Next advances to the Solution section', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText('Slide 2: Our Solution')).toBeInTheDocument();
  });

  it('clicking Prev from Solution returns to Problem', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Slide 2: Our Solution');
    await userEvent.click(screen.getByRole('button', { name: 'Prev' }));
    expect(await screen.findByText('Slide 1: The Problem')).toBeInTheDocument();
  });

  it('text typed in Problem persists after navigating away and back', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    const textarea = screen.getByPlaceholderText('What problem are you solving? Why does it matter?');
    await userEvent.type(textarea, 'Entrepreneurs lack structured tools');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Slide 2: Our Solution');
    await userEvent.click(screen.getByRole('button', { name: 'Prev' }));
    await screen.findByText('Slide 1: The Problem');
    expect(screen.getByPlaceholderText('What problem are you solving? Why does it matter?')).toHaveValue('Entrepreneurs lack structured tools');
  });

  it('renders the Preview toggle button', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    expect(screen.getByTestId('button-toggle-preview')).toBeInTheDocument();
  });

  it('clicking Preview hides the section editor textarea', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    await userEvent.click(screen.getByTestId('button-toggle-preview'));
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('What problem are you solving? Why does it matter?')
      ).not.toBeInTheDocument();
    });
  });

  it('renders the Save Draft button', async () => {
    renderPitch();
    await screen.findByText('Slide 1: The Problem');
    expect(screen.getByTestId('button-save-draft')).toBeInTheDocument();
  });
});
