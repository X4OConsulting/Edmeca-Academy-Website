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
import { artifactsService } from '@/lib/services';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────
vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => React.createElement('a', { href }, children),
  useLocation: () => ['/portal/tools/bmc', vi.fn()],
}));

// Signed out unless a test calls signedIn() (the page saves only for signed-in users).
const authState = vi.hoisted(() => ({ isAuthenticated: false }));

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
  useAuth: () => ({ user: { id: 'user-1', email: 'test@edmeca.co.za' }, isLoading: false, isAuthenticated: authState.isAuthenticated }),
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
    authState.isAuthenticated = false;
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

  it('reset asks first, then brings back the company name screen', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    const resetBtn = await screen.findByTestId('button-reset');
    await userEvent.click(resetBtn);
    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByTestId('input-company-name')).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('keeps the canvas when reset is cancelled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderBMC();
    await userEvent.click(await screen.findByTestId('button-skip'));
    await userEvent.click(await screen.findByTestId('button-reset'));
    expect(screen.queryByTestId('input-company-name')).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it('progress percentage increases after typing into a prompt textarea', async () => {
    renderBMC();
    const skipBtn = await screen.findByTestId('button-skip');
    await userEvent.click(skipBtn);
    // Find the first prompt textarea and type into it
    const textarea = await screen.findByTestId('textarea-prompt-0');
    await userEvent.type(textarea, 'Test response for customer segment');
    // After typing, at least 1/9 sections should be non-zero
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

  describe('saved canvas', () => {
    const savedRow = (content: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
      id: 'bmc-row-1', status: 'in_progress', title: 'Acme — Business Model Canvas',
      updated_at: '2026-09-29T10:00:00Z', content, ...extra,
    });
    const signedIn = () => { authState.isAuthenticated = true; };

    it('opens the canvas saved in the database, not the name prompt', async () => {
      vi.mocked(artifactsService.getLatestArtifactByType).mockResolvedValueOnce(savedRow({
        companyName: 'Acme', canvas: { customerSegments: ['Solo designers'] },
      }) as never);
      renderBMC();
      expect(await screen.findByText('Acme')).toBeInTheDocument();
      expect(screen.queryByTestId('input-company-name')).not.toBeInTheDocument();
    });

    it('takes the name from the title for rows saved before companyName was stored', async () => {
      vi.mocked(artifactsService.getLatestArtifactByType).mockResolvedValueOnce(savedRow({
        canvas: { customerSegments: ['Solo designers'] },
      }, { title: 'Older Co — Business Model Canvas' }) as never);
      renderBMC();
      expect(await screen.findByText('Older Co')).toBeInTheDocument();
    });

    it('autosaves edits into the same row with the name and the canvas by position', async () => {
      signedIn();
      vi.mocked(artifactsService.getLatestArtifactByType).mockResolvedValueOnce(savedRow({
        companyName: 'Acme', canvas: { customerSegments: ['', 'Second answer'] },
      }) as never);
      renderBMC();
      await screen.findByText('Acme');
      await userEvent.type(await screen.findByTestId('textarea-prompt-0'), 'First answer');
      await waitFor(() => expect(artifactsService.saveArtifact).toHaveBeenCalled(), { timeout: 4000 });
      const [id, payload] = vi.mocked(artifactsService.saveArtifact).mock.calls.at(-1)!;
      expect(id).toBe('bmc-row-1');
      expect(payload).toMatchObject({ toolType: 'bmc', status: 'in_progress', title: 'Acme — Business Model Canvas' });
      const content = payload.content as { companyName: string; canvas: Record<string, string[]> };
      expect(content.companyName).toBe('Acme');
      expect(content.canvas.customerSegments).toEqual(['First answer', 'Second answer']);
    }, 10000);

    it('does not save anything just from opening a saved canvas', async () => {
      signedIn();
      vi.mocked(artifactsService.getLatestArtifactByType).mockResolvedValueOnce(savedRow({ companyName: 'Acme', canvas: {} }) as never);
      renderBMC();
      await screen.findByText('Acme');
      await new Promise((resolve) => setTimeout(resolve, 2500));
      expect(artifactsService.saveArtifact).not.toHaveBeenCalled();
    }, 10000);
  });
});
